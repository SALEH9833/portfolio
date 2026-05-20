import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import Icon from './Icons';
import { useI18n, pickLocale } from '../lib/i18n';

const TYPE = {
  Stage:                { color: '#c8a96e', icon: 'Briefcase'    },
  'Projet académique':  { color: '#7c9c83', icon: 'GraduationCap' },
  Emploi:               { color: '#d97b6c', icon: 'Sparkles'     },
};

function Item({ item, index, isLast, t: i18n, locale }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const ty = TYPE[item.type] || TYPE.Stage;
  const IconC = Icon[ty.icon];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative pl-10 pb-10 last:pb-0"
    >
      {!isLast && <div className="tl-rail" />}
      <div className={`tl-node ${inView ? 'active' : ''}`} />

      <div className="surface p-5 lg:p-6 border-l-2" style={{ borderLeftColor: `${ty.color}40` }}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2.5">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `${ty.color}12`, border: `1px solid ${ty.color}25`, color: ty.color }}
            >
              <IconC size={16} />
            </div>
            <div>
              <h3 className="font-display text-lg lg:text-xl text-ink-50 leading-snug">{pickLocale(item.role, locale)}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: ty.color }}>{item.company}</span>
                <span className="text-ink-600 text-xs">·</span>
                <span className="text-xs text-ink-300">{item.location}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className="text-2xs font-mono px-2.5 py-0.5 rounded-full border"
              style={{ color: ty.color, borderColor: `${ty.color}30`, background: `${ty.color}0d` }}
            >
              {item.type}
            </span>
            {item.current && (
              <span className="flex items-center gap-1.5 text-2xs font-mono text-sage">
                <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
                {i18n('experience.current')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-ink-400 mb-3">
          <Icon.Calendar size={11} />
          {item.period}
        </div>

        <p className="text-sm text-ink-200 leading-[1.8] mb-3">{pickLocale(item.description, locale)}</p>

        {(() => {
          const tasks = pickLocale(item.tasks, locale) || item.tasks || [];
          return Array.isArray(tasks) && tasks.length > 0 && (
            <ul className="space-y-1.5 mt-3 pt-3 border-t border-white/[0.04]">
              {tasks.map((task, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ink-300">
                  <Icon.Check size={13} className="text-gold-500 mt-1 shrink-0" />
                  {task}
                </li>
              ))}
            </ul>
          );
        })()}
      </div>
    </motion.div>
  );
}

export default function Experience({ experience }) {
  const { t, locale } = useI18n();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section id="experience" className="bg-ink-900 py-28 lg:py-30">
      <div className="sep mb-0" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-22">

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-18 max-w-3xl"
        >
          <div className="eyebrow mb-5">{t('experience.eyebrow')}</div>
          <h2 className="section-title text-balance">
            {t('experience.title1')} <em>{t('experience.titleAccent')}</em><br />
            {t('experience.title2')}
          </h2>
          <p className="text-ink-300 mt-5 text-base leading-[1.85] max-w-lg">
            {t('experience.subtitle')}
          </p>
        </motion.div>

        <div className="max-w-3xl">
          {experience?.map((item, i) => (
            <Item key={item.id} item={item} index={i} isLast={i === experience.length - 1} t={t} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
