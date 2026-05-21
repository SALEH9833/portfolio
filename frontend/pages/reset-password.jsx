import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import Icon from '../components/Icons';
import { userAuth } from '../lib/user-auth';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [phase, setPhase] = useState('form'); // form | success | error
  const [errMsg, setErrMsg] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm,     setConf] = useState('');
  const [showPwd,     setShow] = useState(false);
  const [loading,     setLoading] = useState(false);

  useEffect(() => {
    if (router.isReady && !token) {
      setPhase('error');
      setErrMsg('Lien invalide. Demande un nouveau lien.');
    }
  }, [router.isReady, token]);

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Au moins 6 caractères');
    if (newPassword !== confirm) return toast.error('Les mots de passe ne correspondent pas');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/reset-password`, { token, newPassword });
      userAuth.setSession(res.data.token, res.data.user);
      setPhase('success');
      toast.success('Mot de passe réinitialisé');
      setTimeout(() => router.push('/my-cvs'), 1500);
    } catch (err) {
      setErrMsg(err.response?.data?.error || 'Erreur. Réessayez.');
      setPhase('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Nouveau mot de passe - Portfolio Saleh</title></Head>
      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-md">
          <div className="surface p-6 lg:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center font-display font-bold text-lg" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: 'var(--bg)' }}>S</div>
              <h1 className="font-display text-2xl mb-2" style={{ color: 'var(--text)' }}>
                {phase === 'success' ? 'Mot de passe changé' : phase === 'error' ? 'Erreur' : 'Nouveau mot de passe'}
              </h1>
            </div>

            {phase === 'form' && (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <div className="text-2xs font-mono uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Nouveau mot de passe *</div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNew(e.target.value)}
                    required
                    autoFocus
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-3 py-2.5 rounded-lg"
                    style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                  <div className="text-2xs mt-1" style={{ color: 'var(--text-faint)' }}>Au moins 6 caractères</div>
                </div>
                <div>
                  <div className="text-2xs font-mono uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Confirmer *</div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConf(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full px-3 py-2.5 rounded-lg"
                    style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: 'var(--text-muted)' }}>
                  <input type="checkbox" checked={showPwd} onChange={(e) => setShow(e.target.checked)} />
                  Afficher les mots de passe
                </label>
                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirm}
                  className="btn btn-gold w-full py-3 text-sm"
                >
                  {loading ? 'Réinitialisation...' : 'Réinitialiser mon mot de passe'}
                </button>
              </form>
            )}

            {phase === 'success' && (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(167,195,165,0.2)' }}>
                  <Icon.Check size={32} style={{ color: 'var(--sage)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                  Tu es maintenant connecté. Redirection en cours...
                </p>
              </div>
            )}

            {phase === 'error' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(255,127,80,0.2)' }}>
                  <Icon.Alert size={32} style={{ color: 'var(--coral)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-soft)' }}>{errMsg}</p>
                <Link href="/forgot-password" className="btn btn-gold w-full py-3 text-sm">
                  Demander un nouveau lien
                </Link>
                <Link href="/login" className="text-xs" style={{ color: 'var(--text-muted)' }}>
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
