import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Icon from './Icons';
import { useI18n } from '../lib/i18n';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

// 5-star rating display
function StarRating({ value = 5, size = 14, interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(n)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          style={{ color: n <= value ? '#FFB23F' : 'rgba(255, 178, 63, 0.25)' }}
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
        >
          <Icon.Star size={size} className="fill-current" />
        </button>
      ))}
    </div>
  );
}

function TestimonialCard({ t, isLarge = false }) {
  const initials = t.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className={`relative surface p-6 lg:p-7 h-full flex flex-col ${isLarge ? 'lg:p-8' : ''}`}
      style={{ background: t.is_featured ? 'var(--accent-glow)' : undefined, borderColor: t.is_featured ? 'var(--border-hover)' : undefined }}>

      {/* Quote mark décoratif */}
      <div className="absolute top-4 right-5 opacity-10 font-display" style={{ fontSize: '5rem', lineHeight: 1, color: 'var(--accent)' }}>
        &ldquo;
      </div>

      <StarRating value={t.rating} size={isLarge ? 18 : 14} />

      <blockquote className={`mt-4 mb-5 leading-relaxed flex-1 italic ${isLarge ? 'text-lg' : 'text-base'}`}
        style={{ color: 'var(--text-soft)' }}>
        « {t.message} »
      </blockquote>

      <footer className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        {t.photo_url ? (
          <img src={t.photo_url} alt={t.name} className="w-11 h-11 rounded-full object-cover border" style={{ borderColor: 'var(--border-hover)' }} />
        ) : (
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-display font-semibold text-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: 'var(--bg)' }}>
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold text-sm leading-tight truncate" style={{ color: 'var(--text)' }}>
            {t.name}
          </div>
          {(t.role || t.company) && (
            <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {[t.role, t.company].filter(Boolean).join(' · ')}
            </div>
          )}
          {t.relation && (
            <span className="inline-block text-2xs font-mono px-1.5 py-0.5 rounded mt-1"
              style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}>
              {t.relation}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}

function TestimonialForm({ onSubmitted }) {
  const { locale } = useI18n();
  const [form, setForm] = useState({ name: '', role: '', company: '', message: '', rating: 5, relation: '', email: '', photo_url: '' });
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef(null);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const fullPhotoUrl = (u) => {
    if (!u) return '';
    if (u.startsWith('http')) return u;
    if (u.startsWith('/')) return `${API}${u}`;
    return u;
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 2 Mo)');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await axios.post(`${API}/api/public-uploads/testimonial-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.url) {
        update('photo_url', `${API}${res.data.url}`);
        toast.success('Photo ajoutée ✓');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur d\'upload');
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await axios.post(`${API}/api/testimonials`, form);
      toast.success('Merci ! Votre avis a été soumis et sera publié sous 24h.', { duration: 6000 });
      setForm({ name: '', role: '', company: '', message: '', rating: 5, relation: '', email: '' });
      onSubmitted?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur. Réessayez.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Photo uploader */}
      <div>
        <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Votre photo (optionnel)
        </label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ background: 'var(--surface-2)', border: '2px dashed var(--border-hover)' }}>
            {form.photo_url ? (
              <img src={fullPhotoUrl(form.photo_url)} alt="Aperçu" className="w-full h-full object-cover" />
            ) : (
              <Icon.Users size={22} style={{ color: 'var(--text-faint)' }} />
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              ref={photoInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={uploadPhoto}
              disabled={uploading}
              className="hidden"
              id="testi-photo-input"
            />
            <label htmlFor="testi-photo-input" className="btn btn-ghost py-1.5 px-3 text-xs cursor-pointer inline-flex"
              style={{ opacity: uploading ? 0.6 : 1 }}>
              {uploading ? <><div className="spinner" /> Upload...</> : (form.photo_url ? 'Changer' : 'Ajouter une photo')}
            </label>
            {form.photo_url && (
              <button type="button" onClick={() => update('photo_url', '')} className="text-2xs ms-2" style={{ color: 'var(--coral)' }}>
                Retirer
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Votre nom *
          </label>
          <input className="field" required minLength={2} maxLength={100}
            value={form.name} onChange={(e) => update('name', e.target.value)}
            placeholder="Marie Dupont" />
        </div>
        <div>
          <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Email (privé)
          </label>
          <input type="email" className="field" maxLength={200}
            value={form.email} onChange={(e) => update('email', e.target.value)}
            placeholder="marie@example.com" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Votre poste
          </label>
          <input className="field" maxLength={120}
            value={form.role} onChange={(e) => update('role', e.target.value)}
            placeholder="Développeuse, Étudiante…" />
        </div>
        <div>
          <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Entreprise / École
          </label>
          <input className="field" maxLength={120}
            value={form.company} onChange={(e) => update('company', e.target.value)}
            placeholder="EST Safi, Startup…" />
        </div>
      </div>

      <div>
        <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Comment connaissez-vous Saleh ?
        </label>
        <select className="field" value={form.relation} onChange={(e) => update('relation', e.target.value)}>
          <option value="">— Choisir —</option>
          <option value="Collègue">Collègue</option>
          <option value="Camarade">Camarade de classe</option>
          <option value="Enseignant(e)">Enseignant(e)</option>
          <option value="Client(e)">Client(e)</option>
          <option value="Recruteur">Recruteur</option>
          <option value="Mentor">Mentor</option>
          <option value="Autre">Autre</option>
        </select>
      </div>

      <div>
        <label className="block text-2xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Note globale *
        </label>
        <div className="flex items-center gap-3">
          <StarRating value={form.rating} size={28} interactive onChange={(r) => update('rating', r)} />
          <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{form.rating} / 5</span>
        </div>
      </div>

      <div>
        <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Votre avis * <span className="lowercase opacity-70">(20-1000 caractères)</span>
        </label>
        <textarea
          className="field resize-none"
          rows={5}
          required minLength={20} maxLength={1000}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          placeholder="Partagez votre expérience avec Saleh — collaboration, compétences, qualités humaines…"
        />
        <div className="text-2xs mt-1 text-end font-mono" style={{ color: 'var(--text-faint)' }}>
          {form.message.length} / 1000
        </div>
      </div>

      <button type="submit" disabled={sending} className="btn btn-gold w-full py-3 text-sm">
        {sending ? <div className="spinner" /> : 'Publier mon avis'}
      </button>

      <p className="text-2xs text-center leading-relaxed" style={{ color: 'var(--text-faint)' }}>
        Votre avis sera vérifié avant publication. Votre email reste privé.
      </p>
    </form>
  );
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/testimonials`, { timeout: 8000 })
      .then((r) => setTestimonials(r.data?.data || []))
      .catch(() => setTestimonials([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const featured = testimonials.filter((t) => t.is_featured);
  const regular  = testimonials.filter((t) => !t.is_featured);
  const avgRating = testimonials.length
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : '5.0';

  return (
    <section id="testimonials" ref={ref} className="py-24 lg:py-32 relative" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-20 left-1/4 w-[30rem] h-[30rem]"
          style={{ background: 'radial-gradient(circle, var(--hero-glow-1), transparent 60%)' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="eyebrow justify-center mb-5">Témoignages</div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight mb-5 text-balance" style={{ color: 'var(--text)' }}>
            Ce qu'ils <em className="text-gold-grad">pensent</em> de mon travail
          </h2>
          <p className="text-base lg:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-soft)' }}>
            Retours de collègues, enseignants et collaborateurs avec qui j'ai eu la chance de travailler.
          </p>

          {testimonials.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-7">
              <StarRating value={Math.round(parseFloat(avgRating))} size={20} />
              <span className="font-mono text-sm" style={{ color: 'var(--text-soft)' }}>
                <strong className="text-gold-grad font-display text-xl">{avgRating}</strong> / 5
                <span className="ms-2 opacity-60">· {testimonials.length} avis</span>
              </span>
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner" /></div>
        ) : testimonials.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="text-center py-16"
          >
            <p className="mb-5" style={{ color: 'var(--text-muted)' }}>
              Aucun témoignage pour le moment.
            </p>
            <button onClick={() => setShowForm(true)} className="btn btn-gold py-2.5 px-5 text-sm">
              Soyez le premier à laisser un avis
            </button>
          </motion.div>
        ) : (
          <>
            {/* Featured testimonials (2 colonnes larges) */}
            {featured.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15 }}
                className="grid md:grid-cols-2 gap-5 lg:gap-6 mb-6"
              >
                {featured.slice(0, 2).map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <TestimonialCard t={t} isLarge />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Regular testimonials (3 colonnes) */}
            {regular.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {regular.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <TestimonialCard t={t} />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* CTA pour laisser un avis */}
        {!showForm && testimonials.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Vous avez travaillé avec moi ?
            </p>
            <button onClick={() => setShowForm(true)} className="btn btn-ghost py-2.5 px-5 text-sm" style={{ borderColor: 'var(--accent)' }}>
              Laisser un avis
            </button>
          </motion.div>
        )}

        {/* Form modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ y: 20, scale: 0.96, opacity: 0 }}
                animate={{ y: 0,  scale: 1,   opacity: 1 }}
                exit={{    y: 20, scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="surface w-full max-w-xl p-6 lg:p-7 my-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display text-2xl" style={{ color: 'var(--text)' }}>Partager votre avis</h3>
                  <button onClick={() => setShowForm(false)} className="lang-toggle">
                    <Icon.Close size={16} />
                  </button>
                </div>
                <TestimonialForm onSubmitted={() => { setShowForm(false); setTimeout(load, 1000); }} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
