import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import Icon from './Icons';
import { useI18n, pickLocale } from '../lib/i18n';

const STRENGTH_ICONS = {
  shield: 'Shield',
  users: 'Users',
  zap: 'Zap',
  'book-open': 'BookOpen',
};

function LangBar({ lang, index, inView, locale }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-ink-100">{lang.name}</span>
        <span className="text-xs font-mono text-ink-400">{pickLocale(lang.level, locale)}</span>
      </div>
      <div className="skill-track">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${lang.proficiency}%` } : {}}
          transition={{ duration: 1.2, delay: 0.2 + index * 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="skill-fill"
        />
      </div>
    </div>
  );
}

export default function About({ profile, education }) {
  const { t, locale } = useI18n();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section id="about" className="bg-ink-950 py-28 lg:py-30">
      <div className="sep mb-0" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-22">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-18"
        >
          <div className="eyebrow mb-5">{t('about.eyebrow')}</div>
          <h2 className="section-title text-balance">
            {t('about.title1')}<br />
            <em>{t('about.title2')}</em>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-14 lg:gap-18">

          {/* LEFT — bio + contact + langs (7) */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="space-y-5 text-ink-200 text-[1rem] leading-[1.85] mb-9">
              <p>
                Je m'appelle <strong className="text-ink-50 font-semibold">Saleh Mahamat Saleh</strong>.
                Étudiant en 2<sup>ème</sup> année DUT Informatique spécialité{' '}
                <em className="text-gold-500 font-display italic font-semibold not-italic-fallback">Cybersécurité</em> à l'École Supérieure de Technologie de Safi.
              </p>
              <p>
                Originaire du Tchad, installé au Maroc, je cultive une approche analytique rigoureuse doublée d'une curiosité technique insatiable. Mes deux casquettes — <span className="text-ink-50">développeur full-stack</span> et <span className="text-ink-50">aspirant expert en sécurité</span> — me permettent de concevoir des solutions à la fois fonctionnelles et robustes.
              </p>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-9">
              {[
                { k: t('about.info.location'), v: profile?.location, icon: 'Pin'   },
                { k: t('about.info.email'),    v: profile?.email,    icon: 'Mail',  href: `mailto:${profile?.email}` },
                { k: t('about.info.phone'),    v: profile?.phone,    icon: 'Phone', href: `tel:${profile?.phone?.replace(/\s/g,'')}` },
                { k: t('about.info.license'),  v: profile?.license,  icon: 'Car'   },
              ].map(item => {
                const IconC = Icon[item.icon];
                return (
                  <div key={item.k} className="surface-static p-3.5">
                    <div className="flex items-center gap-1.5 text-2xs font-mono text-ink-500 uppercase tracking-wider mb-1.5">
                      <IconC size={11} /> {item.k}
                    </div>
                    {item.href ? (
                      <a href={item.href} className="text-sm text-gold-500 hover:text-gold-300 transition-colors break-all">{item.v}</a>
                    ) : (
                      <div className="text-sm text-ink-100 font-medium">{item.v}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Languages */}
            <div className="surface p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Icon.Globe size={16} className="text-gold-500" />
                <h3 className="text-sm font-semibold text-ink-50 uppercase tracking-wider">{t('about.languages')}</h3>
              </div>
              {profile?.languages?.map((lang, i) => (
                <LangBar key={lang.name} lang={lang} index={i} inView={inView} locale={locale} />
              ))}
            </div>
          </motion.div>

          {/* RIGHT — strengths + education (5) */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <h3 className="font-display text-2xl text-ink-50 mb-5">
              <em className="text-gold-500">{t('about.strengths')}</em> {t('about.strengthsAccent')}
            </h3>
            <div className="space-y-3 mb-10">
              {profile?.strengths?.map((s, i) => {
                const IconC = Icon[STRENGTH_ICONS[s.icon]] || Icon.Sparkles;
                return (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, x: 12 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="surface p-4 flex gap-3.5 items-start"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gold-glow border border-gold-500/20 flex items-center justify-center text-gold-500 shrink-0 mt-0.5">
                      <IconC size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-50 mb-0.5">{pickLocale(s.title, locale)}</div>
                      <div className="text-sm text-ink-300 leading-relaxed">{pickLocale(s.desc, locale)}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <h3 className="font-display text-2xl text-ink-50 mb-5">
              <em className="text-gold-500">{t('about.education')}</em>
            </h3>
            <div className="space-y-3">
              {education?.map((edu, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.45 + i * 0.08 }}
                  className={`surface p-4 border-l-[3px] ${edu.current ? 'border-l-gold-500' : 'border-l-ink-700'}`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-start gap-2.5">
                      <Icon.GraduationCap size={16} className="text-gold-500 mt-1 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-ink-50 leading-snug">{pickLocale(edu.degree, locale)}</div>
                        <div className="text-xs text-gold-500 font-mono mt-1">{edu.school}</div>
                        <div className="text-xs text-ink-400 font-mono mt-0.5">{edu.location} · {edu.period}</div>
                      </div>
                    </div>
                    {edu.current && (
                      <span className="text-2xs font-mono bg-gold-glow text-gold-500 border border-gold-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {t('about.current')}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
