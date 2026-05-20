import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import axios from 'axios';
import Icon from '../components/Icons';
import ThemeToggle from '../components/ThemeToggle';
import { userAuth } from '../lib/user-auth';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_USER = process.env.NEXT_PUBLIC_PAYPAL_ME || 'salehmahamatsaleh01';

export async function getServerSideProps() {
  let templates = [];
  try {
    const res = await axios.get(`${API}/api/cv-templates`, { timeout: 8000 });
    templates = res.data?.data || [];
  } catch (err) {
    console.warn('cv-templates SSR fetch failed:', err.message);
  }
  return { props: { templates } };
}

const CATEGORIES = [
  { id: 'all',       label: 'Tous' },
  { id: 'Universel', label: 'Universel' },
  { id: 'Tech',      label: 'Tech / Dev' },
  { id: 'Créatif',   label: 'Créatif' },
  { id: 'Corporate', label: 'Corporate' },
];

export default function CVTemplatesGallery({ templates: initial }) {
  const [templates] = useState(initial || []);
  const [cat, setCat]       = useState('all');
  const [tier, setTier]     = useState('all'); // all | free | premium
  const [search, setSearch] = useState('');
  const [user, setUser]     = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    setUser(userAuth.getUser());
    // Check for in-progress CV
    try {
      const raw = typeof window !== 'undefined' && localStorage.getItem('cv_builder_data_v1');
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.personal?.fullName || (d?.experience || []).length || (d?.education || []).length) {
          setHasDraft(true);
        }
      }
    } catch {}
  }, []);

  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (cat !== 'all' && t.category !== cat) return false;
      if (tier === 'free' && t.is_premium) return false;
      if (tier === 'premium' && !t.is_premium) return false;
      if (search) {
        const q = search.toLowerCase();
        const blob = `${t.name} ${t.description} ${(t.tags || []).join(' ')} ${t.category}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [templates, cat, tier, search]);

  const freeCount    = templates.filter(t => !t.is_premium).length;
  const premiumCount = templates.filter(t =>  t.is_premium).length;

  const title       = 'Modèles CV gratuits & premium — Créez votre CV pro en 5 minutes';
  const description = `${templates.length}+ modèles de CV professionnels : ${freeCount} gratuits (éditeur en ligne) + ${premiumCount} designs premium Canva. Pour développeurs, marketers, cadres, étudiants. Téléchargement PDF, ATS-friendly, multilingue (FR/EN/AR).`;
  const url         = 'https://saleh-portfolio.com/cv-templates';

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: title,
        description,
        url,
      },
      {
        '@type': 'ItemList',
        numberOfItems: templates.length,
        itemListElement: templates.slice(0, 20).map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'CreativeWork',
            name: t.name,
            description: t.description,
            image: t.preview_url || undefined,
            offers: {
              '@type': 'Offer',
              price: t.price || 0,
              priceCurrency: t.currency || 'EUR',
              availability: 'https://schema.org/InStock',
            },
          },
        })),
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content="modèle CV gratuit, CV professionnel, CV développeur, CV cybersécurité, CV étudiant Maroc, CV PDF, créer CV en ligne, template Canva CV, CV ATS, CV moderne, CV créatif, CV cadre, exemple CV, CV 2026" />
        <link rel="canonical" href={url} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="fr_FR" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 92%, transparent)' }}>
          <div className="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: 'var(--bg)' }}>S</div>
              <div className="hidden sm:block">
                <div className="font-display text-sm" style={{ color: 'var(--text)' }}>Modèles CV</div>
                <div className="text-2xs font-mono" style={{ color: 'var(--text-muted)' }}>{templates.length} modèles · {freeCount} gratuits</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {user ? (
                <Link href="/my-cvs" className="btn btn-gold py-1.5 px-3 text-xs">
                  <Icon.Users size={12} /> <span className="hidden sm:inline">Mes CV</span>
                </Link>
              ) : (
                <Link href="/login" className="btn btn-ghost py-1.5 px-3 text-xs" style={{ borderColor: 'var(--accent)' }}>
                  <span className="hidden sm:inline">Connexion</span>
                  <span className="sm:hidden">Login</span>
                </Link>
              )}
              <Link href="/cv-builder" className="btn btn-ghost py-1.5 px-3 text-xs">
                <Icon.Code size={12} /> <span className="hidden sm:inline">Éditeur</span>
              </Link>
              <Link href="/" className="btn btn-ghost py-1.5 px-3 text-xs">
                <span className="hidden sm:inline">Portfolio</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero / SEO content */}
        <section className="relative max-w-5xl mx-auto px-4 lg:px-6 pt-12 lg:pt-20 pb-10 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem]"
              style={{ background: 'radial-gradient(circle, var(--hero-glow-1), transparent 60%)' }} />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-balance relative"
            style={{ color: 'var(--text)' }}
          >
            Modèles de CV <em className="text-gold-grad">professionnels</em>
            <br />gratuits & premium
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="mt-6 text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: 'var(--text-soft)' }}
          >
            <strong>{templates.length} modèles</strong> pour développeurs, marketers, cadres et étudiants.
            Éditeur en ligne gratuit ou designs premium Canva. Export PDF en 5 minutes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-7 flex flex-wrap justify-center gap-2.5"
          >
            <span className="text-xs font-mono px-3 py-1.5 rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-soft)' }}>Téléchargement PDF</span>
            <span className="text-xs font-mono px-3 py-1.5 rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-soft)' }}>ATS-friendly</span>
            <span className="text-xs font-mono px-3 py-1.5 rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-soft)' }}>Multilingue FR / EN / AR</span>
            <span className="text-xs font-mono px-3 py-1.5 rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-soft)' }}>✓ Données privées</span>
          </motion.div>
        </section>

        {/* Resume CV banner */}
        {hasDraft && (
          <section className="max-w-5xl mx-auto px-4 lg:px-6">
            <Link href="/cv-builder">
              <div className="surface p-4 lg:p-5 flex items-center gap-4 transition-all hover:scale-[1.01] cursor-pointer"
                style={{ borderColor: 'var(--border-hover)', background: 'var(--accent-glow)' }}>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
                  <Icon.Edit size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text)' }}>
                    Vous avez un CV en cours
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Reprenez votre CV là où vous l'avez laissé. {user ? 'Synchronisé sur votre compte.' : 'Sauvegardé dans ce navigateur.'}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                  Continuer <Icon.ChevronRight size={14} />
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Filters */}
        <section className="max-w-6xl mx-auto px-4 lg:px-6 py-4 sticky top-14 z-20 backdrop-blur-sm" style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)' }}>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: cat === c.id ? 'var(--accent)' : 'var(--surface-2)',
                    color:      cat === c.id ? 'var(--bg)'     : 'var(--text-soft)',
                    border:     `1px solid ${cat === c.id ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 ml-auto">
              {[
                { id: 'all',     label: 'Tous' },
                { id: 'free',    label: '★ Gratuit' },
                { id: 'premium', label: 'Premium' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTier(t.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: tier === t.id ? 'var(--accent-glow)' : 'transparent',
                    color:      tier === t.id ? 'var(--accent)'      : 'var(--text-muted)',
                    border:     `1px solid ${tier === t.id ? 'var(--border-hover)' : 'var(--border)'}`,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (tech, marketing, étudiant...)"
              className="field text-xs w-full sm:w-64 ms-auto"
            />
          </div>
        </section>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
              Aucun modèle ne correspond à votre recherche.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {filtered.map((t, i) => (
                <motion.article
                  key={t.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="group surface overflow-hidden flex flex-col"
                >
                  {/* Preview */}
                  <div className="relative aspect-[3/4] overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    {t.preview_url ? (
                      <img
                        src={t.preview_url}
                        alt={t.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <FreeTemplatePreview builderId={t.builder_id || t.slug} name={t.name} />
                    )}
                    {/* Badge */}
                    <div className="absolute top-2.5 start-2.5">
                      {t.is_premium ? (
                        <span className="text-2xs font-mono uppercase px-2 py-1 rounded-full flex items-center gap-1"
                          style={{ background: 'var(--accent)', color: 'var(--bg)', fontWeight: 600 }}>
                          <Icon.Star size={10} /> Premium {t.price}€
                        </span>
                      ) : (
                        <span className="text-2xs font-mono uppercase px-2 py-1 rounded-full flex items-center gap-1"
                          style={{ background: 'rgba(167, 195, 165, 0.95)', color: '#1a1a1a', fontWeight: 600 }}>
                          <Icon.Check size={10} /> Gratuit
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2.5 end-2.5">
                      <span className="text-2xs font-mono px-2 py-0.5 rounded backdrop-blur"
                        style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                        {t.category}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h2 className="font-display text-lg leading-tight" style={{ color: 'var(--text)' }}>
                      {t.name}
                    </h2>
                    <p className="text-sm mt-1.5 leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>
                      {t.description}
                    </p>
                    {(t.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {(t.tags || []).slice(0, 4).map((tag, j) => (
                          <span key={j} className="text-2xs font-mono px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      {t.is_premium ? (
                        <PremiumButton template={t} />
                      ) : (
                        <Link
                          href={`/cv-builder?template=${t.builder_id || t.slug}`}
                          className="btn btn-gold py-2 px-3 text-xs flex-1"
                        >
                          Utiliser ce modèle
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        {/* SEO content section */}
        <section className="max-w-4xl mx-auto px-4 lg:px-6 py-16 prose-light">
          <div className="surface p-6 lg:p-8">
            <h2 className="font-display text-2xl mb-3" style={{ color: 'var(--text)' }}>
              Comment choisir le bon modèle de CV ?
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
              <p>
                <strong>Pour les développeurs et professionnels tech</strong> — privilégie un modèle « Tech » avec
                des sections claires pour les langages, les frameworks et les projets GitHub. Évite les designs trop chargés :
                les recruteurs tech veulent lire ton stack en 10 secondes.
              </p>
              <p>
                <strong>Pour les candidatures classiques (grandes entreprises)</strong> — choisis un modèle « Universel » ou
                « Corporate », sobre, en noir et blanc. Ces designs passent les filtres ATS (logiciels qui scannent les CV
                avant qu'un humain ne les lise).
              </p>
              <p>
                <strong>Pour les métiers créatifs</strong> (marketing, design, communication) — ose un modèle « Créatif »
                avec des couleurs et une mise en page distinctive. Ton CV doit montrer ton sens du visuel.
              </p>
              <p>
                <strong>Pour les étudiants et premiers stages</strong> — un modèle minimaliste valorise mieux peu d'expérience.
                Met l'accent sur ta formation, tes projets académiques et tes compétences techniques.
              </p>
            </div>

            <h2 className="font-display text-2xl mt-8 mb-3" style={{ color: 'var(--text)' }}>
              Gratuit vs premium — quelle différence ?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="font-semibold mb-2" style={{ color: 'var(--sage)' }}>✓ Modèles gratuits</div>
                <ul className="text-xs space-y-1.5 list-disc list-inside" style={{ color: 'var(--text-muted)' }}>
                  <li>Éditeur en ligne intégré</li>
                  <li>Sauvegarde locale (privée)</li>
                  <li>Export PDF illimité</li>
                  <li>5 designs au choix</li>
                  <li>Multilingue FR / EN / AR</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-hover)' }}>
                <div className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>★ Modèles premium</div>
                <ul className="text-xs space-y-1.5 list-disc list-inside" style={{ color: 'var(--text-muted)' }}>
                  <li>Designs Canva premium</li>
                  <li>Édition dans Canva (interface pro)</li>
                  <li>{premiumCount}+ designs uniques</li>
                  <li>Mise à jour à vie</li>
                  <li>Support par WhatsApp</li>
                </ul>
              </div>
            </div>

            <h2 className="font-display text-2xl mt-8 mb-3" style={{ color: 'var(--text)' }}>
              FAQ
            </h2>
            <div className="space-y-4 text-sm" style={{ color: 'var(--text-soft)' }}>
              <details>
                <summary className="cursor-pointer font-semibold" style={{ color: 'var(--text)' }}>Mes données sont-elles privées ?</summary>
                <p className="mt-2 leading-relaxed">Oui. L'éditeur en ligne stocke tout dans <em>localStorage</em> de ton navigateur — aucune information personnelle n'est envoyée sur le serveur.</p>
              </details>
              <details>
                <summary className="cursor-pointer font-semibold" style={{ color: 'var(--text)' }}>Les modèles passent-ils les filtres ATS ?</summary>
                <p className="mt-2 leading-relaxed">Les modèles « Classique » et « Minimaliste » sont conçus pour les robots ATS (recruteurs grandes entreprises). Les modèles créatifs sont mieux adaptés aux candidatures spontanées.</p>
              </details>
              <details>
                <summary className="cursor-pointer font-semibold" style={{ color: 'var(--text)' }}>Comment payer un modèle premium ?</summary>
                <p className="mt-2 leading-relaxed">Paiement via <strong>PayPal</strong>. Une fois le paiement validé, je t'envoie le lien d'édition Canva par email ou WhatsApp sous 24h.</p>
              </details>
            </div>
          </div>
        </section>

        <footer className="border-t py-8 text-center text-xs font-mono" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} · Modèles CV par Saleh Mahamat Saleh · <Link href="/" className="hover:underline">Portfolio</Link>
        </footer>
      </main>
    </>
  );
}

// Mini SVG preview for free (builder) templates — gives each one a distinctive look
function FreeTemplatePreview({ builderId, name }) {
  const config = {
    modern:   { bg: '#ffffff', side: '#c8a96e', accent: '#1a1a1a', layout: 'sidebar' },
    classic:  { bg: '#ffffff', side: null,      accent: '#1a1a1a', layout: 'classic' },
    creative: { bg: '#ffffff', side: '#e47c69', accent: '#e47c69', layout: 'header' },
    minimal:  { bg: '#ffffff', side: null,      accent: '#222222', layout: 'minimal' },
    tech:     { bg: '#0d1117', side: null,      accent: '#00d084', layout: 'tech' },
  }[builderId] || { bg: '#fff', side: '#c8a96e', accent: '#1a1a1a', layout: 'sidebar' };

  return (
    <div className="w-full h-full p-3 group-hover:scale-[1.03] transition-transform duration-500" style={{ background: 'var(--surface-3)' }}>
      <svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
        <rect x="5" y="5" width="190" height="270" fill={config.bg} rx="2" />
        {config.layout === 'sidebar' && (
          <>
            <rect x="5" y="5" width="60" height="270" fill={config.side} rx="2" />
            <circle cx="35" cy="40" r="18" fill="#fff" opacity="0.95" />
            <rect x="14" y="68" width="42" height="3" fill="#fff" rx="1" />
            <rect x="14" y="76" width="32" height="2" fill="#fff" opacity="0.7" />
            <rect x="14" y="100" width="28" height="2" fill="#fff" />
            <rect x="14" y="108" width="38" height="1.5" fill="#fff" opacity="0.7" />
            <rect x="14" y="115" width="36" height="1.5" fill="#fff" opacity="0.7" />
            <rect x="14" y="122" width="40" height="1.5" fill="#fff" opacity="0.7" />
            <rect x="14" y="145" width="28" height="2" fill="#fff" />
            <rect x="14" y="153" width="36" height="1.5" fill="#fff" opacity="0.7" />
            <rect x="14" y="160" width="32" height="1.5" fill="#fff" opacity="0.7" />
            <rect x="75" y="22" width="80" height="6" fill={config.accent} />
            <rect x="75" y="35" width="50" height="2" fill={config.accent} opacity="0.5" />
            <rect x="75" y="55" width="35" height="3" fill={config.accent} />
            <rect x="75" y="62" width="115" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="75" y="68" width="115" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="75" y="74" width="105" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="75" y="95" width="40" height="3" fill={config.accent} />
            <rect x="75" y="102" width="115" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="75" y="109" width="115" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="75" y="116" width="100" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="75" y="135" width="38" height="3" fill={config.accent} />
            <rect x="75" y="142" width="115" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="75" y="149" width="115" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="75" y="175" width="42" height="3" fill={config.accent} />
            <rect x="75" y="182" width="115" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="75" y="189" width="115" height="1.5" fill={config.accent} opacity="0.3" />
          </>
        )}
        {config.layout === 'classic' && (
          <>
            <rect x="60" y="22" width="80" height="6" fill={config.accent} />
            <rect x="65" y="34" width="70" height="2.5" fill={config.accent} opacity="0.6" />
            <rect x="40" y="44" width="120" height="1.5" fill={config.accent} opacity="0.4" />
            <line x1="90" y1="55" x2="110" y2="55" stroke={config.accent} strokeWidth="1" />
            <rect x="75" y="65" width="50" height="2.5" fill={config.accent} />
            <rect x="20" y="73" width="160" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="20" y="79" width="160" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="20" y="85" width="120" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="78" y="100" width="44" height="2.5" fill={config.accent} />
            <rect x="20" y="110" width="160" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="20" y="116" width="160" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="20" y="122" width="100" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="80" y="138" width="40" height="2.5" fill={config.accent} />
            <rect x="20" y="148" width="160" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="20" y="154" width="160" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="20" y="160" width="100" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="76" y="178" width="48" height="2.5" fill={config.accent} />
            <rect x="20" y="188" width="160" height="1.5" fill={config.accent} opacity="0.3" />
            <rect x="20" y="194" width="100" height="1.5" fill={config.accent} opacity="0.3" />
          </>
        )}
        {config.layout === 'header' && (
          <>
            <rect x="5" y="5" width="190" height="60" fill={config.side} rx="2" />
            <circle cx="35" cy="35" r="14" fill="#fff" opacity="0.95" />
            <rect x="55" y="22" width="80" height="5" fill="#fff" />
            <rect x="55" y="32" width="60" height="2" fill="#fff" opacity="0.7" />
            <rect x="55" y="42" width="100" height="1.5" fill="#fff" opacity="0.6" />
            <rect x="55" y="48" width="80" height="1.5" fill="#fff" opacity="0.6" />
            <circle cx="20" cy="82" r="2.5" fill={config.accent} />
            <rect x="28" y="80" width="60" height="2" fill={config.accent} />
            <rect x="28" y="86" width="100" height="1.5" fill={config.accent} opacity="0.4" />
            <rect x="28" y="92" width="100" height="1.5" fill={config.accent} opacity="0.4" />
            <line x1="20" y1="100" x2="20" y2="130" stroke={config.accent} strokeWidth="1" />
            <circle cx="20" cy="110" r="2.5" fill={config.accent} />
            <rect x="28" y="108" width="60" height="2" fill={config.accent} />
            <rect x="28" y="114" width="100" height="1.5" fill={config.accent} opacity="0.4" />
            <rect x="28" y="120" width="100" height="1.5" fill={config.accent} opacity="0.4" />
            <circle cx="20" cy="140" r="2.5" fill={config.accent} />
            <rect x="28" y="138" width="60" height="2" fill={config.accent} />
            <rect x="28" y="144" width="100" height="1.5" fill={config.accent} opacity="0.4" />
            <rect x="28" y="150" width="100" height="1.5" fill={config.accent} opacity="0.4" />
            <rect x="138" y="80" width="50" height="2.5" fill={config.accent} />
            <rect x="138" y="90" width="48" height="1.5" fill={config.accent} opacity="0.4" />
            <rect x="138" y="96" width="48" height="1.5" fill={config.accent} opacity="0.4" />
            <rect x="138" y="115" width="50" height="2.5" fill={config.accent} />
            <rect x="138" y="125" width="48" height="1.5" fill={config.accent} opacity="0.4" />
            <rect x="138" y="131" width="48" height="1.5" fill={config.accent} opacity="0.4" />
          </>
        )}
        {config.layout === 'minimal' && (
          <>
            <rect x="20" y="30" width="100" height="8" fill={config.accent} opacity="0.95" />
            <rect x="20" y="44" width="60" height="2" fill={config.accent} opacity="0.5" />
            <rect x="20" y="52" width="100" height="1.5" fill={config.accent} opacity="0.4" />
            <rect x="20" y="70" width="3" height="40" fill={config.accent} />
            <rect x="30" y="72" width="150" height="2" fill={config.accent} opacity="0.4" />
            <rect x="30" y="78" width="140" height="2" fill={config.accent} opacity="0.4" />
            <rect x="30" y="84" width="130" height="2" fill={config.accent} opacity="0.4" />
            <rect x="20" y="120" width="40" height="2" fill={config.accent} />
            <rect x="70" y="120" width="60" height="2" fill={config.accent} />
            <rect x="70" y="126" width="100" height="1.5" fill={config.accent} opacity="0.4" />
            <rect x="20" y="145" width="40" height="2" fill={config.accent} />
            <rect x="70" y="145" width="60" height="2" fill={config.accent} />
            <rect x="70" y="151" width="100" height="1.5" fill={config.accent} opacity="0.4" />
            <rect x="20" y="170" width="40" height="2" fill={config.accent} />
            <rect x="70" y="170" width="60" height="2" fill={config.accent} />
            <rect x="70" y="176" width="80" height="1.5" fill={config.accent} opacity="0.4" />
          </>
        )}
        {config.layout === 'tech' && (
          <>
            <rect x="20" y="20" width="30" height="2.5" fill={config.accent} />
            <rect x="20" y="32" width="90" height="6" fill={config.accent} />
            <rect x="20" y="44" width="70" height="2" fill="#8b949e" />
            <rect x="20" y="60" width="160" height="20" fill="rgba(255,255,255,0.04)" rx="2" stroke={config.accent} strokeWidth="0.5" />
            <rect x="25" y="65" width="40" height="1.5" fill="#8b949e" />
            <rect x="25" y="70" width="60" height="1.5" fill="#8b949e" />
            <rect x="25" y="75" width="50" height="1.5" fill="#8b949e" />
            <rect x="20" y="95" width="80" height="3" fill={config.accent} />
            <rect x="20" y="105" width="160" height="1.5" fill="#c9d1d9" opacity="0.5" />
            <rect x="20" y="111" width="160" height="1.5" fill="#c9d1d9" opacity="0.5" />
            <rect x="20" y="117" width="120" height="1.5" fill="#c9d1d9" opacity="0.5" />
            <rect x="20" y="130" width="100" height="3" fill={config.accent} />
            <rect x="20" y="140" width="160" height="1.5" fill="#c9d1d9" opacity="0.5" />
            <rect x="20" y="146" width="150" height="1.5" fill="#c9d1d9" opacity="0.5" />
            <rect x="20" y="152" width="140" height="1.5" fill="#c9d1d9" opacity="0.5" />
            <rect x="20" y="170" width="60" height="3" fill={config.accent} />
            <rect x="20" y="180" width="160" height="1.5" fill="#c9d1d9" opacity="0.5" />
            <rect x="20" y="186" width="100" height="1.5" fill="#c9d1d9" opacity="0.5" />
          </>
        )}
      </svg>
      <div className="mt-2 text-center">
        <div className="font-display text-sm font-semibold" style={{ color: 'var(--text)' }}>{name}</div>
        <div className="text-2xs font-mono mt-0.5" style={{ color: 'var(--accent)' }}>✓ Éditeur intégré · Gratuit</div>
      </div>
    </div>
  );
}

function PremiumButton({ template }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => { setIsLogged(userAuth.isLoggedIn()); }, []);

  const onClick = () => {
    if (!userAuth.isLoggedIn()) {
      router.push('/login?next=/cv-templates');
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button onClick={onClick} className="btn btn-gold py-2 px-3 text-xs flex-1">
        {isLogged ? (
          <>
            <Icon.Star size={12} /> Acheter {template.price}€
          </>
        ) : (
          <>
            <Icon.Lock size={12} /> {template.price}€ (compte requis)
          </>
        )}
      </button>
      {open && <PayPalModal template={template} onClose={() => setOpen(false)} />}
    </>
  );
}

function PayPalModal({ template, onClose }) {
  const [phase, setPhase] = useState('paying'); // paying | success | error
  const [resultData, setResultData] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const paypalRef = useState({ rendered: false })[0];

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setErrMsg('Paiement non configuré. Contactez le propriétaire.');
      setPhase('error');
      return;
    }
    const SDK_URL = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${template.currency || 'EUR'}&intent=capture&components=buttons`;
    const existing = document.querySelector(`script[data-paypal-sdk]`);
    if (existing) { renderButtons(); return; }
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.dataset.paypalSdk = '1';
    script.onload = renderButtons;
    script.onerror = () => {
      setErrMsg('Impossible de charger PayPal. Vérifiez votre connexion.');
      setPhase('error');
    };
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderButtons() {
    if (paypalRef.rendered || typeof window === 'undefined' || !window.paypal) return;
    paypalRef.rendered = true;
    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', height: 44 },
      createOrder: async () => {
        const res = await axios.post(
          `${API}/api/payments/create-order`,
          { template_slug: template.slug },
          { headers: userAuth.authHeaders() }
        );
        if (!res.data?.orderID) throw new Error('No orderID returned');
        return res.data.orderID;
      },
      onApprove: async (data) => {
        try {
          const res = await axios.post(
            `${API}/api/payments/capture-order`,
            { orderID: data.orderID },
            { headers: userAuth.authHeaders() }
          );
          if (res.data?.success) {
            setResultData(res.data);
            setPhase('success');
          } else {
            setErrMsg(res.data?.error || 'Le paiement n\'a pas pu être validé.');
            setPhase('error');
          }
        } catch (err) {
          setErrMsg(err.response?.data?.error || 'Erreur de validation du paiement.');
          setPhase('error');
        }
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        setErrMsg('Une erreur est survenue avec PayPal. Réessayez.');
        setPhase('error');
      },
    }).render('#paypal-buttons-container');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="surface max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl" style={{ color: 'var(--text)' }}>
            {phase === 'success' ? '🎉 Paiement confirmé !' : phase === 'error' ? 'Oups' : 'Acheter ce modèle'}
          </h3>
          <button onClick={onClose} className="lang-toggle"><Icon.Close size={16} /></button>
        </div>

        {phase === 'paying' && (
          <>
            <div className="rounded-lg overflow-hidden mb-4" style={{ background: 'var(--surface-2)' }}>
              {template.preview_url && <img src={template.preview_url} alt={template.name} className="w-full" />}
            </div>
            <div className="text-sm space-y-2 mb-4" style={{ color: 'var(--text-soft)' }}>
              <div className="flex justify-between items-baseline">
                <span><strong>{template.name}</strong></span>
                <span className="font-display text-2xl text-gold-grad">{template.price}€</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Paiement sécurisé via PayPal. Après validation, accès <strong>instantané</strong> au CV dans Canva.
              </p>
            </div>
            {!PAYPAL_CLIENT_ID ? (
              <div className="p-4 rounded-lg text-sm" style={{ background: 'var(--surface-2)', color: 'var(--coral)' }}>
                Paiement non configuré sur ce site.
              </div>
            ) : (
              <div id="paypal-buttons-container" className="min-h-[120px]" />
            )}
          </>
        )}

        {phase === 'success' && resultData && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(167, 195, 165, 0.2)', color: 'var(--sage)' }}>
              <Icon.Check size={32} />
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-soft)' }}>
              Merci {resultData.payer?.name || ''} !
            </p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-soft)' }}>
              Votre <strong>{resultData.template?.name}</strong> est prêt.
            </p>
            <a href={resultData.template?.edit_url} target="_blank" rel="noopener noreferrer" className="btn btn-gold w-full py-3 mb-2">
              ✏️ Ouvrir mon CV dans Canva
            </a>
            <Link href="/my-cvs" className="btn btn-ghost w-full py-2 text-xs mb-3">
              Voir tous mes CV →
            </Link>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              📧 Un email a aussi été envoyé à <strong>{resultData.payer?.email}</strong>.<br/>
              Vous pouvez revenir à tout moment sur <strong>/my-cvs</strong> pour retrouver le lien.
            </p>
          </div>
        )}

        {phase === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(228, 124, 105, 0.15)', color: 'var(--coral)' }}>
              <Icon.Close size={32} />
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-soft)' }}>
              {errMsg || 'Le paiement n\'a pas abouti. Aucun montant n\'a été débité.'}
            </p>
            <button onClick={onClose} className="btn btn-ghost py-2.5 px-5 text-sm">Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}
