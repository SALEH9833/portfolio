import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/Icons';
import ThemeToggle from '../../components/ThemeToggle';
import ProfileEditor from '../../components/admin/ProfileEditor';
import EntityManager from '../../components/admin/EntityManager';
import SalesPanel    from '../../components/admin/SalesPanel';
import MediaPanel    from '../../components/admin/MediaPanel';
import DeliveryPanel from '../../components/admin/DeliveryPanel';
import AccountPanel  from '../../components/admin/AccountPanel';
import { Section } from '../../components/admin/AdminUI';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

const NAV = [
  { id: 'overview',         label: 'Vue d\'ensemble', icon: 'Layers' },
  { id: 'profile',          label: 'Profil',           icon: 'Users' },
  { id: 'languages',        label: 'Langues',          icon: 'Globe' },
  { id: 'strengths',        label: 'Atouts',           icon: 'Sparkles' },
  { id: 'projects',         label: 'Projets',          icon: 'Code' },
  { id: 'skill_categories', label: 'Catég. Compétences', icon: 'Database' },
  { id: 'skills',           label: 'Compétences',       icon: 'Tool' },
  { id: 'tech_stack',       label: 'Tech Stack',       icon: 'Layers' },
  { id: 'certifications',   label: 'Certifications',   icon: 'Award' },
  { id: 'experience',       label: 'Expérience',       icon: 'Briefcase' },
  { id: 'education',        label: 'Formation',        icon: 'GraduationCap' },
  { id: 'activities',       label: 'Activités',        icon: 'Music' },
  { id: 'cv_templates',     label: 'Modèles CV',       icon: 'Award' },
  { id: 'testimonials',     label: 'Témoignages',      icon: 'Heart' },
  { id: 'media',            label: 'Médias / Photos',  icon: 'Eye' },
  { id: 'delivery',         label: 'Livraison CV',     icon: 'Send' },
  { id: 'sales',            label: 'Ventes',           icon: 'Sparkles' },
  { id: 'messages',         label: 'Messages',         icon: 'Mail',     badge: 'unread' },
  { id: 'account',          label: 'Mon compte',       icon: 'Users' },
];

function MessagesPanel() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/admin/messages`, { headers: headers() })
      .then(r => setList(r.data.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markRead = async (id) => {
    await axios.patch(`${API}/api/admin/messages/${id}/read`, {}, { headers: headers() });
    setList(l => l.map(m => m.id === id ? { ...m, is_read: true } : m));
  };
  const del = async (id) => {
    if (!confirm('Supprimer ce message ?')) return;
    await axios.delete(`${API}/api/admin/messages/${id}`, { headers: headers() });
    setList(l => l.filter(m => m.id !== id));
    toast.success('Supprimé');
  };

  if (loading) return <div className="flex justify-center py-10"><div className="spinner" /></div>;

  return (
    <Section title={`Messages reçus (${list.length})`}>
      {list.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Aucun message reçu pour le moment.</div>
      ) : (
        <div className="space-y-3">
          {list.map(m => (
            <details
              key={m.id}
              className={`rounded-lg overflow-hidden ${!m.is_read ? 'border-l-4' : ''}`}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderLeftColor: !m.is_read ? 'var(--accent)' : undefined,
                borderLeftWidth: !m.is_read ? '4px' : undefined,
              }}
            >
              <summary className="cursor-pointer p-4 flex items-center justify-between gap-3 list-none">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!m.is_read && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />}
                    <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{m.name}</span>
                    <a href={`mailto:${m.email}`} className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{m.email}</a>
                  </div>
                  <div className="text-sm truncate" style={{ color: 'var(--text-soft)' }}>{m.subject}</div>
                  <div className="text-2xs font-mono mt-1" style={{ color: 'var(--text-faint)' }}>{new Date(m.created_at).toLocaleString('fr-FR')}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {!m.is_read && (
                    <button onClick={(e) => { e.preventDefault(); markRead(m.id); }} className="lang-toggle" aria-label="Marquer lu">
                      <Icon.Check size={14} />
                    </button>
                  )}
                  <button onClick={(e) => { e.preventDefault(); del(m.id); }} className="lang-toggle" style={{ color: 'var(--coral)' }} aria-label="Supprimer">
                    <Icon.Close size={14} />
                  </button>
                </div>
              </summary>
              <div className="px-4 pb-4 text-sm whitespace-pre-wrap leading-relaxed border-t pt-3 mt-1" style={{ borderColor: 'var(--border)', color: 'var(--text-soft)' }}>
                {m.message}
              </div>
            </details>
          ))}
        </div>
      )}
    </Section>
  );
}

function OverviewPanel({ stats }) {
  if (!stats) return <div className="flex justify-center py-10"><div className="spinner" /></div>;

  const cards = [
    { label: 'Inscrits',       value: stats.users ?? 0,          icon: 'Users',      color: 'var(--accent)' },
    { label: 'Vérifiés',       value: stats.users_verified ?? 0, icon: 'Check',      color: 'var(--sage)' },
    { label: 'Ventes CV',      value: stats.sales ?? 0,          icon: 'ShoppingCart', color: 'var(--accent-light)' },
    { label: 'Témoignages',    value: stats.testimonials ?? 0,   icon: 'Heart',      color: 'var(--coral)' },
    { label: 'Projets',        value: stats.projects,            icon: 'Code',       color: 'var(--accent)' },
    { label: 'Compétences',    value: stats.skills,              icon: 'Tool',       color: 'var(--sage)' },
    { label: 'Expériences',    value: stats.experience,          icon: 'Briefcase',  color: 'var(--accent-light)' },
    { label: 'Messages',       value: stats.messages,            icon: 'Mail',       color: 'var(--accent-dark)' },
    { label: 'Msg non lus',    value: stats.unread,              icon: 'Sparkles',   color: 'var(--coral)' },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {cards.map(c => {
          const IconC = Icon[c.icon];
          return (
            <div key={c.label} className="surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${c.color}15`, color: c.color }}>
                  <IconC size={16} />
                </div>
              </div>
              <div className="stat-number text-gold-grad">{c.value}</div>
              <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>{c.label}</div>
            </div>
          );
        })}
      </div>

      <Section title="Bienvenue dans votre espace admin">
        <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
          <p>👋 D'ici, vous pouvez gérer <strong style={{ color: 'var(--accent)' }}>tout le contenu</strong> de votre portfolio sans toucher au code.</p>

          <div className="grid md:grid-cols-2 gap-4 my-5">
            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="font-semibold mb-2" style={{ color: 'var(--text)' }}>📝 Modifier le contenu existant</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Utilisez la barre latérale pour naviguer entre les sections : Profil, Projets, Compétences, etc. Cliquez sur l'icône <code style={{ color: 'var(--accent)' }}>{'<>'}</code> pour modifier un élément.</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="font-semibold mb-2" style={{ color: 'var(--text)' }}>➕ Ajouter de nouveaux éléments</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sur chaque section, cliquez sur <strong style={{ color: 'var(--accent)' }}>+ Ajouter</strong>. La base de données se met à jour instantanément.</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="font-semibold mb-2" style={{ color: 'var(--text)' }}>🌐 Contenu multilingue</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Les champs avec des onglets <strong style={{ color: 'var(--accent)' }}>🇫🇷 🇬🇧 🇸🇦</strong> permettent de saisir le contenu dans les 3 langues. L'arabe est en RTL automatiquement.</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="font-semibold mb-2" style={{ color: 'var(--text)' }}>🔢 Ordre d'affichage</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Le champ <code style={{ color: 'var(--accent)' }}>display_order</code> détermine l'ordre. Plus le nombre est petit, plus l'élément apparaît en premier.</p>
            </div>
          </div>

          <p>⚡ <strong style={{ color: 'var(--text)' }}>Toutes les modifications sont sauvegardées en BDD PostgreSQL en temps réel.</strong> Rafraîchissez la page publique pour voir les changements.</p>
        </div>
      </Section>
    </>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser]       = useState(null);
  const [stats, setStats]     = useState(null);
  const [tab, setTab]         = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.replace('/admin/login'); return; }

    (async () => {
      try {
        const [me, st] = await Promise.all([
          axios.get(`${API}/api/admin/me`,    { headers: headers() }),
          axios.get(`${API}/api/admin/stats`, { headers: headers() }),
        ]);
        setUser(me.data.user);
        setStats(st.data.data);
      } catch {
        localStorage.removeItem('admin_token');
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const refreshStats = () =>
    axios.get(`${API}/api/admin/stats`, { headers: headers() }).then(r => setStats(r.data.data));

  const logout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Déconnecté');
    router.push('/admin/login');
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><div className="spinner" /></main>;

  const renderTab = () => {
    if (tab === 'overview') return <OverviewPanel stats={stats} />;
    if (tab === 'profile')  return <ProfileEditor />;
    if (tab === 'messages') return <MessagesPanel />;
    if (tab === 'sales')    return <SalesPanel />;
    if (tab === 'media')    return <MediaPanel />;
    if (tab === 'delivery') return <DeliveryPanel />;
    if (tab === 'account')  return <AccountPanel />;
    return <EntityManager table={tab} key={tab} />;
  };

  return (
    <>
      <Head><title>Admin · {NAV.find(n => n.id === tab)?.label || 'Dashboard'}</title></Head>
      <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <header className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 92%, transparent)' }}>
          <div className="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSideOpen(!sideOpen)} className="lg:hidden lang-toggle">
                <Icon.Menu size={18} />
              </button>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: 'var(--bg)' }}>S</div>
              <div className="hidden sm:block">
                <div className="font-display text-sm" style={{ color: 'var(--text)' }}>Admin Portfolio</div>
                <div className="text-2xs font-mono" style={{ color: 'var(--text-muted)' }}>{user?.username}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost py-1.5 px-3 text-xs">
                <Icon.Eye size={12} /> <span className="hidden sm:inline">Voir le site</span>
              </a>
              <button onClick={logout} className="btn btn-ghost py-1.5 px-3 text-xs" style={{ color: 'var(--coral)' }}>
                <Icon.Close size={12} /> <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 grid lg:grid-cols-[220px_1fr] gap-6">

          {/* Sidebar */}
          <AnimatePresence>
            {(sideOpen || true) && (
              <aside className={`${sideOpen ? 'fixed inset-0 z-40 p-4 lg:p-0 lg:static' : 'hidden lg:block'} lg:sticky lg:top-20 lg:self-start`} style={sideOpen ? { background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' } : {}} onClick={() => sideOpen && setSideOpen(false)}>
                <nav onClick={(e) => e.stopPropagation()} className="surface p-3 space-y-0.5 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto" style={sideOpen ? { maxWidth: '280px', margin: '4rem auto 0' } : {}}>
                  {NAV.map(item => {
                    const IconC = Icon[item.icon];
                    const isActive = tab === item.id;
                    const badgeValue = item.badge === 'unread' ? stats?.unread : null;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setTab(item.id); setSideOpen(false); refreshStats(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-start"
                        style={{
                          background:  isActive ? 'var(--accent-glow)' : 'transparent',
                          color:       isActive ? 'var(--accent)' : 'var(--text-muted)',
                          fontWeight:  isActive ? 600 : 400,
                        }}
                      >
                        <IconC size={15} />
                        <span className="flex-1">{item.label}</span>
                        {badgeValue > 0 && (
                          <span className="text-2xs px-1.5 rounded-full font-mono" style={{ background: 'var(--coral)', color: 'white' }}>{badgeValue}</span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </aside>
            )}
          </AnimatePresence>

          {/* Content */}
          <div>
            {renderTab()}
          </div>
        </div>
      </main>
    </>
  );
}
