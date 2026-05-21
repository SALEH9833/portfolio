import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import Icon from '../components/Icons';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ForgotPassword() {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Mot de passe oublié - Portfolio Saleh</title></Head>
      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-md">
          <Link href="/login" className="text-xs font-mono mb-4 inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            ← Retour à la connexion
          </Link>

          <div className="surface p-6 lg:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center font-display font-bold text-lg" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: 'var(--bg)' }}>S</div>
              <h1 className="font-display text-2xl mb-2" style={{ color: 'var(--text)' }}>
                {sent ? 'Email envoyé' : 'Mot de passe oublié'}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {sent
                  ? 'Si un compte existe avec cet email, tu vas recevoir un lien de réinitialisation.'
                  : 'Entre ton email pour recevoir un lien de réinitialisation.'}
              </p>
            </div>

            {!sent ? (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <div className="text-2xs font-mono uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Email *</div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="ton@email.com"
                    className="w-full px-3 py-2.5 rounded-lg"
                    style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="btn btn-gold w-full py-3 text-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {loading ? <><div className="spinner" /> Envoi...</> : <><Icon.Mail size={14} /> Envoyer le lien</>}
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'var(--accent-glow)' }}>
                  <Icon.Mail size={28} style={{ color: 'var(--accent)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                  Vérifie ta boîte mail (et le dossier spam au cas où).
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Le lien expire dans <strong>1 heure</strong>.
                </p>
                <Link href="/login" className="btn btn-gold w-full py-3 text-sm">
                  Retour à la connexion
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
