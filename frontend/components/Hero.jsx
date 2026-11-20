import { motion } from 'framer-motion';
import Icon from './Icons';
import { useI18n, pickLocale } from '../lib/i18n';

// Staggered entrance: each block fades up slightly, one after the other
const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function Hero({ profile }) {
  const { t, locale } = useI18n();

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const name = profile?.name || 'Saleh Mahamat Saleh';
  const title = pickLocale(profile?.title, locale) || 'Étudiant en Cybersécurité & Développeur Full-Stack';
  const bio = pickLocale(profile?.bio, locale) || "Passionné par la sécurité des systèmes d'information.";

  const raw = profile?.photo_url || profile?.photoUrl || '';
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const photo = raw.startsWith('/') ? `${backend}${raw}` : (raw || 'https://avatars.githubusercontent.com/SALEH9833');

  const links = [
    { href: profile?.github   || 'https://github.com/SALEH9833',          label: 'GitHub' },
    { href: profile?.linkedin || 'https://linkedin.com/in/Saleh-Mahamat', label: 'LinkedIn' },
    { href: `mailto:${profile?.email || ''}`,                             label: 'Email' },
  ].filter((l) => l.href !== 'mailto:');

  return (
    <section id="hero" className="hero">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="grid md:grid-cols-[1fr_auto] gap-10 md:gap-16 items-start">

          <motion.div variants={container} initial="hidden" animate="show">
            <motion.p variants={item} className="hero-kicker">
              <span className="status-dot" aria-hidden="true" />
              {t('hero.available')}
            </motion.p>

            <motion.h1 variants={item} className="hero-name">{name}</motion.h1>
            <motion.p variants={item} className="hero-title">{title}</motion.p>

            <motion.p variants={item} className="hero-bio">{bio}</motion.p>

            <motion.div variants={item} className="flex flex-wrap gap-3 mt-8">
              <button onClick={() => scrollTo('contact')} className="btn btn-gold">
                <Icon.Mail size={16} />
                {t('hero.contactMe')}
              </button>
              <button onClick={() => scrollTo('projects')} className="btn btn-ghost btn-arrow">
                {t('hero.seeProjects')}
                <span aria-hidden="true">→</span>
              </button>
            </motion.div>

            <motion.ul variants={item} className="hero-links">
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target={l.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.figure
            className="hero-photo order-first md:order-none"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={photo} alt={name} loading="eager" />
          </motion.figure>
        </div>
      </div>
    </section>
  );
}
