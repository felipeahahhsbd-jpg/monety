import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export default function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { login, user } = useAuth(); // Pega 'user' também para verificar estado
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Proteção de Rota: Se já existe usuário logado, redireciona imediatamente
  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true }); // 'replace: true' evita que o usuário volte ao login com o botão "Voltar"
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      
      // 2. Feedback visual imediato
      toast.success('🎉 Bem-vindo ao Monety!', {
        description: 'Login realizado com sucesso',
        duration: 3000
      });

      // 3. Navegação explícita após o login bem-sucedido
      navigate('/home'); 

    } catch (err: any) {
      console.error(err);
      
      // Tratamento de erros comuns do Firebase para mensagens mais amigáveis
      let errorMessage = 'Erro ao fazer login';
      if (err.code === 'auth/invalid-credential' || err.message?.includes('invalid-credential')) {
        errorMessage = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas falhas. Tente novamente mais tarde.';
      }

      setError(errorMessage);
      toast.error('Falha no login', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#22c55e]/30">
            <span className="text-5xl font-bold text-white">M</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Monety</h1>
          <p className="text-gray-400">Plataforma de Investimentos</p>
        </div>

        {/* Login Form Container */}
        <div className="bg-[#111111]/80 backdrop-blur-sm border border-[#1a1a1a] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Entrar</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo E-mail */}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e] transition-all"
              />
            </div>

            {/* Campo Senha */}
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#22c55e] text-white font-semibold py-4 text-lg shadow-lg shadow-[#22c55e]/30 transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Footer / Switch to Register */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Não tem uma conta?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-[#22c55e] hover:text-[#16a34a] font-semibold transition-colors hover:underline"
              >
                Registrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
