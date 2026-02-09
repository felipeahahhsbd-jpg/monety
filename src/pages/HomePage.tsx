import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import CheckIn from '../components/CheckIn';
import Roulette from '../components/Roulette';
import { TrendingUp, Users, Wallet, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, token } = useAuth(); // Assume que useAuth também poderia retornar um 'isLoading' global
  // Inicializa com valores zerados seguros
  const [stats, setStats] = useState({ todayEarnings: 0, newInvites: 0 });
  // Loading local para o fetch da API
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    // Só chama a API se o token existir
    if (token) {
      fetchStats();
    }
  }, [token]); // <--- CRUCIAL: Re-executa quando o token for gerado

  const fetchStats = async () => {
    if (!token) return;
    
    setLoadingStats(true);
    try {
      const response = await fetch('/api/stats/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Verifica se a resposta é JSON válido antes de tentar parsear
      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json();
        setStats(data);
      } else {
        console.warn("API retornou erro ou não é JSON:", response.status);
        // Opcional: Tratar erros 401 (token expirado) aqui
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Fallback silencioso: mantém os dados zerados, não quebra a tela
    } finally {
      setLoadingStats(false);
    }
  };

  const getUserInitial = () => {
    return user?.email?.charAt(0).toUpperCase() || 'M';
  };

  // Previne erros de cálculo se os dados do usuário ainda não carregaram
  const userBalance = Number(user?.balance || 0);
  const userTotalEarned = Number(user?.totalEarned || 0);

  // Se o usuário ainda não carregou do Firebase, mostra loading simples
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
         <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <p className="text-gray-400 text-sm">Bem-vindo de volta</p>
          <h1 className="text-xl font-bold text-white">
            {user?.email?.split('@')[0] || 'Usuário'}
          </h1>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center shadow-lg shadow-[#22c55e]/30">
          <span className="text-xl font-bold text-white">{getUserInitial()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#111111]/80 backdrop-blur-sm border-[#1a1a1a] animate-fade-in">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              </div>
              <span className="text-gray-400 text-sm">Ganhos Hoje</span>
            </div>
            <p className="text-2xl font-bold text-[#22c55e]">
              {loadingStats ? (
                <span className="text-sm text-gray-500">...</span>
              ) : (
                `R$ ${stats.todayEarnings.toFixed(2)}`
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111111]/80 backdrop-blur-sm border-[#1a1a1a] animate-fade-in">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-[#22c55e]" />
              </div>
              <span className="text-gray-400 text-sm">Convidados</span>
            </div>
            <p className="text-2xl font-bold text-[#22c55e]">
               {loadingStats ? "..." : stats.newInvites}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balance Card */}
      <Card className="bg-[#111111]/80 backdrop-blur-sm border-[#22c55e]/30 animate-fade-in">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-[#22c55e]" />
            <span className="text-gray-400 text-sm">Saldo Disponível</span>
          </div>
          <p className="text-3xl font-extrabold text-white mb-3">
            R$ {userBalance.toFixed(2)}
          </p>
          <div className="pt-3 border-t border-[#1a1a1a]">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Ganhos</span>
              <span className="text-[#22c55e] font-semibold">
                R$ {userTotalEarned.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Check-in */}
      <Card className="bg-[#111111]/80 backdrop-blur-sm border-[#1a1a1a] animate-fade-in">
        <CardContent className="pt-6">
          <h3 className="text-white font-bold mb-4">Login Diário</h3>
          <CheckIn onCheckInComplete={fetchStats} />
        </CardContent>
      </Card>

      {/* Roulette */}
      <div className="animate-fade-in">
        <Roulette onSpinComplete={fetchStats} />
      </div>
    </div>
  );
}
