import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

export interface Teaser {
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

const UPLOAD_URL = 'https://functions.poehali.dev/6b199405-f08d-42ce-9abc-e36ebb9f2c9f';

interface Props {
  teasers: Teaser[];
  showCreateForm: boolean;
  onHideCreateForm: () => void;
  onCreated: () => void;
  onEditTeaser: (t: Teaser) => void;
  onCreateTeaser: (data: object) => Promise<{ error?: string }>;
}

export default function TeaserTab({ teasers, showCreateForm, onHideCreateForm, onCreated, onEditTeaser, onCreateTeaser }: Props) {
  const [form, setForm] = useState({ title: '', description: '', url: '', image_url: '', budget: '500', cpm: '50' });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64 = (ev.target?.result as string).split(',')[1];
      const res = await fetch(UPLOAD_URL, {
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
    const res = await onCreateTeaser({ ...form, budget: parseFloat(form.budget), cpm: parseFloat(form.cpm) });
    setLoading(false);
    if (!res.error) {
      onHideCreateForm();
      setForm({ title: '', description: '', url: '', image_url: '', budget: '500', cpm: '50' });
      setImagePreview('');
      onCreated();
    } else {
      alert(res.error);
    }
  };

  return (
    <>
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
              <Button type="button" variant="ghost" onClick={() => { onHideCreateForm(); setImagePreview(''); }} style={{color: 'var(--text-muted)'}}>Отмена</Button>
            </div>
          </form>
        </div>
      )}

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
              {t.image_url && <img src={t.image_url} alt="" className="w-16 h-16 object-cover rounded flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold">{t.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor: statusColor[t.status] + '22', color: statusColor[t.status]}}>
                    {statusLabel[t.status] || t.status}
                  </span>
                </div>
                <p className="text-sm mb-2 truncate" style={{color: 'var(--text-muted)'}}>{t.url}</p>
                <div className="flex flex-wrap gap-4 text-sm" style={{color: 'var(--text-muted)'}}>
                  <span>Бюджет: <b style={{color: 'var(--text-primary)'}}>{t.budget.toFixed(2)} ₽</b></span>
                  <span>Потрачено: <b style={{color: 'var(--text-primary)'}}>{t.spent.toFixed(2)} ₽</b></span>
                  <span>Показов: <b style={{color: 'var(--text-primary)'}}>{t.impressions}</b></span>
                  <span>Кликов: <b style={{color: 'var(--text-primary)'}}>{t.clicks}</b></span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => onEditTeaser(t)} style={{borderColor: 'var(--line)', color: 'var(--text-muted)', flexShrink: 0}}>
                <Icon name="Pencil" size={14} className="mr-1" />
                Изменить
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
