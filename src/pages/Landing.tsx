import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const TEASERS_URL = 'https://functions.poehali.dev/695ff748-d1cf-4fd0-9a70-1c19f3b58418';

export default function Landing() {
  const navigate = useNavigate();
  const [totalImpressions, setTotalImpressions] = useState(14480);
  const [totalClicks, setTotalClicks] = useState(90);

  useEffect(() => {
    fetch(TEASERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'public_stats' }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.impressions) setTotalImpressions(d.impressions);
        if (d.clicks) setTotalClicks(d.clicks);
      })
      .catch(() => {});
  }, []);

  const features = [
    { icon: 'Zap', title: 'Запуск за 2 минуты', desc: 'Создал тизер, пополнил баланс — реклама уже показывается' },
    { icon: 'Eye', title: 'Только реальные показы', desc: 'Платишь за каждую 1000 показов живым людям, не ботам' },
    { icon: 'BarChart2', title: 'Статистика онлайн', desc: 'Видишь показы и клики в реальном времени в личном кабинете' },
    { icon: 'Wallet', title: 'От 100 рублей', desc: 'Минимальный бюджет доступен каждому. Оплата через ЮМани' },
  ];

  const steps = [
    { num: '01', title: 'Зарегистрируйтесь', desc: 'Займёт 1 минуту — только email и пароль' },
    { num: '02', title: 'Создайте тизер', desc: 'Картинка, заголовок, ссылка на ваш сайт' },
    { num: '03', title: 'Пополните баланс', desc: 'От 100 ₽ через ЮМани — зачисление мгновенно' },
    { num: '04', title: 'Получайте показы', desc: 'Тизер автоматически показывается аудитории' },
  ];

  const faqs = [
    { q: 'Кому показывается моя реклама?', a: 'Пользователям, которые разрешили push-уведомления на сайтах нашей сети. Это реальные живые люди.' },
    { q: 'Как быстро запустится реклама?', a: 'Сразу после пополнения баланса. Тизер активируется автоматически без модерации.' },
    { q: 'Можно ли остановить кампанию?', a: 'Да, в любой момент прямо из личного кабинета. Неизрасходованный бюджет остаётся на балансе.' },
    { q: 'Что такое CPM?', a: 'Стоимость 1000 показов. У нас от 50 ₽ за 1000 — это одна из самых низких ставок на рынке.' },
  ];

  return (
    <div className="relative z-10 min-h-screen" style={{ color: 'var(--text-primary)' }}>

      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm" style={{ borderColor: 'var(--line)', backgroundColor: 'rgba(17,19,24,0.9)' }}>
        <span className="text-2xl font-bold font-display" style={{ color: 'var(--gold)' }}>TizerPro</span>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/login')} style={{ color: 'var(--text-primary)' }}>Войти</Button>
          <Button onClick={() => navigate('/register')} style={{ backgroundColor: 'var(--gold)', color: '#111318' }}>Регистрация</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center py-20 px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6 font-medium" style={{ backgroundColor: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          Платформа работает · показы идут прямо сейчас
        </div>
        <h1 className="text-5xl md:text-6xl font-bold font-display mb-6 leading-tight">
          Реклама в браузере<br /><span style={{ color: 'var(--gold)' }}>от 50 ₽ за 1000 показов</span>
        </h1>
        <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          Тизерная сеть на push-уведомлениях. Запустите рекламу за 2 минуты и получайте показы реальных пользователей.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mb-12">
          <Button size="lg" onClick={() => navigate('/register?role=advertiser')} style={{ backgroundColor: 'var(--gold)', color: '#111318', fontSize: '1rem', padding: '0 2rem', height: '3rem' }}>
            <Icon name="Zap" size={18} className="mr-2" />
            Запустить рекламу
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/register')} style={{ borderColor: 'var(--line)', color: 'var(--text-primary)', fontSize: '1rem', padding: '0 2rem', height: '3rem' }}>
            Зарегистрироваться
          </Button>
        </div>

        {/* Live stats */}
        <div className="flex justify-center gap-10 flex-wrap">
          {[
            { value: totalImpressions.toLocaleString('ru') + '+', label: 'показов выдано' },
            { value: totalClicks.toLocaleString('ru') + '+', label: 'кликов получено' },
            { value: 'от 50 ₽', label: 'за 1000 показов' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold font-display" style={{ color: 'var(--gold)' }}>{s.value}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--charcoal-mid)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-12">Почему TizerPro</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="p-6 rounded-lg" style={{ backgroundColor: 'var(--charcoal)', border: '1px solid var(--line)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(212,175,55,0.12)' }}>
                  <Icon name={f.icon as Parameters<typeof Icon>[0]['name']} size={20} style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-12">Как начать</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full h-px" style={{ backgroundColor: 'var(--line)' }} />
                )}
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 font-bold font-display text-lg" style={{ backgroundColor: 'var(--charcoal-mid)', border: '2px solid var(--gold)', color: 'var(--gold)' }}>
                  {s.num}
                </div>
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--charcoal-mid)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-display mb-4">Прозрачные цены</h2>
          <p className="mb-10" style={{ color: 'var(--text-muted)' }}>Никаких скрытых комиссий и абонентской платы</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-8 rounded-xl" style={{ backgroundColor: 'var(--charcoal)', border: '2px solid var(--gold)' }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--gold)' }}>Тизерная реклама</div>
              <div className="text-5xl font-bold font-display my-4" style={{ color: 'var(--gold)' }}>50 ₽</div>
              <p className="mb-6" style={{ color: 'var(--text-muted)' }}>за 1000 показов (CPM)</p>
              <ul className="space-y-3 text-left text-sm mb-8">
                {[
                  'Минимальный бюджет от 100 ₽',
                  'Мгновенная активация тизера',
                  'Статистика показов и кликов',
                  'Оплата через ЮМани',
                  'Остановка в любой момент',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <Icon name="Check" size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => navigate('/register?role=advertiser')} style={{ backgroundColor: 'var(--gold)', color: '#111318', height: '2.75rem' }}>
                Начать бесплатно
              </Button>
            </div>

            <div className="p-8 rounded-xl" style={{ backgroundColor: 'var(--charcoal)', border: '1px solid var(--line)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="ExternalLink" size={20} style={{ color: 'var(--gold)' }} />
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--gold)' }}>POPUP реклама</div>
              </div>
              <div className="text-5xl font-bold font-display my-4" style={{ color: 'var(--gold)' }}>50 ₽</div>
              <p className="mb-6" style={{ color: 'var(--text-muted)' }}>за 1000 переходов</p>
              <ul className="space-y-3 text-left text-sm mb-8">
                {[
                  'Гарантированные переходы',
                  'Реальные пользователи сети',
                  'Высокая видимость объявления',
                  'Статистика в реальном времени',
                  'Остановка в любой момент',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <Icon name="Check" size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => navigate('/register?role=advertiser')} style={{ backgroundColor: 'var(--gold)', color: '#111318', height: '2.75rem' }}>
                Начать бесплатно
              </Button>
            </div>

            <div className="p-8 rounded-xl" style={{ backgroundColor: 'var(--charcoal)', border: '1px solid var(--line)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Play" size={20} style={{ color: '#ff0000' }} />
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--gold)' }}>YouTube просмотры</div>
              </div>
              <div className="text-5xl font-bold font-display my-4" style={{ color: 'var(--gold)' }}>70 ₽</div>
              <p className="mb-6" style={{ color: 'var(--text-muted)' }}>от 70 руб. за 1000 просмотров</p>
              <ul className="space-y-3 text-left text-sm mb-8">
                {[
                  'Просмотры от живых пользователей',
                  'Добавьте ссылку на видео',
                  'Тысячи потенциальных клиентов',
                  'Статистика просмотров',
                  'Остановка в любой момент',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <Icon name="Check" size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => navigate('/register?role=advertiser')} style={{ backgroundColor: 'var(--gold)', color: '#111318', height: '2.75rem' }}>
                Начать бесплатно
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-10">Частые вопросы</h2>
          <div className="space-y-4">
            {faqs.map(f => (
              <div key={f.q} className="p-5 rounded-lg" style={{ backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)' }}>
                <div className="font-semibold mb-2">{f.q}</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center" style={{ backgroundColor: 'var(--charcoal-mid)' }}>
        <h2 className="text-4xl font-bold font-display mb-4">Попробуй прямо сейчас</h2>
        <p className="mb-8 text-lg" style={{ color: 'var(--text-muted)' }}>Регистрация бесплатна. Первые показы уже через 2 минуты.</p>
        <Button size="lg" onClick={() => navigate('/register')} style={{ backgroundColor: 'var(--gold)', color: '#111318', fontSize: '1.1rem', padding: '0 3rem', height: '3.25rem' }}>
          Зарегистрироваться бесплатно
        </Button>
      </section>

      <footer className="border-t py-6 text-center" style={{ borderColor: 'var(--line)', color: 'var(--text-muted)' }}>
        <p>© 2026 TizerPro — Тизерная рекламная сеть</p>
      </footer>
    </div>
  );
}