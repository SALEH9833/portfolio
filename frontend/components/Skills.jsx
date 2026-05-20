import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import Icon from './Icons';
import { useI18n, pickLocale } from '../lib/i18n';

const CAT_ICON = {
  shield:   'Shield',
  code:     'Code',
  database: 'Database',
  tool:     'Tool',
};

function SkillRow({ skill, index, inView }) {
  return (
    <div className="mb-3.5">
      <div className="flex justify-between mb-1.5">
        <span className="text-sm text-ink-100">{skill.name}</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 + index * 0.06 }}
          className="text-xs font-mono text-ink-400"
        >
          {skill.level}%
        </motion.span>
      </div>
      <div className="skill-track">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${skill.level}%` } : {}}
          transition={{ duration: 1.2, delay: 0.3 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="skill-fill"
        />
      </div>
    </div>
  );
}

function CategoryCard({ cat, index, locale }) {
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: true });
  const IconC = Icon[CAT_ICON[cat.icon]] || Icon.Sparkles;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="surface p-6 lg:p-7"
    >
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/[0.05]">
        <div className="w-10 h-10 rounded-xl bg-gold-glow border border-gold-500/20 flex items-center justify-center text-gold-500">
          <IconC size={18} />
        </div>
        <h3 className="font-display text-xl text-ink-50">{pickLocale(cat.name, locale)}</h3>
      </div>
      {cat.items.map((s, i) => (
        <SkillRow key={s.name} skill={s} index={i} inView={inView} />
      ))}
    </motion.div>
  );
}

export default function Skills({ skills }) {
  const { t, locale } = useI18n();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const categories = skills?.categories     || [];
  const certs      = skills?.certifications || [];

  return (
    <section id="skills" className="bg-ink-900 py-28 lg:py-30">
      <div className="sep mb-0" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-22">

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-18 max-w-3xl"
        >
          <div className="eyebrow mb-5">{t('skills.eyebrow')}</div>
          <h2 className="section-title text-balance">
            {t('skills.title1')} <em>{t('skills.titleAccent')}</em> {t('skills.title2')}
          </h2>
          <p className="text-ink-300 mt-5 text-base leading-[1.85] max-w-lg">
            {t('skills.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 mb-14">
          {categories.map((cat, i) => (
            <CategoryCard key={i} cat={cat} index={i} locale={locale} />
          ))}
        </div>

        {certs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 pt-6"
          >
            <p className="w-full text-center text-2xs font-mono text-ink-400 tracking-[0.22em] uppercase mb-2">
              {t('skills.certTitle')}
            </p>
            {certs.map(c => (
              <div key={c.name} className="surface px-5 py-3.5 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-300 to-gold-700 flex items-center justify-center text-ink-950 shrink-0">
                  <Icon.Award size={18} strokeWidth={2} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink-50">{c.name}</div>
                  <div className="text-xs font-mono text-ink-400">{c.issuer} · {c.year}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
