import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Icon from '../components/Icons';
import ThemeToggle from '../components/ThemeToggle';
import { userAuth } from '../lib/user-auth';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function MyCVs() {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!userAuth.isLoggedIn()) {
      router.replace('/login?next=/my-cvs');
      return;
    }
    setUser(userAuth.getUser());

    Promise.all([
      axios.get(`${API}/api/auth/me`,           { headers: userAuth.authHeaders() }),
      axios.get(`${API}/api/auth/my-purchases`, { headers: userAuth.authHeaders() }),
    ])
      .then(([meRes, purRes]) => {
        setUser(meRes.data.user);
        setPurchases(purRes.data.data || []);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          userAuth.clear();
          router.replace('/login');
        } else {
          toast.error('Erreur de chargement');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const logout = () => {
    userAuth.clear();
    toast.success('Déconnecté');
    router.push('/cv-templates');
  };

  return (
    <>
      <Head>
        <title>Mes CV · Espace personnel</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 92%, transparent)' }}>
          <div className="max-w-6xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
            <Link href="/cv-templates" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: 'var(--bg)' }}>S</div>
              <div className="hidden sm:block">
                <div className="font-display text-sm" style={{ color: 'var(--text)' }}>Mes CV</div>
                <div className="text-2xs font-mono" style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/cv-templates" className="btn btn-ghost py-1.5 px-3 text-xs">
                <span className="hidden sm:inline">Plus de modèles</span>
                <span className="sm:hidden">Galerie</span>
              </Link>
              <button onClick={logout} className="btn btn-ghost py-1.5 px-3 text-xs" style={{ color: 'var(--coral)' }}>
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
          {loading ? (
            <div className="flex justify-center py-20"><div className="spinner" /></div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="font-display text-3xl lg:text-4xl mb-2" style={{ color: 'var(--text)' }}>
                  Bonjour {user?.name || user?.email?.split('@')[0]} 👋
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                  {purchases.length === 0
                    ? "Vous n'avez pas encore acheté de modèle. Découvrez la galerie pour commencer."
                    : `Vous avez accès à ${purchases.length} modèle${purchases.length > 1 ? 's' : ''} CV. Cliquez pour éditer dans Canva.`}
                </p>
              </div>

              {purchases.length === 0 ? (
                <div className="surface p-10 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full mb-4 flex items-center justify-center" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                    <Icon.Code size={28} />
                  </div>
                  <h2 className="font-display text-xl mb-2" style={{ color: 'var(--text)' }}>Aucun modèle pour l'instant</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                    Parcourez nos {24} modèles dans la galerie. Vous pouvez aussi essayer l'éditeur gratuit.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/cv-templates" className="btn btn-gold py-2.5 px-5 text-sm">
                      ✨ Voir la galerie
                    </Link>
                    <Link href="/cv-builder" className="btn btn-ghost py-2.5 px-5 text-sm">
                      Éditeur gratuit
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {purchases.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="surface overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                        {p.preview_url ? (
                          <img src={p.preview_url} alt={p.template_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon.Code size={32} style={{ color: 'var(--accent)' }} />
                          </div>
                        )}
                        <div className="absolute top-2.5 start-2.5">
                          <span className="text-2xs font-mono uppercase px-2 py-1 rounded-full flex items-center gap-1"
                            style={{ background: 'rgba(167, 195, 165, 0.95)', color: '#1a1a1a', fontWeight: 600 }}>
                            <Icon.Check size={10} /> Acheté
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-display text-base mb-1" style={{ color: 'var(--text)' }}>{p.template_name}</h3>
                        <div className="text-2xs font-mono mb-3" style={{ color: 'var(--text-muted)' }}>
                          Acheté le {new Date(p.delivered_at || p.created_at).toLocaleDateString('fr-FR')} · {Number(p.amount).toFixed(2)} {p.currency}
                        </div>
                        {p.canva_edit_url ? (
                          <a href={p.canva_edit_url} target="_blank" rel="noopener noreferrer" className="btn btn-gold w-full py-2 text-xs mt-auto">
                            ✏️ Éditer dans Canva
                          </a>
                        ) : (
                          <div className="text-xs text-center py-2" style={{ color: 'var(--coral)' }}>
                            Lien indisponible — contactez le support
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
