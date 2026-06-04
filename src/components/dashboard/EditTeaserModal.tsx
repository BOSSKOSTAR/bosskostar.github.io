import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { Teaser } from './TeaserTab';

const UPLOAD_URL = 'https://functions.poehali.dev/6b199405-f08d-42ce-9abc-e36ebb9f2c9f';

interface Props {
  teaser: Teaser | null;
  onClose: () => void;
  onSave: (data: object) => Promise<{ error?: string }>;
  onSaved: () => void;
}

export default function EditTeaserModal({ teaser, onClose, onSave, onSaved }: Props) {
  const [editForm, setEditForm] = useState({ title: '', description: '', url: '', image_url: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState('');

  useEffect(() => {
    if (teaser) {
      setEditForm({ title: teaser.title, description: teaser.description || '', url: teaser.url, image_url: teaser.image_url || '' });
      setEditImagePreview(teaser.image_url || '');
    }
  }, [teaser]);

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        setEditForm(f => ({ ...f, image_url: data.url }));
        setEditImagePreview(data.url);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teaser) return;
    setEditLoading(true);
    const res = await onSave({ id: teaser.id, ...editForm });
    setEditLoading(false);
    if (!res.error) {
      onClose();
      onSaved();
    } else {
      alert(res.error);
    }
  };

  if (!teaser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor: 'rgba(0,0,0,0.7)'}}>
      <div className="w-full max-w-lg rounded-xl p-6" style={{backgroundColor: 'var(--charcoal)', border: '1px solid var(--gold)'}}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg font-display">Редактировать тизер</h3>
          <button onClick={onClose} style={{color: 'var(--text-muted)'}}>
            <Icon name="X" size={20} />
          </button>
        </div>
        <form onSubmit={handleEditSave} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Заголовок *</label>
            <Input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} required style={{backgroundColor: 'var(--charcoal-mid)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Ссылка *</label>
            <Input value={editForm.url} onChange={e => setEditForm({...editForm, url: e.target.value})} placeholder="https://ваш-сайт.ru" required style={{backgroundColor: 'var(--charcoal-mid)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Описание</label>
            <Input value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} style={{backgroundColor: 'var(--charcoal-mid)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Картинка</label>
            <label className="flex flex-col items-center justify-center w-full h-24 rounded-lg cursor-pointer border-2 border-dashed overflow-hidden relative" style={{borderColor: 'var(--line)', backgroundColor: 'var(--charcoal-mid)'}}>
              {editImagePreview ? (
                <img src={editImagePreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Icon name="Upload" size={20} style={{color: 'var(--text-muted)'}} />
                  <span className="text-xs" style={{color: 'var(--text-muted)'}}>Нажмите для замены</span>
                </div>
              )}
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleEditImageUpload} />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={editLoading} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>
              {editLoading ? 'Сохраняем...' : 'Сохранить'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} style={{color: 'var(--text-muted)'}}>
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
