import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--charcoal)', color: 'var(--text-primary)'}}>
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between" style={{borderColor: 'var(--line)'}}>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-display" style={{color: 'var(--gold)'}}>TizerPro</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/login')} style={{color: 'var(--text-primary)'}}>Войти</Button>
          <Button onClick={() => navigate('/register')} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>Регистрация</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center py-24 px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold font-display mb-6 leading-tight">
          Тизерная реклама<br/><span style={{color: 'var(--gold)'}}>прямо в браузере</span>
        </h1>
        <p className="text-xl mb-10 max-w-2xl mx-auto" style={{color: 'var(--text-muted)'}}>
          Рекламируйте свои товары через push-уведомления. Платите только за реальные показы. От 50 руб за 1000 показов.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" onClick={() => navigate('/register?role=advertiser')} style={{backgroundColor: 'var(--gold)', color: '#111318', fontSize: '1rem', padding: '0 2rem', height: '3rem'}}>
            Разместить рекламу
          </Button>
        </div>
      </section>

      {/* How it works - advertisers */}
      <section className="py-16 px-6" style={{backgroundColor: 'var(--charcoal-mid)'}}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-12">Для рекламодателей</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {icon: 'Image', num: '01', title: 'Создайте тизер', desc: 'Загрузите картинку, напишите заголовок и укажите ссылку на ваш сайт'},
              {icon: 'Wallet', num: '02', title: 'Пополните баланс', desc: 'Оплатите через ЮМани от 100 рублей. Средства зачисляются мгновенно'},
              {icon: 'TrendingUp', num: '03', title: 'Получайте показы', desc: 'Ваш тизер показывается пользователям браузера по всей сети'},
            ].map(item => (
              <div key={item.num} className="p-6 rounded-lg" style={{backgroundColor: 'var(--charcoal)', border: '1px solid var(--line)'}}>
                <div className="text-4xl font-bold font-display mb-4" style={{color: 'var(--gold)'}}>{item.num}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p style={{color: 'var(--text-muted)'}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6" style={{backgroundColor: 'var(--charcoal-mid)'}}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-display mb-8">Простые тарифы</h2>
          <div className="flex justify-center">
            <div className="p-8 rounded-lg max-w-sm w-full" style={{backgroundColor: 'var(--charcoal)', border: '1px solid var(--gold)'}}>
              <h3 className="text-xl font-bold mb-2">Рекламодатель</h3>
              <div className="text-4xl font-bold font-display my-4" style={{color: 'var(--gold)'}}>от 50 ₽</div>
              <p style={{color: 'var(--text-muted)'}}>за 1000 показов (CPM)</p>
              <ul className="mt-6 space-y-2 text-left" style={{color: 'var(--text-muted)'}}>
                <li>✓ Любой бюджет от 100 руб</li>
                <li>✓ Показы в реальном браузере</li>
                <li>✓ Статистика в реальном времени</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-3xl font-bold font-display mb-4">Начните прямо сейчас</h2>
        <p className="mb-8" style={{color: 'var(--text-muted)'}}>Регистрация занимает 1 минуту</p>
        <Button size="lg" onClick={() => navigate('/register')} style={{backgroundColor: 'var(--gold)', color: '#111318', fontSize: '1rem', padding: '0 2.5rem', height: '3rem'}}>
          Зарегистрироваться бесплатно
        </Button>
      </section>

      <footer className="border-t py-6 text-center" style={{borderColor: 'var(--line)', color: 'var(--text-muted)'}}>
        <p>© 2026 TizerPro — Тизерная рекламная сеть</p>
      </footer>
    </div>
  );
}