import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TextField, I18nField, Section } from './AdminUI';
import Icon from '../Icons';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

function PhotoUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useState(null)[0]; // not used, kept for parity
  const displaySrc = value && value.startsWith('/') ? `${API}${value}` : value;

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image trop lourde (max 5 Mo)'); return; }
    if (!/^image\/(jpeg|png|webp|svg\+xml)$/.test(file.type)) { toast.error('Format invalide (JPG/PNG/WebP/SVG)'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'profile');
    setUploading(true);
    try {
      const res = await axios.post(`${API}/api/media/upload`, fd, { headers: { ...headers(), 'Content-Type': 'multipart/form-data' } });
      const url = res.data.asset?.url || res.data.url;
      if (url) { onChange(url); toast.success('Photo uploadée ✓'); }
      else toast.error('Réponse serveur invalide');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Échec upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Photo de profil</label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          {displaySrc ? (
            <img src={displaySrc} alt="Aperçu" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <Icon.Users size={20} style={{ color: 'var(--text-faint)' }} />
          )}
        </div>
        <label className="btn btn-gold py-2 px-3 text-xs cursor-pointer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {uploading ? <><div className="spinner" /> Upload...</> : <><Icon.Upload size={14} /> Choisir une photo</>}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={onPick} disabled={uploading} />
        </label>
        {value && (
          <button onClick={() => onChange('')} className="lang-toggle" style={{ color: 'var(--coral)' }} title="Retirer la photo">
            <Icon.Trash size={14} />
          </button>
        )}
      </div>
      <div className="text-2xs font-mono" style={{ color: 'var(--text-faint)' }}>JPG, PNG, WebP ou SVG — max 5 Mo</div>
    </div>
  );
}

export default function ProfileEditor() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/admin/profile`, { headers: headers() })
      .then(r => setProfile(r.data.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  const update = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/admin/profile`, profile, { headers: headers() });
      toast.success('Profil sauvegardé ✓');
    } catch (err) {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><div className="spinner" /></div>;
  if (!profile) return <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>Aucun profil trouvé</div>;

  return (
    <Section
      title="Profil personnel"
      action={
        <button onClick={save} disabled={saving} className="btn btn-gold py-2 px-4 text-xs">
          {saving ? <><div className="spinner" /> Sauvegarde...</> : <><Icon.Check size={14} /> Sauvegarder</>}
        </button>
      }
    >
      <div className="grid md:grid-cols-2 gap-5">
        <TextField label="Nom complet"      value={profile.name}       onChange={(v) => update('name', v)} required />
        <TextField label="Prénom"           value={profile.first_name} onChange={(v) => update('first_name', v)} />
        <TextField label="Email"            value={profile.email}      onChange={(v) => update('email', v)} type="email" required />
        <TextField label="Téléphone"        value={profile.phone}      onChange={(v) => update('phone', v)} />
        <TextField label="Localisation"     value={profile.location}   onChange={(v) => update('location', v)} />
        <TextField label="Date de naissance" value={profile.birth}     onChange={(v) => update('birth', v)} placeholder="20 Février 2005" />
        <TextField label="Permis"           value={profile.license}    onChange={(v) => update('license', v)} placeholder="Permis B" />
        <PhotoUploader value={profile.photo_url} onChange={(v) => update('photo_url', v)} />
        <TextField label="LinkedIn"         value={profile.linkedin}   onChange={(v) => update('linkedin', v)} placeholder="https://linkedin.com/in/..." />
        <TextField label="GitHub"           value={profile.github}     onChange={(v) => update('github', v)} placeholder="https://github.com/..." />
        <TextField label="WhatsApp (numéro)" value={profile.whatsapp}   onChange={(v) => update('whatsapp', v)} placeholder="+212 6 12 34 56 78" />
      </div>

      <div className="my-5 sep" />

      <div className="space-y-5">
        <I18nField label="Titre principal"  value={profile.title}    onChange={(v) => update('title', v)} />
        <I18nField label="Sous-titre"        value={profile.subtitle} onChange={(v) => update('subtitle', v)} />
        <I18nField label="Tagline"           value={profile.tagline}  onChange={(v) => update('tagline', v)} />
        <I18nField label="Biographie" type="textarea" value={profile.bio} onChange={(v) => update('bio', v)} required />
      </div>
    </Section>
  );
}
