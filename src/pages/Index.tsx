import { useState } from "react";
import Icon from "@/components/ui/icon";

const NAV_LINKS = [
  { label: "О проекте", href: "#about" },
];

const STATS = [
  { value: "2024", label: "Год основания" },
  { value: "50+", label: "Реализованных проектов" },
  { value: "12", label: "Лет экспертизы" },
  { value: "100%", label: "Прозрачность" },
];

const VALUES = [
  {
    icon: "ShieldCheck",
    title: "Надёжность",
    desc: "Все обязательства фиксируются документально. Мы не отступаем от взятых на себя обязательств.",
  },
  {
    icon: "BarChart2",
    title: "Результат",
    desc: "Ключевой критерий нашей работы — измеримый бизнес-результат для клиента, а не процесс.",
  },
  {
    icon: "Eye",
    title: "Прозрачность",
    desc: "Открытая отчётность, чёткие сроки и понятная структура ценообразования.",
  },
  {
    icon: "Users",
    title: "Команда",
    desc: "Опытные специалисты с профильной экспертизой, объединённые общими стандартами.",
  },
];

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--charcoal)] text-[var(--text-primary)] font-body">

      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--line)] bg-[var(--charcoal)]/95 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <a href="#" className="font-display text-lg tracking-widest uppercase text-[var(--gold)]">
            ПРОЕКТ
          </a>
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="gold-underline text-sm tracking-wide uppercase text-[var(--text-primary)] hover:text-[var(--gold)] transition-colors duration-200 font-body"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#contact"
              className="px-5 py-2 border border-[var(--gold)] text-[var(--gold)] text-sm tracking-wide uppercase font-body hover:bg-[var(--gold)] hover:text-[var(--charcoal)] transition-all duration-200"
            >
              Связаться
            </a>
          </nav>
          <button className="md:hidden text-[var(--text-primary)]" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[var(--charcoal-mid)] border-t border-[var(--line)] px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="text-sm uppercase tracking-wide text-[var(--text-primary)] hover:text-[var(--gold)] transition-colors">
                {l.label}
              </a>
            ))}
            <a href="#contact" onClick={() => setMenuOpen(false)}
              className="text-sm uppercase tracking-wide text-[var(--gold)]">
              Связаться
            </a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-36 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--gold)]/5 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--gold)]/4 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
          <div className="absolute inset-0"
            style={{backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 79px, var(--line) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, var(--line) 80px)', opacity: 0.3}} />
        </div>
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-10 bg-[var(--gold)]" />
              <span className="text-[var(--gold)] text-xs tracking-[0.3em] uppercase font-body">Официальная страница</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-6 text-[var(--text-primary)]">
              СЕРЬЁЗНЫЙ<br />
              <span className="text-[var(--gold)]">ПОДХОД</span><br />
              К ДЕЛУ
            </h1>
            <p className="text-[var(--text-muted)] text-lg leading-relaxed max-w-xl mb-10 font-body">
              Профессиональная команда с многолетним опытом. Работаем на результат,
              говорим честно, держим сроки.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#about"
                className="px-8 py-3 bg-[var(--gold)] text-[var(--charcoal)] font-display text-sm tracking-widest uppercase hover:bg-[var(--gold-light)] transition-colors duration-200">
                О ПРОЕКТЕ
              </a>
              <a href="#contact"
                className="px-8 py-3 border border-[var(--line)] text-[var(--text-primary)] font-display text-sm tracking-widest uppercase hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors duration-200">
                КОНТАКТЫ
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-[var(--line)] bg-[var(--charcoal-mid)]">
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[var(--line)]">
            {STATS.map((s, i) => (
              <div key={i} className="text-center px-6 py-4 animate-fade-in-up" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="font-display text-4xl text-[var(--gold)] mb-1">{s.value}</div>
                <div className="text-[var(--text-muted)] text-xs tracking-wide uppercase font-body">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 md:py-36">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-[var(--gold)]" />
                <span className="text-[var(--gold)] text-xs tracking-[0.3em] uppercase font-body">О проекте</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-[var(--text-primary)] mb-8 leading-tight">
                КТО МЫ И<br />
                <span className="text-[var(--gold)]">ЧТО МЫ ДЕЛАЕМ</span>
              </h2>
              <div className="space-y-5 text-[var(--text-muted)] text-base leading-relaxed font-body">
                <p>
                  Мы — команда профессионалов, объединённых общей целью: создавать работающие
                  решения для бизнеса. Каждый проект рассматривается как долгосрочное
                  партнёрство, а не разовая сделка.
                </p>
                <p>
                  Наш подход построен на глубоком понимании задач клиента, чёткой методологии
                  и ответственности за конечный результат. Мы не обещаем лишнего —
                  мы делаем то, о чём договорились.
                </p>
                <p>
                  Многолетний опыт позволяет нам браться за нестандартные задачи и
                  находить решения там, где другие видят только сложности.
                </p>
              </div>
              <div className="mt-10 flex items-center gap-4">
                <div className="w-12 h-0.5 bg-[var(--gold)]" />
                <span className="text-[var(--text-muted)] text-sm tracking-wide font-body italic">
                  «Профессионализм — это не слова, это результаты»
                </span>
              </div>
            </div>

            <div className="space-y-4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              {VALUES.map((v, i) => (
                <div
                  key={i}
                  className="group flex gap-5 p-5 border border-[var(--line)] bg-[var(--charcoal-mid)] hover:border-[var(--gold)]/40 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-10 h-10 border border-[var(--gold)]/40 flex items-center justify-center group-hover:border-[var(--gold)] group-hover:bg-[var(--gold)]/10 transition-all duration-300">
                    <Icon name={v.icon} size={18} className="text-[var(--gold)]" fallback="Star" />
                  </div>
                  <div>
                    <h3 className="font-display text-base tracking-wide text-[var(--text-primary)] mb-1">{v.title}</h3>
                    <p className="text-[var(--text-muted)] text-sm leading-relaxed font-body">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="container mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />
      </div>

      {/* CONTACT */}
      <section id="contact" className="py-24 md:py-36">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-10 bg-[var(--gold)]" />
              <span className="text-[var(--gold)] text-xs tracking-[0.3em] uppercase font-body">Контакты</span>
              <div className="h-px w-10 bg-[var(--gold)]" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-[var(--text-primary)] mb-6 leading-tight">
              ГОТОВЫ<br />
              <span className="text-[var(--gold)]">К ДИАЛОГУ</span>
            </h2>
            <p className="text-[var(--text-muted)] text-base leading-relaxed mb-10 font-body">
              Расскажите о вашей задаче — мы изучим её и предложим конкретное решение.
              Без лишних слов, без затяжных переговоров.
            </p>
            <a
              href="mailto:info@example.com"
              className="inline-flex items-center gap-3 px-10 py-4 bg-[var(--gold)] text-[var(--charcoal)] font-display text-sm tracking-widest uppercase hover:bg-[var(--gold-light)] transition-colors duration-200"
            >
              <Icon name="Mail" size={16} />
              НАПИСАТЬ НАМ
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--line)] bg-[var(--charcoal-mid)]">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm tracking-widest uppercase text-[var(--gold)]">ПРОЕКТ</span>
          <span className="text-[var(--text-muted)] text-xs font-body">© 2024 — Все права защищены</span>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}
                className="text-xs uppercase tracking-wide text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors font-body">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
