import Image from "next/image";

const LOGO_LIBRARY = [
  { key: 'canva', name: 'Canva', src: '/images/skills/canva-transparent.png', href: 'https://www.canva.com/' },
  { key: 'tailwind', name: 'Tailwind CSS', src: '/images/skills/tailwind-transparent.png', href: 'https://tailwindcss.com/' },
  { key: 'css', name: 'CSS', src: '/images/skills/css-transparent.png', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
  { key: 'github', name: 'GitHub', src: '/images/skills/github-transparent.png', href: 'https://github.com/' },
  { key: 'html', name: 'HTML', src: '/images/skills/html-transparent.png', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
  { key: 'javascript', name: 'JavaScript', src: '/images/skills/javascript-transparent.png', href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
  { key: 'laravel', name: 'Laravel', src: '/images/skills/laravel-transparent.png', href: 'https://laravel.com/' },
  { key: 'php', name: 'PHP', src: '/images/skills/php-transparent.png', href: 'https://www.php.net/' },
  { key: 'supabase', name: 'Supabase', src: '/images/skills/supabase-transparent.png', href: 'https://supabase.com/' },
  { key: 'vercel', name: 'Vercel', src: '/images/skills/vercel-transparent.png', href: 'https://vercel.com/' },
];

function normalizeName(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function logoFor(name) {
  const value = normalizeName(name);
  if (value.includes('tailwind')) return 'tailwind';
  if (value.includes('javascript') || value === 'js') return 'javascript';
  if (value.includes('typescript') || value === 'ts') return null;
  if (value.includes('html')) return 'html';
  if (value === 'css' || value === 'css3') return 'css';
  if (value.includes('laravel')) return 'laravel';
  if (value === 'php') return 'php';
  if (value.includes('github')) return 'github';
  if (value.includes('supabase')) return 'supabase';
  if (value.includes('vercel')) return 'vercel';
  if (value.includes('canva')) return 'canva';
  return null;
}

function makeLane(items, laneIndex) {
  const ordered = laneIndex === 0 ? items : [...items].reverse();
  const repeats = Math.max(2, Math.ceil(10 / ordered.length));
  return Array.from({ length: repeats }, () => ordered).flat();
}

function LogoList({ items, duplicate = false, laneIndex }) {
  return (
    <ul className="skill-logo-sequence" aria-hidden={duplicate || undefined}>
      {items.map((item, index) => (
        <li className="skill-logo-item" key={`${laneIndex}-${duplicate ? 'copy' : 'main'}-${index}-${item.name}`}>
          <a className="skill-logo-link" href={item.href} target="_blank" rel="noopener noreferrer"
            tabIndex={duplicate ? -1 : undefined} aria-label={`Buka situs ${item.name}`}>
            <span className="skill-logo-mark" data-logo={item.key}>
              {item.src ? <Image src={item.src} alt="" width={64} height={64} sizes="54px" draggable={false} /> : <span className="skill-logo-fallback">{item.name.slice(0, 2).toUpperCase()}</span>}
            </span>
            <span className="skill-logo-label">{item.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function SkillLogoLoops({ technologies = [], skills = [] }) {
  const managedItems = [
    ...technologies.map((name) => ({ name })),
    ...skills.map((skill) => ({ name: skill.name })),
  ].filter((item) => item.name?.trim());
  const managedByLogo = new Map(managedItems.map((item) => [logoFor(item.name), item]).filter(([key]) => key));
  const logos = LOGO_LIBRARY.map((logo) => ({ ...logo, name: managedByLogo.get(logo.key)?.name || logo.name }));
  const extras = managedItems.filter((item) => !logoFor(item.name)).map((item) => ({
    name: item.name,
    href: `https://www.google.com/search?q=${encodeURIComponent(item.name)}`,
    src: null,
  }));
  const items = [...logos, ...extras];

  return (
    <div className="skills-logo-loops" role="group" aria-label="Skills and technologies">
      {[0, 1].map((laneIndex) => {
        const laneItems = makeLane(items, laneIndex);
        const duration = `${Math.max(15, laneItems.length * 1.7)}s`;
        return (
          <div className={`skills-logo-lane${laneIndex === 1 ? ' is-reverse' : ''}`} key={laneIndex}>
            <div className="skills-logo-track" style={{ '--loop-duration': duration }}>
              <LogoList items={laneItems} laneIndex={laneIndex} />
              <LogoList items={laneItems} laneIndex={laneIndex} duplicate />
            </div>
          </div>
        );
      })}
    </div>
  );
}
