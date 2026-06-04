import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Props {
  onCreateYoutubeAd: (data: object) => Promise<{ error?: string }>;
}

export default function YoutubeTab({ onCreateYoutubeAd }: Props) {
  const [youtubeForm, setYoutubeForm] = useState({ video_url: '', budget: '500' });
  const [youtubeLoading, setYoutubeLoading] = useState(false);

  const handleCreateYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    setYoutubeLoading(true);
    const res = await onCreateYoutubeAd({ ...youtubeForm, budget: parseFloat(youtubeForm.budget) });
    setYoutubeLoading(false);
    if (!res.error) {
      setYoutubeForm({ video_url: '', budget: '500' });
      alert('YouTube-кампания создана и отправлена на модерацию!');
    } else {
      alert(res.error);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Icon name="Play" size={22} style={{color: '#ff0000'}} />
        <div>
          <h2 className="text-xl font-bold font-display">YouTube просмотры</h2>
          <p className="text-sm" style={{color: 'var(--text-muted)'}}>Добавьте своё видео — его посмотрят тысячи пользователей · 70 ₽ за 1000 просмотров</p>
        </div>
      </div>
      <div className="p-6 rounded-lg mb-6" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--gold)'}}>
        <h3 className="font-bold mb-4">Создать YouTube-кампанию</h3>
        <form onSubmit={handleCreateYoutube} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Ссылка на YouTube видео *</label>
              <Input value={youtubeForm.video_url} onChange={e => setYoutubeForm({...youtubeForm, video_url: e.target.value})} placeholder="https://youtube.com/watch?v=..." required style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{color: 'var(--text-muted)'}}>Бюджет (руб)</label>
              <Input value={youtubeForm.budget} onChange={e => setYoutubeForm({...youtubeForm, budget: e.target.value})} type="number" min="100" style={{backgroundColor: 'var(--charcoal)', borderColor: 'var(--line)', color: 'var(--text-primary)'}} />
              <p className="text-xs mt-1" style={{color: 'var(--text-muted)'}}>Минимум 100 ₽ · {Math.floor(parseFloat(youtubeForm.budget || '0') / 70 * 1000).toLocaleString()} просмотров</p>
            </div>
          </div>
          <Button type="submit" disabled={youtubeLoading} style={{backgroundColor: 'var(--gold)', color: '#111318'}}>
            <Icon name="Play" size={16} className="mr-2" />
            {youtubeLoading ? 'Создаём...' : 'Запустить YouTube-кампанию'}
          </Button>
        </form>
      </div>
      <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--charcoal-mid)', border: '1px solid var(--line)'}}>
        <h4 className="font-semibold mb-2 text-sm">Как работают YouTube просмотры?</h4>
        <ul className="space-y-2 text-sm" style={{color: 'var(--text-muted)'}}>
          {['Укажите ссылку на ваше видео — наши пользователи откроют и посмотрят его', 'Просмотры от живых людей — реальные потенциальные клиенты', 'Списание по 70 ₽ за каждую 1000 просмотров'].map(t => (
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
