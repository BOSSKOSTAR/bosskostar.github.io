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
    // 1. Полностью останавливаем любые скрытые скрипты сайта
    e.preventDefault();
    e.stopPropagation();
    
    setError('');
    setLoading('true');
    
    console.log("Запуск регистрации Supabase для:", email);

    try {
      // 2. Отправляем прямой изолированный запрос в вашу базу данных
      const { data, error: sbError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            display_name: name.trim(),
          }
        }
      });

      if (sbError) {
        // Если база вернула ошибку, выводим её текст
        alert('База данных Supabase отклонила запрос: ' + sbError.message);
        throw sbError;
      }

      if (data?.user) {
        alert('УРА! КОД ПОБЕДИЛ! Пользователь успешно создан в Supabase!');
        // Отключаем navigate, чтобы проверить, запишется ли пользователь в базу без прыжков страниц
        console.log('Пользователь зарегистрирован:', data.user);
      } else {
        alert('Запрос ушел, но пользователь вернулся пустым. Проверьте вкладку Users.');
      }
    } catch (err: any) {
      alert('Технический сбой отправки: ' + (err.message || err));
      setError(err.message || 'Ошибка регистрации в Supabase');
    } finally {
      setLoading('');
    }
  }; 
