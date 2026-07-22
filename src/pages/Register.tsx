import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase
const supabaseUrl = 'https://supabase.co';
const supabaseKey = 'sb_publishable_8lh0pIQKFqHJul0SGvER0w__SY9r6Gm';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading('true');
    try {
      const { data, error: sbError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            display_name: name,
          }
        }
      });

      if (sbError) throw sbError;

      if (data.user) {
        alert('УРА! Вы успешно зарегистрированы в базе Supabase!');
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации в Supabase');
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#141414] p-8 rounded-xl border border-neutral-800 max-w-md w-full text-white">
        <h2 className="text-2xl font-bold text-center mb-6 text-amber-500">Регистрация в TizerPro</h2>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <form>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Имя</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-white focus:outline-none focus:border-amber-500" placeholder="Ваше имя" />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-white focus:outline-none focus:border-amber-500" placeholder="name@example.com" />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-white focus:outline-none focus:border-amber-500" placeholder="Минимум 6 символов" />
          </div>
          
          <button type="button" onClick={(e) => handleSubmit(e)} disabled={loading === 'true'} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold p-3 rounded transition duration-200 disabled:opacity-50">
            {loading ? 'Загрузка...' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
}
 
