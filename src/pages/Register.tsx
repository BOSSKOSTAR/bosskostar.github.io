import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(searchParams.get('role') || 'advertiser');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, role });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{backgroundColor: 'var(--charcoal)'}}>
      <div className="w-full max-w-md p-8 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
        <h1 className="text-2xl font-bold font-display mb-6 text-center" style={{color: 'var(--gold)'}}>TizerPro</h1>
        <h2 className="text-xl font-bold mb-6 text-center" style={{color: 'var(--text-primary)'}}>Регистрация</h2>

        <div className="flex gap-2 mb-6">
          {['advertiser', 'webmaster'].map(r => (
            <button key={r} onClick={() => setRole(r)} className="flex-1 py-2 rounded text-sm font-medium transition-colors"
              style={{backgroundColor: role === r ? 'var(--gold)' : 'var(--charcoal)', color: role === r ? '#111318' : 'var(--text-muted)', border: '1px solid var(--line)'}}>
              {r === 'advertiser' ? 'Рекламодатель' : 'Вебмастер'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Имя</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя" required style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Email</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" required style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Пароль</label>
            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Минимум 6 символов" required minLength={6} style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>
            {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
          </Button>
        </form>
        <p className="text-center mt-4 text-sm" style={{color: 'var(--text-muted)'}}>
          Есть аккаунт? <Link to="/login" style={{color: 'var(--gold)'}}>Войти</Link>
        </p>
      </div>
    </div>
  );
}
