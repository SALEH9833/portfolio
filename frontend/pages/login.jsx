import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import Icon from '../components/Icons';
import { userAuth } from '../lib/user-auth';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Login() {
  const router = useRouter();
  const [mode, setMode]         = useState('signin'); // signin | signup
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);

  // Special states for unverified flows
  const [phase, setPhase]       = useState('form'); // form | signup_sent | needs_verify
  const [pendingEmail, setPendingEmail] = useState('');
  const [resending, setResending]       = useState(false);

  useEffect(() => {
    if (userAuth.isLoggedIn()) {
      router.replace((router.query.next) || '/my-cvs');
    }
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === 'signin') {
        const res = await axios.post(`${API}/api/auth/login`, { email, password });
        userAuth.setSession(res.data.token, res.data.user);
        toast.success('Bienvenue !');
        router.replace(router.query.next || '/my-cvs');
      } else {
        const res = await axios.post(`${API}/api/auth/signup`, { email, password, name });
        // Signup never auto-logs-in anymore — show "email sent" state
        setPendingEmail(email);
        setPhase('signup_sent');
        if (!res.data?.email_sent) {
          toast.error("Compte créé mais l'email n'a pas pu être envoyé. Contactez le support.");
        }
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.email_unverified) {
        setPendingEmail(data.email || email);
        setPhase('needs_verify');
        toast.error(data.error);
      } else {
        toast.error(data?.error || 'Erreur. Vérifiez vos informations.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    if (!pendingEmail || resending) return;
    setResending(true);
    try {
      const res = await axios.post(`${API}/api/auth/resend-verification`, { email: pendingEmail });
      toast.success(res.data?.email_sent ? `Nouveau lien envoyé à ${pendingEmail}` : (res.data?.message || 'Demande envoyée'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du renvoi');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Head>
        <title>{mode === 'signin' ? 'Connexion' : 'Créer un compte'} · Modèles CV</title>
        <meta name="description" content="Connectez-vous pour acheter et accéder à vos modèles de CV premium." />
      </Head>

      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem]"
            style={{ background: 'radial-gradient(circle, var(--hero-glow-1), transparent 60%)' }} />
        </div>

        <div className="relative w-full max-w-md">
          <Link href="/cv-templates" className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
            ← Retour aux modèles CV
          </Link>

          <div className="surface p-7 lg:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto rounded-xl mb-3 flex items-center justify-center font-display font-bold text-xl"
                style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: 'var(--bg)' }}>
                S
              </div>
              <h1 className="font-display text-2xl" style={{ color: 'var(--text)' }}>
                {phase === 'signup_sent' ? 'Vérifiez votre email'
                  : phase === 'needs_verify' ? 'Email non vérifié'
                  : mode === 'signin' ? 'Connexion'
                  : 'Créer un compte'}
              </h1>
              <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
                {phase === 'signup_sent' || phase === 'needs_verify' ? '' : (mode === 'signin'
                  ? 'Accédez à vos modèles CV achetés'
                  : 'Pour acheter et gérer vos modèles CV premium')}
              </p>
            </div>

            {/* ===== EMAIL SENT STATE ===== */}
            {phase === 'signup_sent' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(167, 195, 165, 0.2)', color: 'var(--sage)' }}>
                  <Icon.Mail size={32} />
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-soft)' }}>
                  Nous avons envoyé un lien de confirmation à <strong style={{ color: 'var(--text)' }}>{pendingEmail}</strong>.
                </p>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-soft)' }}>
                  Cliquez sur le lien dans l'email pour activer votre compte et vous connecter automatiquement.
                </p>
                <div className="p-3 rounded-lg text-2xs leading-relaxed mb-5" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  Le lien expire dans <strong>24 heures</strong>. Pensez à vérifier votre dossier <strong>Spam / Indésirables</strong>.
                </div>
                <button onClick={resendEmail} disabled={resending} className="btn btn-ghost w-full py-2.5 text-sm mb-2">
                  {resending ? <div className="spinner" /> : 'Renvoyer l\'email'}
                </button>
                <button onClick={() => { setPhase('form'); setMode('signin'); }} className="text-xs" style={{ color: 'var(--accent)' }}>
                  Retour à la connexion
                </button>
              </div>
            )}

            {/* ===== NEEDS VERIFICATION (login failed) ===== */}
            {phase === 'needs_verify' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(228, 124, 105, 0.15)', color: 'var(--coral)' }}>
                  <Icon.Alert size={32} />
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-soft)' }}>
                  Votre compte <strong style={{ color: 'var(--text)' }}>{pendingEmail}</strong> existe mais l'email n'a pas encore été vérifié.
                </p>
                <button onClick={resendEmail} disabled={resending} className="btn btn-gold w-full py-3 text-sm mb-2">
                  {resending ? <div className="spinner" /> : 'Renvoyer le lien de vérification'}
                </button>
                <button onClick={() => setPhase('form')} className="text-xs" style={{ color: 'var(--accent)' }}>
                  Retour
                </button>
              </div>
            )}

            {/* ===== NORMAL FORM ===== */}
            {phase === 'form' && (
              <>
                <form onSubmit={submit} className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        Nom complet (optionnel)
                      </label>
                      <input
                        type="text"
                        className="field"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Marie Dupont"
                        maxLength={120}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Email <span style={{ color: 'var(--accent)' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className="field"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Mot de passe <span style={{ color: 'var(--accent)' }}>*</span>
                    </label>
                    <input
                      type="password"
                      className="field"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Au moins 6 caractères' : 'Votre mot de passe'}
                      minLength={6}
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-gold w-full py-3 text-sm">
                    {loading ? <div className="spinner" /> : (mode === 'signin' ? 'Se connecter' : 'Créer mon compte')}
                  </button>
                </form>

                {mode === 'signup' && (
                  <div className="text-2xs leading-relaxed mt-4 p-3 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    <Icon.Mail size={12} className="inline" /> Vous recevrez un email pour confirmer votre adresse avant d'accéder à votre compte.
                  </div>
                )}

                <div className="text-center mt-5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
                  {mode === 'signin' ? (
                    <button onClick={() => setMode('signup')} className="text-sm" style={{ color: 'var(--accent)' }}>
                      Pas encore de compte ? <strong>Créer un compte</strong>
                    </button>
                  ) : (
                    <button onClick={() => setMode('signin')} className="text-sm" style={{ color: 'var(--accent)' }}>
                      Déjà un compte ? <strong>Se connecter</strong>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="text-2xs text-center mt-4 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
            <Icon.Lock size={12} />
            Vos données sont sécurisées (mot de passe chiffré bcrypt)
          </p>
        </div>
      </main>
    </>
  );
}
