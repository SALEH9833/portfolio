import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import toast from 'react-hot-toast';
import Icon from '../../components/Icons';

export default function AdminLogin() {
  const router = useRouter();
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/login`, creds);
      localStorage.setItem('admin_token', res.data.token);
      toast.success(`Bienvenue ${res.data.user.username}`);
      router.push('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Échec de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Admin · Connexion</title></Head>
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent-dark)] items-center justify-center text-[var(--bg)] font-display font-bold text-xl mb-4">S</div>
            <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--text)' }}>Espace administrateur</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Connectez-vous pour gérer le portfolio</p>
          </div>

          <form onSubmit={submit} className="surface p-7 space-y-5">
            <div>
              <label htmlFor="username" className="block text-2xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Nom d'utilisateur
              </label>
              <input
                id="username"
                value={creds.username}
                onChange={(e) => setCreds({ ...creds, username: e.target.value })}
                className="field"
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-2xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={creds.password}
                onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                className="field"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-gold w-full justify-center disabled:opacity-50">
              {loading ? <><div className="spinner" /> Connexion…</> : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-xs mt-6 font-mono" style={{ color: 'var(--text-faint)' }}>
            🔒 Accès protégé · JWT 7 jours
          </p>
        </div>
      </main>
    </>
  );
}
