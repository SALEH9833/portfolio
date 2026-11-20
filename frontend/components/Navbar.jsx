import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icons';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../lib/i18n';

const SECTIONS = ['hero', 'about', 'skills', 'projects', 'experience', 'contact'];

export default function Navbar() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [active,   setActive]   = useState('hero');
  const [open,     setOpen]     = useState(false);

  const items = [
    { label: t('nav.home'),       href: 'hero',       num: '01' },
    { label: t('nav.about'),      href: 'about',      num: '02' },
    { label: t('nav.skills'),     href: 'skills',     num: '03' },
    { label: t('nav.projects'),   href: 'projects',   num: '04' },
    { label: t('nav.experience'), href: 'experience', num: '05' },
    { label: t('nav.contact'),    href: 'contact',    num: '06' },
  ];

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 30);
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i]);
        if (el && window.scrollY >= el.offsetTop - 140) { setActive(SECTIONS[i]); break; }
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 inset-x-0 z-50 transition-colors duration-200"
        style={{
          backgroundColor: scrolled ? 'var(--bg)' : 'transparent',
          borderBottom: scrolled ? '1px solid var(--border)' : 'none',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">

          <button onClick={() => go('hero')} className="flex items-center gap-3 group">
            <span className="w-8 h-8 rounded-md flex items-center justify-center font-display font-semibold text-base" style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
              S
            </span>
            {/* Brand text removed — only the S monogram remains */}
          </button>

          <div className="hidden lg:flex items-center gap-6">
            {items.map(item => (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                className={`nav-link ${active === item.href ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/cv`}
              target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost py-2 px-4 text-xs ms-1"
              title="Télécharger le CV de Saleh"
            >
              <Icon.Download size={14} />
              {t('common.cv')}
            </a>
          </div>

          <div className="lg:hidden flex items-center gap-1.5">
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              className="lang-toggle"
              onClick={() => setOpen(!open)}
              aria-label={t('nav.menu')}
            >
              {open ? <Icon.Close size={18} /> : <Icon.Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-7"
            style={{ background: 'var(--bg)' }}
          >
            {items.map((item, i) => (
              <motion.button
                key={item.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => go(item.href)}
                className="font-display text-3xl font-semibold"
                style={{ color: 'var(--text)' }}
              >
                {item.label}
              </motion.button>
            ))}
            <motion.a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/cv`}
              target="_blank" rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: items.length * 0.06 }}
              className="btn btn-gold mt-4"
            >
              <Icon.Download size={16} />
              {t('common.cv')}
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
