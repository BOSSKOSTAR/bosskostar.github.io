import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Site {
  id: number;
  name: string;
  url: string;
  token: string;
  status: string;
  earnings: number;
  subscribers: number;
}

interface Props { user: Record<string, unknown> }

export default function WebmasterDashboard({ user: _user }: Props) {
  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '' });
  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [s, st] = await Promise.all([api.getSites(), api.getStats()]);
    if (s.sites) setSites(s.sites);
    if (st.total_sites !== undefined) setStats(st);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.createSite(form);
    setLoading(false);
    if (!res.error) { setShowForm(false); setForm({ name: '', url: '' }); loadData(); }
    else alert(res.error);
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getScript = (token: string) => `<script>
(function(){
  if('serviceWorker' in navigator && 'PushManager' in window){
    navigator.serviceWorker.register('/sw.js').then(function(reg){
      Notification.requestPermission().then(function(perm){
        if(perm==='granted'){
          reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:null}).then(function(sub){
            fetch('https://functions.poehali.dev/41ca0f1c-9ba7-4dde-8961-779ab034a1fc/subscribe',{
              method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({token:'${token}',endpoint:sub.endpoint,p256dh:'key',auth:'auth',browser:navigator.userAgent.split(' ').pop()})
            });
          });
        }
      });
    });
  }
})();
</script>`;

  return (
    <div>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Сайтов', value: stats.total_sites || 0, icon: 'Globe' },
            { label: 'Подписчиков', value: stats.total_subscribers?.toLocaleString() || 0, icon: 'Users' },
            { label: 'Заработано', value: `${(stats.total_earnings || 0).toFixed(2)} ₽`, icon: 'DollarSign', gold: true },
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

      <Button onClick={() => setShowForm(!showForm)} className="mb-6" style={{backgroundColor: 'var(--gold)', color: '#111318'}}>
        <Icon name="Plus" size={16} className="mr-2" /> Добавить сайт
      </Button>

      {showForm && (
        <div className="mb-6 p-6 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--gold)'}}>
          <h3 className="font-bold mb-4">Новый сайт</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Название сайта</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Мой сайт" required style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>URL сайта</label>
                <Input value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://mysite.ru" required style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>
                {loading ? 'Добавляем...' : 'Добавить'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} style={{color: 'var(--text-muted)'}}>Отмена</Button>
            </div>
          </form>
        </div>
      )}

      <h2 className="text-xl font-bold font-display mb-4">Мои сайты</h2>
      {sites.length === 0 ? (
        <div className="text-center py-12" style={{color: 'var(--text-muted)'}}>
          <Icon name="Globe" size={40} className="mx-auto mb-3 opacity-30" />
          <p>Сайтов пока нет. Добавьте первый!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sites.map(site => (
            <div key={site.id} className="p-4 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold">{site.name}</span>
                  <span className="text-sm ml-2" style={{color: 'var(--text-muted)'}}>{site.url}</span>
                </div>
                <div className="flex gap-4 text-sm" style={{color: 'var(--text-muted)'}}>
                  <span>Подписчиков: <b style={{color: 'var(--text-primary)'}}>{site.subscribers}</b></span>
                  <span>Заработано: <b style={{color: 'var(--gold)'}}>{site.earnings.toFixed(2)} ₽</b></span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs mb-1" style={{color: 'var(--text-muted)'}}>Код для установки на сайт:</p>
                <div className="relative">
                  <pre className="text-xs p-3 rounded overflow-x-auto" style={{backgroundColor: 'var(--charcoal)', border: '1px solid var(--line)', color: 'var(--text-muted)', maxHeight: '120px'}}>{getScript(site.token)}</pre>
                  <Button size="sm" onClick={() => copyToken(getScript(site.token))} className="absolute top-2 right-2" style={{backgroundColor: 'var(--charcoal-mid)', color: 'var(--text-muted)', border: '1px solid var(--line)', padding: '0.25rem 0.5rem', fontSize: '0.7rem'}}>
                    {copiedToken === getScript(site.token) ? 'Скопировано!' : 'Копировать'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
