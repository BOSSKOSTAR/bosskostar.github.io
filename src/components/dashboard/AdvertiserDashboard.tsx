import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Teaser {
  id: number;
  title: string;
  description: string;
  url: string;
  image_url: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  cpm: number;
}

interface Props { user: { id: number; name: string; balance: number; role: string } }

export default function AdvertiserDashboard({ user }: Props) {
  const [teasers, setTeasers] = useState<Teaser[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('500');
  const [form, setForm] = useState({ title: '', description: '', url: '', image_url: '', budget: '500', cpm: '50' });
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(user.balance);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [t, s] = await Promise.all([api.getTeasers(), api.getStats()]);
    if (t.teasers) setTeasers(t.teasers);
    if (s.total_teasers !== undefined) setStats(s);
    const me = await api.me();
    if (me.balance !== undefined) setBalance(me.balance);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.createTeaser({ ...form, budget: parseFloat(form.budget), cpm: parseFloat(form.cpm) });
    setLoading(false);
    if (!res.error) {
      setShowCreateForm(false);
      setForm({ title: '', description: '', url: '', image_url: '', budget: '500', cpm: '50' });
      loadData();
    } else {
      alert(res.error);
    }
  };

  const handlePayment = async () => {
    const res = await api.createPayment(parseFloat(payAmount));
    if (res.payment_url) window.open(res.payment_url, '_blank');
  };

  const statusColor: Record<string, string> = {
    pending: '#f59e0b',
    active: '#10b981',
    paused: '#6b7280',
    rejected: '#ef4444',
  };
  const statusLabel: Record<string, string> = {
    pending: 'На модерации',
    active: 'Активен',
    paused: 'Пауза',
    rejected: 'Отклонён',
  };

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Баланс', value: `${balance.toFixed(2)} ₽`, icon: 'Wallet', gold: true },
            { label: 'Показов', value: stats.total_impressions?.toLocaleString() || '0', icon: 'Eye' },
            { label: 'Кликов', value: stats.total_clicks?.toLocaleString() || '0', icon: 'MousePointer' },
            { label: 'CTR', value: `${stats.ctr || 0}%`, icon: 'TrendingUp' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} size={16} style={{color: s.gold ? 'var(--gold)' : 'var(--text-muted)'}} />
                <span className="text-xs" style={{color: 'var(--text-muted)'}}>{s.label}</span>
              </div>
              <div className="text-xl font-bold font-display" style={{color: s.gold ? 'var(--gold)' : 'var(--text-primary)'}}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <Button onClick={() => setShowCreateForm(!showCreateForm)} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>
          <Icon name="Plus" size={16} className="mr-2" /> Создать тизер
        </Button>
        <Button variant="outline" onClick={() => setShowPayment(!showPayment)} style={{borderColor: 'var(--line)', color: 'var(--text-primary)'}}>
          <Icon name="CreditCard" size={16} className="mr-2" /> Пополнить баланс
        </Button>
      </div>

      {/* Payment form */}
      {showPayment && (
        <div className="mb-6 p-6 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
          <h3 className="font-bold mb-4">Пополнение баланса через ЮМани</h3>
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Сумма (руб)</label>
              <Input value={payAmount} onChange={e => setPayAmount(e.target.value)} type="number" min="100" style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)', width: '160px'}} />
            </div>
            <Button onClick={handlePayment} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>Перейти к оплате</Button>
          </div>
          <p className="text-xs mt-2" style={{color: 'var(--text-muted)'}}>После оплаты баланс пополнится автоматически</p>
        </div>
      )}

      {/* Create teaser form */}
      {showCreateForm && (
        <div className="mb-6 p-6 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--gold)'}}>
          <h3 className="font-bold mb-4">Новый тизер</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Заголовок *</label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Заголовок тизера" required style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Ссылка *</label>
                <Input value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://ваш-сайт.ru" required style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Описание</label>
                <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Короткое описание" style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>URL картинки</label>
                <Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Бюджет (руб)</label>
                <Input value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} type="number" min="0" style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>CPM (руб за 1000 показов)</label>
                <Input value={form.cpm} onChange={e => setForm({...form, cpm: e.target.value})} type="number" min="50" style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>
                {loading ? 'Создаём...' : 'Создать тизер'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)} style={{color: 'var(--text-muted)'}}>Отмена</Button>
            </div>
          </form>
        </div>
      )}

      {/* Teasers list */}
      <h2 className="text-xl font-bold font-display mb-4">Мои тизеры</h2>
      {teasers.length === 0 ? (
        <div className="text-center py-12" style={{color: 'var(--text-muted)'}}>
          <Icon name="Image" size={40} className="mx-auto mb-3 opacity-30" />
          <p>Тизеров пока нет. Создайте первый!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teasers.map(t => (
            <div key={t.id} className="p-4 rounded-lg flex gap-4 items-start" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
              {t.image_url && <img src={t.image_url} alt="" className="w-16 h-16 object-cover rounded" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">{t.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor: statusColor[t.status] + '22', color: statusColor[t.status]}}>
                    {statusLabel[t.status] || t.status}
                  </span>
                </div>
                <p className="text-sm mb-2 truncate" style={{color: 'var(--text-muted)'}}>{t.url}</p>
                <div className="flex gap-4 text-sm" style={{color: 'var(--text-muted)'}}>
                  <span>Бюджет: <b style={{color: 'var(--text-primary)'}}>{t.budget.toFixed(2)} ₽</b></span>
                  <span>Потрачено: <b style={{color: 'var(--text-primary)'}}>{t.spent.toFixed(2)} ₽</b></span>
                  <span>Показов: <b style={{color: 'var(--text-primary)'}}>{t.impressions}</b></span>
                  <span>Кликов: <b style={{color: 'var(--text-primary)'}}>{t.clicks}</b></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}