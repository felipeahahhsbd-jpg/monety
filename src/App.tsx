// App.tsx
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProfilePage from './pages/ProfilePage';
import TeamPage from './pages/TeamPage';
import { Home, ShoppingBag, Users, User, Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';

function AppContent() {
  // Adicione 'loading' e 'token' aqui para maior controle
  const { user, token, logout, loading } = useAuth() as any; 
  const [currentPage, setCurrentPage] = useState<'home' | 'products' | 'team' | 'profile'>('home');
  const [showAuth, setShowAuth] = useState<'login' | 'register'>('login');

  // Se o contexto estiver verificando o login no início, mostre um loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#22c55e] animate-spin mb-4" />
        <p className="text-gray-400 animate-pulse">Carregando Monety...</p>
      </div>
    );
  }

  // Se não tiver usuário NEM token, mostra Login/Registro
  // Verificamos o token também porque ele costuma ser preenchido antes do perfil completo
  if (!user && !token) {
    return (
      <>
        {showAuth === 'login' ? (
          <LoginPage onSwitchToRegister={() => setShowAuth('register')} />
        ) : (
          <RegisterPage onSwitchToLogin={() => setShowAuth('login')} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 animate-fade-in">
      <header className="bg-[#111111] border-b border-[#1a1a1a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
            <span className="text-2xl font-bold text-white">Monety</span>
          </div>
          <button
            onClick={logout}
            className="text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'products' && <ProductsPage />}
        {currentPage === 'team' && <TeamPage />}
        {currentPage === 'profile' && <ProfilePage />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#111111]/95 backdrop-blur-md border-t border-[#1a1a1a] z-50">
        <div className="max-w-7xl mx-auto px-2">
          <div className="grid grid-cols-4 gap-1">
            <NavButton icon={<Home />} label="Início" active={currentPage === 'home'} onClick={() => setCurrentPage('home')} />
            <NavButton icon={<ShoppingBag />} label="Produtos" active={currentPage === 'products'} onClick={() => setCurrentPage('products')} />
            <NavButton icon={<Users />} label="Equipe" active={currentPage === 'team'} onClick={() => setCurrentPage('team')} />
            <NavButton icon={<User />} label="Perfil" active={currentPage === 'profile'} onClick={() => setCurrentPage('profile')} />
          </div>
        </div>
      </nav>
    </div>
  );
}

// Sub-componente para limpar o código do AppContent
function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-3 rounded-lg transition-all ${
        active ? 'text-[#22c55e]' : 'text-gray-400 hover:text-white'
      }`}
    >
      {active && <div className="absolute w-8 h-8 bg-[#22c55e]/10 rounded-full -z-10" />}
      {cloneElement(icon, { className: "w-6 h-6 mb-1" })}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}

import { cloneElement } from 'react';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}
