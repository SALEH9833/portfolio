import Icon from './Icons';
import { useI18n } from '../lib/i18n';

const LINKS = [
  { label: 'Accueil',     id: 'hero' },
  { label: 'À propos',    id: 'about' },
  { label: 'Projets',     id: 'projects' },
  { label: 'Expérience',  id: 'experience' },
  { label: 'Contact',     id: 'contact' },
];

const SOCIALS = [
  { label: 'GitHub',   href: 'https://github.com/SALEH9833',          icon: 'Github' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/Saleh-Mahamat', icon: 'LinkedIn' },
  { label: 'Email',    href: 'mailto:salehmhtsaleh224@gmail.com',   icon: 'Mail' },
];

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="relative bg-ink-950 border-t border-white/[0.04] pt-16 pb-8">
      <div className="absolute inset-0 bg-gold-radial opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">

        {/* Big CTA strip */}
        <div className="text-center mb-14 pb-14 border-b border-white/[0.05]">
          <p className="font-display text-3xl lg:text-5xl text-ink-50 leading-tight mb-3 text-balance">
            {t('footer.cta1')} <em className="text-gold-grad">{t('footer.ctaAccent')}</em> {t('footer.cta2')}
          </p>
          <p className="text-ink-300 mb-7 max-w-xl mx-auto leading-relaxed">
            {t('footer.ctaSub')}
          </p>
          <a
            href="mailto:salehmhtsaleh224@gmail.com"
            className="btn btn-gold"
          >
            <Icon.Mail size={16} />
            salehmhtsaleh224@gmail.com
          </a>
        </div>

        {/* Main row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-ink-950 font-display font-bold text-sm">S</span>
            <div>
              <div className="text-sm font-medium text-ink-100">Saleh Mahamat Saleh</div>
              <div className="text-2xs font-mono text-ink-500">cybersecurity · full-stack · safi, maroc</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {LINKS.map(l => (
              <button
                key={l.id}
                onClick={() => document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' })}
                className="text-xs text-ink-400 font-mono hover:text-gold-500 transition-colors"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {SOCIALS.map(s => {
              const IconC = Icon[s.icon];
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-white/[0.07] flex items-center justify-center text-ink-400 hover:text-gold-500 hover:border-gold-500/30 hover:bg-gold/5 transition-all duration-300"
                >
                  <IconC size={14} />
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-2xs text-ink-600 font-mono">
            © {new Date().getFullYear()} Saleh Mahamat Saleh · {t('footer.rights')}
          </p>
          <p className="text-2xs text-ink-600 font-mono">
            {t('footer.built')}
          </p>
        </div>
      </div>
    </footer>
  );
}
