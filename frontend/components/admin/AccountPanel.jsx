import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Section, TextField } from './AdminUI';
import Icon from '../Icons';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

export default function AccountPanel() {
  const [me, setMe]             = useState(null);
  const [loading, setLoading]   = useState(true);

  // Info form
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Password form
  const [currentPassword, setCurrent] = useState('');
  const [newPassword,     setNewPwd]  = useState('');
  const [confirmPwd,      setConfirm] = useState('');
  const [showPwd,         setShowPwd] = useState(false);
  const [savingPwd,       setSavingPwd] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/admin/me`, { headers: headers() })
      .then(r => {
        setMe(r.data.user);
        setUsername(r.data.user?.username || '');
        setEmail(r.data.user?.email || '');
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  const saveInfo = async (e) => {
    e.preventDefault();
    if (!username.trim() || username.trim().length < 3) return toast.error('Username trop court');
    setSavingInfo(true);
    try {
      const res = await axios.put(`${API}/api/admin/me`, { username: username.trim(), email: email.trim() }, { headers: headers() });
      setMe(res.data.user);
      toast.success(res.data.message || 'Informations mises à jour ✓');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de mise à jour');
    } finally {
      setSavingInfo(false);
    }
  };

  const savePwd = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return toast.error('Tous les champs sont requis');
    if (newPassword.length < 8) return toast.error('Le nouveau mot de passe doit faire au moins 8 caractères');
    if (newPassword !== confirmPwd) return toast.error('Les nouveaux mots de passe ne correspondent pas');
    if (newPassword === currentPassword) return toast.error('Le nouveau mot de passe doit être différent');

    setSavingPwd(true);
    try {
      const res = await axios.put(`${API}/api/admin/me/password`, { currentPassword, newPassword }, { headers: headers() });
      toast.success(res.data.message || 'Mot de passe changé ✓');
      setCurrent(''); setNewPwd(''); setConfirm('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de changement de mot de passe');
    } finally {
      setSavingPwd(false);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><div className="spinner" /></div>;
  if (!me) return <div className="text-center py-10" style={{ color: 'var(--coral)' }}>Impossible de charger le compte</div>;

  const inputStyle = { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' };

  return (
    <div className="space-y-6">
      {/* Identifiant + Email */}
      <Section title="Mes informations" >
        <form onSubmit={saveInfo} className="space-y-4">
          <TextField label="Nom d'utilisateur" value={username} onChange={setUsername} required placeholder="admin" />
          <TextField label="Email (optionnel, pour récupération)" type="email" value={email} onChange={setEmail} placeholder="ton@email.com" />
          <button
            type="submit"
            disabled={savingInfo}
            className="btn btn-gold py-2 px-4 text-xs"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {savingInfo ? <><div className="spinner" /> Sauvegarde...</> : <><Icon.Check size={14} /> Mettre à jour mes infos</>}
          </button>
        </form>
      </Section>

      {/* Mot de passe */}
      <Section title="Changer le mot de passe">
        <form onSubmit={savePwd} className="space-y-4">
          <div>
            <div className="text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Mot de passe actuel <span style={{ color: 'var(--coral)' }}>*</span>
            </div>
            <input
              type={showPwd ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg"
              style={inputStyle}
              required
              autoComplete="current-password"
            />
          </div>

          <div>
            <div className="text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Nouveau mot de passe <span style={{ color: 'var(--coral)' }}>*</span>
            </div>
            <input
              type={showPwd ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPwd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg"
              style={inputStyle}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <div className="text-2xs mt-1" style={{ color: 'var(--text-faint)' }}>Au moins 8 caractères</div>
          </div>

          <div>
            <div className="text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Confirmer le nouveau mot de passe <span style={{ color: 'var(--coral)' }}>*</span>
            </div>
            <input
              type={showPwd ? 'text' : 'password'}
              value={confirmPwd}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg"
              style={inputStyle}
              required
              autoComplete="new-password"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={showPwd} onChange={(e) => setShowPwd(e.target.checked)} />
            Afficher les mots de passe
          </label>

          <button
            type="submit"
            disabled={savingPwd || !currentPassword || !newPassword || !confirmPwd}
            className="btn btn-gold py-2 px-4 text-xs"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {savingPwd ? <><div className="spinner" /> Changement...</> : <><Icon.Check size={14} /> Changer mon mot de passe</>}
          </button>
        </form>

        <div className="mt-5 p-3 rounded-lg text-xs leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          🔒 Ton mot de passe est chiffré avec bcrypt (coût 12). Il n'est jamais stocké en clair, même par nous.
        </div>
      </Section>
    </div>
  );
}
