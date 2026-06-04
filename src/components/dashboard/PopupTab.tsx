import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Props {
  onCreatePopupAd: (data: object) => Promise<{ error?: string }>;
}

export default function PopupTab({ onCreatePopupAd }: Props) {
  const [popupForm, setPopupForm] = useState({ title: '', url: '', budget: '500' });
  const [popupLoading, setPopupLoading] = useState(false);

  const handleCreatePopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setPopupLoading(true);
    const res = await onCreatePopupAd({ ...popupForm, budget: parseFloat(popupForm.budget) });
    setPopupLoading(false);
    if (!res.error) {
      setPopupForm({ title: '', url: '', budget: '500' });
      alert('POPUP-кампания создана и отправлена на модерацию!');
    } else {
      alert(res.error);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Icon name="ExternalLink" size={22} style={{color: 'var(--gold)'}} />
        <div>
          <h2 className="text-xl font-bold font-display">POPUP реклама</h2>
          <p className="text-sm" style={{color: 'var(--text-muted)'}}>Гарантированные переходы на ваш сайт — 50 ₽ за 1000 переходов</p>
        </div>
      </div>
      <div className="p-6 rounded-lg mb-6" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--gold)'}}>
        <h3 className="font-bold mb-4">Создать POPUP-кампанию</h3>
        <form onSubmit={handleCreatePopup} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Заголовок объявления *</label>
              <Input value={popupForm.title} onChange={e => setPopupForm({...popupForm, title: e.target.value})} placeholder="Заголовок для POPUP" required style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Ссылка для перехода *</label>
              <Input value={popupForm.url} onChange={e => setPopupForm({...popupForm, url: e.target.value})} placeholder="https://ваш-сайт.ru" required style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Бюджет (руб)</label>
              <Input value={popupForm.budget} onChange={e => setPopupForm({...popupForm, budget: e.target.value})} type="number" min="100" style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
              <p className="text-xs mt-1" style={{color: 'var(--text-muted)'}}>Минимум 100 ₽ · {Math.floor(parseFloat(popupForm.budget || '0') / 50 * 1000).toLocaleString()} переходов</p>
            </div>
          </div>
          <Button type="submit" disabled={popupLoading} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>
            <Icon name="Plus" size={16} className="mr-2" />
            {popupLoading ? 'Создаём...' : 'Создать POPUP-кампанию'}
          </Button>
        </form>
      </div>
      <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
        <h4 className="font-semibold mb-2 text-sm">Как работает POPUP реклама?</h4>
        <ul className="space-y-2 text-sm" style={{color: 'var(--text-muted)'}}>
          {['Ваше объявление показывается пользователям нашей сети в виде всплывающего окна', 'При клике пользователь переходит на ваш сайт — это гарантированный переход', 'Списание происходит только за реальные переходы по 50 ₽ за 1000'].map(t => (
            <li key={t} className="flex items-start gap-2">
              <Icon name="Check" size={14} style={{color: 'var(--gold)', flexShrink: 0, marginTop: 2}} />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
