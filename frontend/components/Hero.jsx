import Icon from './Icons';
import { useI18n, pickLocale } from '../lib/i18n';

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

          <div>
            <p className="hero-kicker">
              <span className="status-dot" aria-hidden="true" />
              {t('hero.available')}
            </p>

            <h1 className="hero-name">{name}</h1>
            <p className="hero-title">{title}</p>

            <p className="hero-bio">{bio}</p>

            <div className="flex flex-wrap gap-3 mt-8">
              <button onClick={() => scrollTo('contact')} className="btn btn-gold">
                <Icon.Mail size={16} />
                {t('hero.contactMe')}
              </button>
              <button onClick={() => scrollTo('projects')} className="btn btn-ghost">
                {t('hero.seeProjects')}
              </button>
            </div>

            <ul className="hero-links">
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target={l.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <figure className="hero-photo order-first md:order-none">
            <img src={photo} alt={name} loading="eager" />
          </figure>
        </div>
      </div>
    </section>
  );
}
