import { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import Icon from './Icons';
import { useI18n } from '../lib/i18n';

function Counter({ end, suffix = '', duration = 1800 }) {
  const [n, setN] = useState(0);
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setN(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return <span ref={ref}>{n}{suffix}</span>;
}

export default function Stats() {
  const { t } = useI18n();
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: true });

  const STATS = [
    { value: 3, suffix: '+', label: t('stats.projects'),     sub: t('stats.projectsSub'),     icon: 'Layers' },
    { value: 7, suffix: '',  label: t('stats.languages'),    sub: t('stats.languagesSub'),    icon: 'Code'   },
    { value: 1, suffix: '',  label: t('stats.certification'), sub: t('stats.certificationSub'), icon: 'Award' },
    { value: 3, suffix: '',  label: t('stats.spoken'),       sub: t('stats.spokenSub'),       icon: 'Globe'  },
  ];

  return (
    <section className="py-22" style={{ background: 'var(--bg)' }}>
      <div className="sep mb-0" />
      <div ref={ref} className="max-w-6xl mx-auto px-6 lg:px-10 pt-22">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {STATS.map((s, i) => {
            const IconComp = Icon[s.icon];
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                className="text-center lg:text-start"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 border" style={{ background: 'var(--accent-glow)', borderColor: 'var(--border-hover)', color: 'var(--accent)' }}>
                  <IconComp size={18} />
                </div>
                <div className="stat-number text-gold-grad">
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-sm font-medium" style={{ color: 'var(--text-soft)' }}>{s.label}</div>
                <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-faint)' }}>{s.sub}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
