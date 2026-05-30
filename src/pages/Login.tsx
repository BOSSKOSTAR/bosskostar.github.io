import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
        <h1 className="text-2xl font-bold font-display mb-6 text-center" style={{color: 'var(--gold)'}}>TizerPro</h1>
        <h2 className="text-xl font-bold mb-6 text-center" style={{color: 'var(--text-primary)'}}>Вход в систему</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Email</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" required style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Пароль</label>
            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••" required style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>
            {loading ? 'Входим...' : 'Войти'}
          </Button>
        </form>
        <p className="text-center mt-4 text-sm" style={{color: 'var(--text-muted)'}}>
          Нет аккаунта? <Link to="/register" style={{color: 'var(--gold)'}}>Зарегистрироваться</Link>
        </p>
        <p className="text-center mt-2 text-sm">
          <Link to="/" style={{color: 'var(--text-muted)'}}>← На главную</Link>
        </p>
      </div>
    </div>
  );
}