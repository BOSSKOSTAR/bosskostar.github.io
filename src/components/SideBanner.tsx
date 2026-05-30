import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const TEASERS_URL = "https://functions.poehali.dev/695ff748-d1cf-4fd0-9a70-1c19f3b58418";
const PUSH_URL = "https://functions.poehali.dev/31d1df0e-9206-4a22-8f5b-8e7b27fb89e3";

interface Teaser {
  id: number;
  title: string;
  description: string;
  image_url: string;
  url: string;
}

export default function SideBanner() {
  const [teaser, setTeaser] = useState<Teaser | null>(null);
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const fetchTeaser = async () => {
      try {
        const res = await fetch(TEASERS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "public_list" }),
        });
        const data = await res.json();
        if (data.teasers && data.teasers.length > 0) {
          const random = data.teasers[Math.floor(Math.random() * data.teasers.length)];
          setTeaser(random);
          setTimeout(() => setVisible(true), 2000);
          // Фиксируем показ
          fetch(PUSH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "impression", teaser_id: random.id, clicked: false }),
          }).catch(() => {});
        }
      } catch (e) { return; }
    };
    fetchTeaser();
  }, []);

  const handleClick = () => {
    if (!teaser) return;
    fetch(PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "impression", teaser_id: teaser.id, clicked: true }),
    }).catch(() => {});
    window.open(teaser.url, "_blank");
  };

  if (!teaser || closed) return null;

  return (
    <div
      className="fixed right-0 top-1/2 -translate-y-1/2 z-50 transition-transform duration-500"
      style={{ transform: `translateY(-50%) translateX(${visible ? "0" : "110%"})` }}
    >
      <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-l-xl shadow-2xl w-52 overflow-hidden">
        <button
          onClick={() => setClosed(true)}
          className="absolute top-2 right-2 z-10 text-[var(--text-muted)] hover:text-white transition-colors"
        >
          <Icon name="X" size={14} />
        </button>

        <div className="px-2 pt-1 pb-0.5">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Реклама</span>
        </div>

        {teaser.image_url && (
          <img
            src={teaser.image_url}
            alt={teaser.title}
            className="w-full h-28 object-cover cursor-pointer"
            onClick={handleClick}
          />
        )}

        <div className="p-3">
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight mb-1 cursor-pointer hover:text-[var(--accent)] transition-colors" onClick={handleClick}>
            {teaser.title}
          </p>
          {teaser.description && (
            <p className="text-xs text-[var(--text-muted)] leading-tight mb-2 line-clamp-2">
              {teaser.description}
            </p>
          )}
          <button
            onClick={handleClick}
            className="w-full text-xs py-1.5 rounded-lg font-medium transition-colors"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            Подробнее
          </button>
        </div>
      </div>
    </div>
  );
}