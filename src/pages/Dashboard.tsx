import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import AdvertiserDashboard from '@/components/dashboard/AdvertiserDashboard';
import WebmasterDashboard from '@/components/dashboard/WebmasterDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  if (loading || !user) return (
    <div className="relative z-10 min-h-screen flex items-center justify-center" style={{backgroundColor: 'var(--charcoal)'}}>
      <div style={{color: 'var(--gold)'}}>Загрузка...</div>
    </div>
  );

  return (
    <div className="relative z-10 min-h-screen" style={{color: 'var(--text-primary)'}}>
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between" style={{borderColor: 'var(--line)', backgroundColor: 'var(--charcoal-mid)'}}>
        <span className="text-xl font-bold font-display" style={{color: 'var(--gold)'}}>TizerPro</span>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{color: 'var(--text-muted)'}}>
            {user.name} · <span style={{color: 'var(--gold)'}}>
              {user.role === 'advertiser' ? `${user.balance.toFixed(2)} ₽` : user.role === 'admin' ? 'Админ' : 'Вебмастер'}
            </span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }} style={{color: 'var(--text-muted)'}}>
            <Icon name="LogOut" size={16} />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {user.role === 'admin' && <AdminDashboard />}
        {user.role === 'advertiser' && <AdvertiserDashboard user={user} />}
        {user.role === 'webmaster' && <WebmasterDashboard user={user} />}
      </main>
    </div>
  );
}