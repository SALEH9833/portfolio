import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TextField, I18nField, Section } from './AdminUI';
import Icon from '../Icons';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

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
        <TextField label="Photo URL"        value={profile.photo_url}  onChange={(v) => update('photo_url', v)} placeholder="https://..." />
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
