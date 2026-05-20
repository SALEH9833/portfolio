import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Section } from './AdminUI';
import Icon from '../Icons';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

const CATEGORIES = [
  { id: 'all',     label: 'Tout' },
  { id: 'profile', label: 'Profil' },
  { id: 'project', label: 'Projets' },
  { id: 'cv',      label: 'CV' },
  { id: 'general', label: 'Général' },
];

export default function MediaPanel() {
  const [assets, setAssets]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [uploading, setUploading] = useState(false);
  const [category, setCategory]   = useState('general');
  const [altText, setAltText]     = useState('');
  const fileInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/media`, { headers: headers() })
      .then((r) => setAssets(r.data.data || []))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5 Mo)');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (altText) formData.append('alt_text', altText);

    try {
      await axios.post(`${API}/api/media/upload`, formData, {
        headers: { ...headers(), 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Photo uploadée ✓');
      setAltText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur d\'upload');
    } finally {
      setUploading(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Supprimer cette image ?')) return;
    try {
      await axios.delete(`${API}/api/media/${id}`, { headers: headers() });
      toast.success('Supprimé');
      load();
    } catch { toast.error('Erreur'); }
  };

  const copyUrl = (url) => {
    const full = `${API}${url}`;
    navigator.clipboard.writeText(full);
    toast.success('URL copiée — collez dans le champ Photo URL du profil');
  };

  const filtered = assets.filter((a) => filter === 'all' || a.category === filter);

  return (
    <>
      <Section title="Uploader une nouvelle image">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Catégorie
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="field">
                <option value="profile">Profil (photo principale)</option>
                <option value="project">Projets (images de projets)</option>
                <option value="cv">CV (images dans les CV)</option>
                <option value="general">Général</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Description (alt text - SEO)
              </label>
              <input
                className="field"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Saleh Mahamat Saleh - portrait professionnel"
              />
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              onChange={onFilePicked}
              disabled={uploading}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="block w-full p-8 rounded-lg text-center cursor-pointer transition-all hover:scale-[1.01]"
              style={{
                background: 'var(--surface-2)',
                border: '2px dashed var(--border-hover)',
                color: 'var(--text-muted)',
              }}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner" />
                  <span className="text-sm">Upload en cours...</span>
                </div>
              ) : (
                <>
                  <div className="mb-2" style={{ color: 'var(--accent)' }}><Icon.Download size={28} className="mx-auto" /></div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                    Glisser une image ici ou <span style={{ color: 'var(--accent)' }}>cliquer pour parcourir</span>
                  </div>
                  <div className="text-2xs mt-1.5">
                    JPG, PNG, WebP, GIF, SVG · Max 5 Mo
                  </div>
                </>
              )}
            </label>
          </div>
        </div>
      </Section>

      <Section
        title={`Bibliothèque média (${filtered.length})`}
        action={
          <div className="flex gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: filter === c.id ? 'var(--accent-glow)' : 'transparent',
                  color:      filter === c.id ? 'var(--accent)' : 'var(--text-muted)',
                  border:     `1px solid ${filter === c.id ? 'var(--border-hover)' : 'var(--border)'}`,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            Aucune image. Uploadez votre première image ci-dessus.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((a) => (
              <div key={a.id} className="group relative rounded-lg overflow-hidden" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="aspect-square overflow-hidden">
                  <img src={`${API}${a.url}`} alt={a.alt_text || a.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2.5">
                  <div className="text-2xs font-mono truncate" style={{ color: 'var(--text-soft)' }}>
                    {a.filename}
                  </div>
                  <div className="text-2xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    {a.category}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => copyUrl(a.url)}
                      className="flex-1 text-2xs font-mono px-2 py-1 rounded transition-colors"
                      style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                      Copier URL
                    </button>
                    <button onClick={() => del(a.id)}
                      className="lang-toggle p-1.5"
                      style={{ color: 'var(--coral)' }}
                      aria-label="Supprimer">
                      <Icon.Trash size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 p-4 rounded-lg text-xs" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          <strong style={{ color: 'var(--text)' }}>Comment utiliser :</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Upload ton image ci-dessus avec la catégorie <code style={{ color: 'var(--accent)' }}>profile</code></li>
            <li>Clique <strong>"Copier URL"</strong> sur l'image</li>
            <li>Va dans <strong>Profil</strong> → champ <strong>Photo URL</strong> → colle l'URL</li>
            <li>Sauvegarde → ta nouvelle photo apparaît sur la page d'accueil</li>
          </ol>
        </div>
      </Section>
    </>
  );
}
