import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import Icon from './Icons';
import { useI18n, pickLocale } from '../lib/i18n';

const ease = [0.16, 1, 0.3, 1];

function MagneticButton({ children, className = '', ...rest }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.25 });
  };
  return (
    <motion.button
      ref={ref}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, mass: 0.4 }}
      onMouseMove={onMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export default function Hero({ profile }) {
  const { t, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const typing = t('hero.typing');

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[60rem] h-[60rem]" style={{ background: 'radial-gradient(circle, var(--hero-glow-1), transparent 60%)' }} />
        <div className="absolute -bottom-32 -left-32 w-[50rem] h-[50rem]" style={{ background: 'radial-gradient(circle, var(--hero-glow-2), transparent 60%)' }} />
      </div>
      <div className="noise-overlay" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">

          <div className="order-2 lg:order-1 lg:col-span-7">
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }} className="eyebrow mb-7">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--sage)' }} />
              {t('hero.available')}
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease }} className="hero-name mb-6">
              {profile?.firstName || 'Saleh'}<br />
              <em>{profile?.name?.split(' ').slice(1).join(' ') || 'Mahamat Saleh'}.</em>
            </motion.h1>

            {mounted && Array.isArray(typing) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-lg font-sans font-light mb-7 flex flex-wrap items-baseline gap-2" style={{ color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--text-faint)' }}>{t('hero.iAm')}</span>
                <span className="font-medium font-display italic text-xl" style={{ color: 'var(--text)' }}>
                  <TypeAnimation
                    key={locale}
                    sequence={typing.flatMap(s => [s, 2400])}
                    wrapper="span"
                    speed={55}
                    repeat={Infinity}
                  />
                </span>
              </motion.div>
            )}

            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.5, ease }} className="gold-line origin-left mb-7" />

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, ease }} className="text-base lg:text-[1.05rem] leading-[1.85] max-w-[540px] mb-9 text-balance" style={{ color: 'var(--text-soft)' }}>
              {pickLocale(profile?.bio, locale) || 'Passionné par la sécurité des systèmes d\'information.'}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, ease }} className="flex flex-wrap gap-3 mb-10">
              <MagneticButton onClick={() => scrollTo('contact')} className="btn btn-gold">
                <Icon.Mail size={16} />
                {t('hero.contactMe')}
              </MagneticButton>
              <MagneticButton onClick={() => scrollTo('projects')} className="btn btn-ghost">
                {t('hero.seeProjects')}
              </MagneticButton>
              <MagneticButton
                onClick={() => window.location.href = '/cv-templates'}
                className="btn btn-ghost"
                style={{ borderColor: 'var(--accent)' }}
              >
                <Icon.Download size={16} />
                {t('hero.buildCv') || 'Créez votre CV pro'}
              </MagneticButton>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }} className="flex items-center gap-5">
              <div className="flex items-center gap-2.5">
                {[
                  { href: profile?.github   || 'https://github.com/SALEH9833',          label: 'GitHub',   icon: 'Github' },
                  { href: profile?.linkedin || 'https://linkedin.com/in/Saleh-Mahamat', label: 'LinkedIn', icon: 'LinkedIn' },
                  { href: `mailto:${profile?.email || 'salehmhtsaleh224@gmail.com'}`, label: 'Email',    icon: 'Mail' },
                ].map((s) => {
                  const IconC = Icon[s.icon];
                  return (
                    <a key={s.label} href={s.href} target={s.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" aria-label={s.label}
                       className="w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300"
                       style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                       onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--accent-glow)'; }}
                       onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}>
                      <IconC size={16} />
                    </a>
                  );
                })}
              </div>
              <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, var(--border), transparent)' }} />
              <span className="text-2xs font-mono tracking-[0.25em] uppercase" style={{ color: 'var(--text-faint)' }}>{t('hero.follow')}</span>
            </motion.div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="relative">
              <div className="absolute -inset-5 rounded-full border border-dashed pointer-events-none" style={{ borderColor: 'var(--accent-glow)', animation: 'spin 14s linear infinite' }} />
              <div className="absolute -inset-1 rounded-full blur-xl pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--accent-glow), transparent 70%)' }} />

              <div className="relative w-64 h-64 lg:w-[22rem] lg:h-[22rem] rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--border-hover)', boxShadow: '0 0 80px -20px var(--accent-glow)' }}>
                {(() => {
                  const raw = profile?.photo_url || profile?.photoUrl || '';
                  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
                  // Relative path starting with /uploads or /images → prefix with backend URL
                  const src = raw.startsWith('/') ? `${backend}${raw}` : (raw || 'https://avatars.githubusercontent.com/SALEH9833');
                  return <img src={src} alt={profile?.name || 'Saleh'} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" loading="eager" />;
                })()}
              </div>

              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-3 -right-4 lg:-right-8 float-chip flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                  <Icon.Shield size={14} />
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight" style={{ color: 'var(--text)' }}>{t('hero.cyber.label')}</div>
                  <div className="text-2xs font-mono mt-px" style={{ color: 'var(--text-faint)' }}>{t('hero.cyber.sub')}</div>
                </div>
              </motion.div>

              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} className="absolute -bottom-3 -left-4 lg:-left-8 float-chip flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                  <Icon.Code size={14} />
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight" style={{ color: 'var(--text)' }}>{t('hero.stack.label')}</div>
                  <div className="text-2xs font-mono mt-px" style={{ color: 'var(--text-faint)' }}>{t('hero.stack.sub')}</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 select-none cursor-default">
          <span className="text-2xs font-mono tracking-[0.25em] uppercase" style={{ color: 'var(--text-faint)' }}>{t('hero.scroll')}</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} className="w-4 h-7 rounded-full border flex items-start justify-center pt-1.5" style={{ borderColor: 'var(--border)' }}>
            <div className="w-0.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
