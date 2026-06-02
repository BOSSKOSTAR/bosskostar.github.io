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
  interface DayStats { date: string; impressions: number; clicks: number }
  const [teasers, setTeasers] = useState<Teaser[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [daily, setDaily] = useState<DayStats[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('500');
  const [form, setForm] = useState({ title: '', description: '', url: '', image_url: '', budget: '500', cpm: '50' });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUploading, setImageUploading] = useState(false);
  const [balance, setBalance] = useState(user.balance);
  const [showReferral, setShowReferral] = useState(false);
  const [refData, setRefData] = useState<{ref_code: string; referrals_count: number; total_earned: number} | null>(null);
  const [refCopied, setRefCopied] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [t, s, d] = await Promise.all([api.getTeasers(), api.getStats(), api.getDailyStats(14)]);
    if (t.teasers) setTeasers(t.teasers);
    if (s.total_teasers !== undefined) setStats(s);
    if (d.daily) setDaily(d.daily);
    const me = await api.me();
    if (me.balance !== undefined) setBalance(me.balance);
  };

  const loadReferral = async () => {
    const res = await api.getReferral();
    if (res.ref_code !== undefined) setRefData(res);
  };

  const handleShowReferral = () => {
    setShowReferral(!showReferral);
    if (!refData) loadReferral();
  };

  const copyRefLink = () => {
    if (!refData) return;
    const link = `${window.location.origin}/register?ref=${refData.ref_code}`;
    navigator.clipboard.writeText(link);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64 = (ev.target?.result as string).split(',')[1];
      const res = await fetch('https://functions.poehali.dev/6b199405-f08d-42ce-9abc-e36ebb9f2c9f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: b64, content_type: file.type }),
      });
      const data = await res.json();
      if (data.url) {
        setForm(f => ({ ...f, image_url: data.url }));
        setImagePreview(data.url);
      }
      setImageUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.createTeaser({ ...form, budget: parseFloat(form.budget), cpm: parseFloat(form.cpm) });
    setLoading(false);
    if (!res.error) {
      setShowCreateForm(false);
      setForm({ title: '', description: '', url: '', image_url: '', budget: '500', cpm: '50' });
      setImagePreview('');
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

      {/* Chart */}
      {(() => {
        const W = 600, H = 100, PAD = 10;
        const hasData = daily.length >= 2;
        const maxImp = hasData ? Math.max(...daily.map(d => d.impressions), 1) : 1;

        const linePoints = (key: 'impressions' | 'clicks') => daily.map((d, i) => {
          const x = PAD + (i / (daily.length - 1)) * (W - PAD * 2);
          const y = H - PAD - (d[key] / maxImp) * (H - PAD * 2);
          return `${x},${y}`;
        }).join(' ');

        return (
          <div className="mb-6 p-4 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm">График за 14 дней</h3>
              <div className="flex gap-4 text-xs" style={{color: 'var(--text-muted)'}}>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block rounded" style={{backgroundColor: 'var(--gold)'}} />Показы</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block rounded" style={{backgroundColor: '#60a5fa'}} />Клики</span>
              </div>
            </div>
            {hasData ? (
              <>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{height: 100}}>
                  <polyline fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={linePoints('impressions')} />
                  <polyline fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={linePoints('clicks')} />
                  {daily.map((d, i) => {
                    const x = PAD + (i / (daily.length - 1)) * (W - PAD * 2);
                    const y = H - PAD - (d.impressions / maxImp) * (H - PAD * 2);
                    return <circle key={i} cx={x} cy={y} r="3" fill="var(--gold)" />;
                  })}
                </svg>
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{color: 'var(--text-muted)'}}>{daily[0].date.slice(5)}</span>
                  <span className="text-xs" style={{color: 'var(--text-muted)'}}>{daily[daily.length - 1].date.slice(5)}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-6 text-xs" style={{color: 'var(--text-muted)'}}>
                <Icon name="BarChart2" size={16} className="mr-2 opacity-40" />
                Данные накапливаются — график появится через несколько дней
              </div>
            )}
          </div>
        );
      })()}

      {/* Actions */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Button onClick={() => setShowCreateForm(!showCreateForm)} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>
          <Icon name="Plus" size={16} className="mr-2" /> Создать тизер
        </Button>
        <Button variant="outline" onClick={() => setShowPayment(!showPayment)} style={{borderColor: 'var(--line)', color: 'var(--text-primary)'}}>
          <Icon name="CreditCard" size={16} className="mr-2" /> Пополнить баланс
        </Button>
        <Button variant="outline" onClick={handleShowReferral} style={{borderColor: 'var(--line)', color: 'var(--text-primary)'}}>
          <Icon name="Users" size={16} className="mr-2" /> Реферальная программа
        </Button>
      </div>

      {/* Referral block */}
      {showReferral && (
        <div className="mb-6 p-6 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
          <h3 className="font-bold mb-1">Реферальная программа</h3>
          <p className="text-sm mb-4" style={{color: 'var(--text-muted)'}}>Приглашайте друзей — получайте <span style={{color: 'var(--gold)'}}>5%</span> с каждого их пополнения навсегда</p>
          {refData ? (
            <>
              <div className="flex gap-3 items-center mb-4">
                <div className="flex-1 px-3 py-2 rounded text-sm font-mono" style={{backgroundColor: 'var(--charcoal)', border: '1px solid var(--line)', color: 'var(--text-primary)'}}>
                  {`${window.location.origin}/register?ref=${refData.ref_code}`}
                </div>
                <Button onClick={copyRefLink} style={{backgroundColor: 'var(--gold)', color: '#111318', minWidth: 90}}>
                  <Icon name={refCopied ? 'Check' : 'Copy'} size={16} className="mr-2" />
                  {refCopied ? 'Скопировано' : 'Копировать'}
                </Button>
              </div>
              <div className="flex gap-6">
                <div>
                  <div className="text-xs mb-1" style={{color: 'var(--text-muted)'}}>Приглашено</div>
                  <div className="text-xl font-bold font-display" style={{color: 'var(--text-primary)'}}>{refData.referrals_count}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{color: 'var(--text-muted)'}}>Заработано</div>
                  <div className="text-xl font-bold font-display" style={{color: 'var(--gold)'}}>{refData.total_earned.toFixed(2)} ₽</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm" style={{color: 'var(--text-muted)'}}>Загрузка...</div>
          )}
        </div>
      )}

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
                <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Картинка</label>
                <label className="flex flex-col items-center justify-center w-full h-24 rounded-lg cursor-pointer border-2 border-dashed transition-colors overflow-hidden relative" style={{borderColor: 'var(--line)', backgroundColor: 'var(--charcoal)'}}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  ) : imageUploading ? (
                    <span className="text-xs" style={{color: 'var(--text-muted)'}}>Загрузка...</span>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Icon name="Upload" size={20} style={{color: 'var(--text-muted)'}} />
                      <span className="text-xs" style={{color: 'var(--text-muted)'}}>Нажмите для загрузки</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                </label>
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
              <Button type="button" variant="ghost" onClick={() => { setShowCreateForm(false); setImagePreview(''); }} style={{color: 'var(--text-muted)'}}>Отмена</Button>
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