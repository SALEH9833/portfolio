import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Icon from '../components/Icons';
import { userAuth } from '../lib/user-auth';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function VerifyEmail() {
  const router = useRouter();
  const [phase, setPhase]       = useState('loading'); // loading | success | expired | error
  const [message, setMessage]   = useState('');
  const [email, setEmail]       = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const { token } = router.query;
    if (!token) {
      setPhase('error');
      setMessage('Aucun jeton de vérification fourni.');
      return;
    }

    axios.post(`${API}/api/auth/verify-email`, { token })
      .then((res) => {
        // Auto-login
        userAuth.setSession(res.data.token, res.data.user);
        setPhase('success');
        setMessage(res.data.already_verified
          ? 'Cet email était déjà vérifié. Vous êtes maintenant connecté.'
          : 'Votre email a été vérifié avec succès. Vous êtes maintenant connecté.');
        // Redirect after 2.5s
        setTimeout(() => router.replace('/my-cvs'), 2500);
      })
      .catch((err) => {
        const data = err.response?.data;
        if (data?.expired) {
          setPhase('expired');
          setMessage(data.error);
          setEmail(data.email || '');
        } else {
          setPhase('error');
          setMessage(data?.error || 'Une erreur est survenue. Réessayez ou demandez un nouveau lien.');
        }
      });
  }, [router.isReady, router.query, router]);

  const resend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      const res = await axios.post(`${API}/api/auth/resend-verification`, { email });
      if (res.data?.email_sent) {
        setMessage(`Un nouveau lien a été envoyé à ${email}. Vérifiez votre boîte mail.`);
      } else {
        setMessage(res.data?.message || 'Demande envoyée.');
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erreur lors du renvoi.');
    } finally {
      setResending(false);
    }
  };

  const cfg = {
    loading: { icon: null,           color: 'var(--accent)', title: 'Vérification en cours...' },
    success: { icon: 'Check',        color: 'var(--sage)',   title: 'Email vérifié !' },
    expired: { icon: 'Clock',        color: 'var(--coral)',  title: 'Lien expiré' },
    error:   { icon: 'Alert',        color: 'var(--coral)',  title: 'Erreur de vérification' },
  }[phase];

  const IconC = cfg.icon ? Icon[cfg.icon] : null;

  return (
    <>
      <Head>
        <title>Vérification email · Saleh Portfolio</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem]"
            style={{ background: 'radial-gradient(circle, var(--hero-glow-1), transparent 60%)' }} />
        </div>

        <div className="relative w-full max-w-md">
          <div className="surface p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full mb-5 flex items-center justify-center"
              style={{ background: `${cfg.color}20`, color: cfg.color }}>
              {phase === 'loading' ? (
                <div className="spinner" />
              ) : IconC ? (
                <IconC size={32} />
              ) : null}
            </div>

            <h1 className="font-display text-2xl mb-3" style={{ color: 'var(--text)' }}>
              {cfg.title}
            </h1>

            {message && (
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-soft)' }}>
                {message}
              </p>
            )}

            {phase === 'success' && (
              <p className="text-2xs font-mono" style={{ color: 'var(--text-muted)' }}>
                Redirection vers votre espace en cours...
              </p>
            )}

            {phase === 'expired' && email && (
              <button
                onClick={resend}
                disabled={resending}
                className="btn btn-gold w-full py-3 text-sm mb-3"
              >
                {resending ? <div className="spinner" /> : 'Renvoyer un nouveau lien'}
              </button>
            )}

            {(phase === 'error' || phase === 'expired') && (
              <Link href="/login" className="btn btn-ghost w-full py-2.5 text-sm">
                Retour à la connexion
              </Link>
            )}
          </div>

          <p className="text-2xs text-center mt-4 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
            <Icon.Lock size={12} />
            Vérification sécurisée — jeton à usage unique
          </p>
        </div>
      </main>
    </>
  );
}
