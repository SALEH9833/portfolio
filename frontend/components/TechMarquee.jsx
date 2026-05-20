import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { useI18n } from '../lib/i18n';

const TechLogo = {
  React: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <circle cx="12" cy="12" r="2.05" />
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="12" cy="12" rx="11" ry="4.2" />
        <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)" />
      </g>
    </svg>
  ),
  NextJS: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="10" />
      <path d="M9 8v8M9 8l7 8" />
    </svg>
  ),
  NodeJS: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" />
      <path d="M12 12v10M3 7l9 5 9-5" />
    </svg>
  ),
  MongoDB: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 2c-1 4-4 6-4 11s2 7 4 9c2-2 4-4 4-9s-3-7-4-11z" />
    </svg>
  ),
  PostgreSQL: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  Neo4j: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <g stroke="currentColor" strokeWidth="1.2" fill="none">
        <line x1="8" y1="7" x2="10" y2="10" />
        <line x1="16" y1="7" x2="14" y2="10" />
        <line x1="10" y1="14" x2="8" y2="17" />
        <line x1="14" y1="14" x2="16" y2="17" />
      </g>
    </svg>
  ),
  Python: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M9 3h6a3 3 0 013 3v4H6V8a3 3 0 013-3z" />
      <path d="M15 21H9a3 3 0 01-3-3v-4h12v2a3 3 0 01-3 3z" />
      <circle cx="9" cy="6" r="0.8" fill="currentColor" />
      <circle cx="15" cy="18" r="0.8" fill="currentColor" />
    </svg>
  ),
  Java: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 14c0 2 1 3 4 3s4-1 4-3" />
      <path d="M6 18c1 1 3 2 6 2s5-1 6-2" />
      <path d="M10 4c2 3-1 5 0 8" />
      <path d="M14 5c1 2-1 4 0 7" />
    </svg>
  ),
  PHP: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <ellipse cx="12" cy="12" rx="10" ry="6" />
      <path d="M7 9v6M10 9v6M14 9v6M17 9v6" />
    </svg>
  ),
  Express: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 5l5 7-5 7M11 5h10M11 12h10M11 19h10" />
    </svg>
  ),
  Linux: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3c-2 0-3 2-3 4v3c0 1-1 2-2 3l-2 3c-1 2 1 4 3 4h8c2 0 4-2 3-4l-2-3c-1-1-2-2-2-3V7c0-2-1-4-3-4z" />
      <circle cx="10" cy="8" r="0.6" fill="currentColor" />
      <circle cx="14" cy="8" r="0.6" fill="currentColor" />
    </svg>
  ),
  Git: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 12h8M18 8v8" />
    </svg>
  ),
  Tailwind: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 12c0-3 2-5 5-5s4 2 5 3 2 1 3 1 2-1 2-2c0 3-2 5-5 5s-4-2-5-3-2-1-3-1-2 1-2 2z" />
    </svg>
  ),
  Stripe: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="7" y1="15" x2="11" y2="15" />
    </svg>
  ),
};

const TECH_LIST = [
  'React', 'NextJS', 'NodeJS', 'Express', 'MongoDB', 'PostgreSQL',
  'Neo4j', 'Python', 'Java', 'PHP', 'Linux', 'Git', 'Tailwind', 'Stripe',
];

const DISPLAY_NAME = {
  React: 'React', NextJS: 'Next.js', NodeJS: 'Node.js', Express: 'Express',
  MongoDB: 'MongoDB', PostgreSQL: 'PostgreSQL', Neo4j: 'Neo4j', Python: 'Python',
  Java: 'Java', PHP: 'PHP', Linux: 'Linux', Git: 'Git', Tailwind: 'Tailwind', Stripe: 'Stripe',
};

function TechItem({ name }) {
  const Logo = TechLogo[name];
  return (
    <div className="flex items-center gap-3 text-ink-300 hover:text-gold-500 transition-colors duration-300 select-none cursor-default">
      <span className="text-ink-400">{Logo && <Logo />}</span>
      <span className="font-display text-2xl italic font-medium whitespace-nowrap">
        {DISPLAY_NAME[name]}
      </span>
      <span className="text-gold-500 text-3xl font-display leading-none">·</span>
    </div>
  );
}

export default function TechMarquee() {
  const { t } = useI18n();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const items = [...TECH_LIST, ...TECH_LIST];

  return (
    <section ref={ref} className="bg-ink-950 py-16 border-y border-white/[0.04]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto"
      >
        <p className="text-center text-2xs font-mono text-ink-400 tracking-[0.25em] uppercase mb-8 px-6">
          {t('marquee.title')}
        </p>
        <div className="marquee-wrap">
          <div className="marquee-track">
            {items.map((name, i) => (
              <TechItem key={`${name}-${i}`} name={name} />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
