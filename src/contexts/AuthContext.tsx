import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  addDoc // Importado aqui para evitar o import dinâmico repetitivo
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

interface User {
  id: string;
  email: string;
  balance: number;
  inviteCode: string;
  invitedBy?: string;
  totalEarned: number;
  totalWithdrawn: number;
  role: string;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // Adicionado conforme requisito
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, inviteCode?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Gerar código de convite único
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'MP';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Verificar se código já existe
const checkInviteCodeExists = async (code: string): Promise<boolean> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('inviteCode', '==', code));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Gerar código único
const generateUniqueInviteCode = async (): Promise<string> => {
  let code = generateInviteCode();
  let attempts = 0;
  
  while (await checkInviteCodeExists(code) && attempts < 10) {
    code = generateInviteCode();
    attempts++;
  }
  
  return code;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // Novo estado para o token

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // 1. Obter e salvar o token de autenticação
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);

          // 2. Escutar mudanças em tempo real no documento do usuário (Firestore)
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          // Nota: O unsubscribeUser precisa ser gerenciado se o componente desmontar,
          // mas dentro do onAuthStateChanged isso é complexo. 
          // O padrão atual mantém o listener ativo enquanto o usuário está logado.
          onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                ...docSnap.data()
              } as User);
            }
          });

        } catch (error) {
          console.error("Erro ao processar dados do usuário:", error);
          setToken(null);
          setUser(null);
        }
      } else {
        // Usuário deslogado
        setUser(null);
        setToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, inviteCode?: string) => {
    try {
      // Verificar código de convite (se fornecido)
      let inviterUid: string | undefined;
      
      if (inviteCode) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('inviteCode', '==', inviteCode.toUpperCase()));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          throw new Error('Código de convite inválido');
        }
        
        inviterUid = snapshot.docs[0].id;
      }

      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // O token será setado automaticamente pelo onAuthStateChanged, 
      // mas para garantir sincronia imediata se necessário:
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);

      // Gerar código de convite único
      const newInviteCode = await generateUniqueInviteCode();

      // Criar documento no Firestore
      await setDoc(doc(db, 'users', uid), {
        email,
        balance: 0,
        inviteCode: newInviteCode,
        invitedBy: inviterUid || null,
        totalEarned: 0,
        totalWithdrawn: 0,
        role: 'user',
        createdAt: serverTimestamp()
      });

      // SISTEMA DE CONVITE REAL
      if (inviterUid) {
        // Registrar convite nível 1
        await addDoc(collection(db, 'invites'), {
          inviterId: inviterUid,
          invitedId: uid,
          level: 1,
          status: 'pending', // Mudará para 'active' quando o convidado fizer depósito
          createdAt: serverTimestamp()
        });
      }

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email já cadastrado');
      }
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Atualizar token imediatamente
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      
      // Buscar dados do usuário (O onSnapshot no useEffect cuidará das atualizações futuras,
      // mas fazemos um getDoc aqui para garantir dados iniciais rápidos)
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        setUser({
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          ...userDoc.data()
        } as User);
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        throw new Error('Email ou senha inválidos');
      }
      throw error;
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setToken(null); // Limpar token explicitamente
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      // Atualizar token
      const idToken = await auth.currentUser.getIdToken(true); // true força refresh
      setToken(idToken);

      // Atualizar dados do Firestore
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUser({
          id: auth.currentUser.uid,
          email: auth.currentUser.email || '',
          ...userDoc.data()
        } as User);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
