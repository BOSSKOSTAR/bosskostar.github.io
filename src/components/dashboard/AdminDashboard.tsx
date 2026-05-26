import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [teasers, setTeasers] = useState<Record<string, unknown>[]>([]);
  const [sending, setSending] = useState<number | null>(null);
  const [sendResult, setSendResult] = useState<Record<number, string>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [s, t] = await Promise.all([api.getStats(), api.getTeasers()]);
    if (s.advertisers !== undefined) setStats(s);
    if (t.teasers) setTeasers(t.teasers);
  };

  const updateStatus = async (id: number, status: string) => {
    await api.updateTeaserStatus(id, status);
    loadData();
  };

  const approveAndSend = async (id: number) => {
    await api.updateTeaserStatus(id, 'active');
    setSending(id);
    const res = await api.sendPush(id);
    setSending(null);
    if (res.sent !== undefined) {
      setSendResult(prev => ({...prev, [id]: `Отправлено: ${res.sent}, ошибок: ${res.failed}`}));
    }
    loadData();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold font-display mb-6">Панель администратора</h2>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Рекламодателей', value: stats.advertisers, icon: 'User' },
            { label: 'Вебмастеров', value: stats.webmasters, icon: 'Globe' },
            { label: 'Активных тизеров', value: stats.active_teasers, icon: 'Image', gold: true },
            { label: 'На модерации', value: stats.pending_teasers, icon: 'Clock' },
            { label: 'Подписчиков', value: stats.total_subscribers?.toLocaleString(), icon: 'Users' },
            { label: 'Депозитов', value: `${(stats.total_deposits || 0).toFixed(0)} ₽`, icon: 'Wallet', gold: true },
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

      <h3 className="text-xl font-bold font-display mb-4">Тизеры на модерации</h3>
      <div className="space-y-3">
        {teasers.filter(t => t.status === 'pending').map(t => (
          <div key={t.id as number} className="p-4 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
            <div className="flex gap-4 items-start justify-between mb-2">
              <div>
                <div className="font-bold mb-1">{t.title as string}</div>
                <div className="text-sm" style={{color: 'var(--text-muted)'}}>{t.url as string}</div>
                {t.owner && <div className="text-xs mt-1" style={{color: 'var(--text-muted)'}}>Владелец: {t.owner as string}</div>}
                <div className="text-xs mt-1" style={{color: 'var(--text-muted)'}}>Бюджет: <b style={{color: 'var(--gold)'}}>{(t.budget as number)?.toFixed(2)} ₽</b></div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Button size="sm" onClick={() => approveAndSend(t.id as number)} disabled={sending === t.id as number} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>
                  <Icon name="Send" size={14} className="mr-1" />
                  {sending === t.id as number ? 'Рассылаем...' : 'Одобрить и разослать'}
                </Button>
                <Button size="sm" onClick={() => updateStatus(t.id as number, 'active')} style={{backgroundColor: '#10b981', color: 'white'}}>
                  <Icon name="Check" size={14} className="mr-1" /> Одобрить
                </Button>
                <Button size="sm" onClick={() => updateStatus(t.id as number, 'rejected')} style={{backgroundColor: '#ef4444', color: 'white'}}>
                  <Icon name="X" size={14} className="mr-1" /> Отклонить
                </Button>
              </div>
            </div>
            {sendResult[t.id as number] && (
              <div className="text-xs px-3 py-1.5 rounded mt-2" style={{backgroundColor: '#10b98122', color: '#10b981'}}>
                <Icon name="BellRing" size={12} className="inline mr-1" />{sendResult[t.id as number]}
              </div>
            )}
          </div>
        ))}
        {teasers.filter(t => t.status === 'pending').length === 0 && (
          <p style={{color: 'var(--text-muted)'}}>Нет тизеров на модерации</p>
        )}
      </div>

      <h3 className="text-xl font-bold font-display mt-8 mb-4">Все тизеры</h3>
      <div className="space-y-2">
        {teasers.map(t => (
          <div key={t.id as number} className="p-3 rounded-lg flex gap-3 items-center justify-between" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
            <div>
              <span className="font-medium text-sm">{t.title as string}</span>
              {t.owner && <span className="text-xs ml-2" style={{color: 'var(--text-muted)'}}>({t.owner as string})</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{color: 'var(--text-muted)'}}>Показов: {t.impressions as number}</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{
                backgroundColor: t.status === 'active' ? '#10b98122' : t.status === 'pending' ? '#f59e0b22' : '#6b728022',
                color: t.status === 'active' ? '#10b981' : t.status === 'pending' ? '#f59e0b' : '#6b7280'
              }}>{t.status as string}</span>
              {t.status === 'active' && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => api.sendPush(t.id as number).then(r => r.sent !== undefined && setSendResult(prev => ({...prev, [t.id as number]: `Разослано: ${r.sent}`})))} style={{color: 'var(--gold)', fontSize: '0.7rem'}}>
                    <Icon name="Send" size={12} className="mr-1" />Разослать
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id as number, 'paused')} style={{color: 'var(--text-muted)', fontSize: '0.7rem'}}>Пауза</Button>
                </>
              )}
              {t.status === 'paused' && (
                <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id as number, 'active')} style={{color: 'var(--gold)', fontSize: '0.7rem'}}>Активировать</Button>
              )}
              {sendResult[t.id as number] && <span className="text-xs" style={{color: '#10b981'}}>{sendResult[t.id as number]}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
