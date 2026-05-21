import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Modal, Confirm, Section, TextField, I18nField, I18nArrayField, ArrayField, CheckField } from './AdminUI';
import Icon from '../Icons';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

const pickFr = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.fr || v.en || Object.values(v)[0] || '';
  return String(v);
};

const SCHEMAS = {
  languages: {
    title: 'Langues',
    listField: 'name',
    listSub: (it) => pickFr(it.level),
    defaults: { name: '', level: { fr: '', en: '', ar: '' }, proficiency: 50, flag: '🇫🇷', display_order: 0 },
    fields: [
      { key: 'name',         component: TextField,  props: { label: 'Nom', required: true } },
      { key: 'flag',         component: TextField,  props: { label: 'Drapeau (emoji)', placeholder: '🇫🇷' } },
      { key: 'level',        component: I18nField,  props: { label: 'Niveau (traduisible)' } },
      { key: 'proficiency',  component: TextField,  props: { label: 'Maîtrise (0-100)', type: 'number' } },
      { key: 'display_order', component: TextField, props: { label: 'Ordre', type: 'number' } },
    ],
  },
  strengths: {
    title: 'Atouts',
    listField: 'title',
    listSub: (it) => pickFr(it.description),
    defaults: { icon: 'shield', title: { fr: '', en: '', ar: '' }, description: { fr: '', en: '', ar: '' }, display_order: 0 },
    fields: [
      { key: 'icon',         component: TextField,  props: { label: 'Icône (shield, users, zap, book-open)' } },
      { key: 'title',        component: I18nField,  props: { label: 'Titre', required: true } },
      { key: 'description',  component: I18nField,  props: { label: 'Description', type: 'textarea' } },
      { key: 'display_order', component: TextField, props: { label: 'Ordre', type: 'number' } },
    ],
  },
  projects: {
    title: 'Projets',
    listField: 'title',
    listSub: (it) => `${it.category} · ${pickFr(it.subtitle)}`,
    defaults: { slug: '', title: '', subtitle: { fr: '', en: '', ar: '' }, description: { fr: '', en: '', ar: '' }, long_description: { fr: '', en: '', ar: '' }, category: '', highlights: { fr: [], en: [], ar: [] }, tech: [], color: '#c8a96e', icon: 'network', github_url: '', featured: false, display_order: 0 },
    fields: [
      { key: 'slug',             component: TextField, props: { label: 'Slug unique (sans espace)', required: true, placeholder: 'mon-projet' } },
      { key: 'title',            component: TextField, props: { label: 'Titre', required: true } },
      { key: 'category',         component: TextField, props: { label: 'Catégorie', placeholder: 'Cybersécurité' } },
      { key: 'subtitle',         component: I18nField, props: { label: 'Sous-titre' } },
      { key: 'description',      component: I18nField, props: { label: 'Description courte', type: 'textarea' } },
      { key: 'long_description', component: I18nField, props: { label: 'Description longue (modal)', type: 'textarea' } },
      { key: 'highlights',       component: I18nArrayField, props: { label: 'Points clés' } },
      { key: 'tech',             component: ArrayField, props: { label: 'Technologies', placeholder: 'React, Node.js…' } },
      { key: 'color',            component: TextField, props: { label: 'Couleur (hex)', placeholder: '#c8a96e' } },
      { key: 'icon',             component: TextField, props: { label: 'Icône (network, lock, coffee)' } },
      { key: 'github_url',       component: TextField, props: { label: 'URL GitHub' } },
      { key: 'featured',         component: CheckField, props: { label: 'Projet phare (mis en avant)' } },
      { key: 'display_order',    component: TextField, props: { label: 'Ordre', type: 'number' } },
    ],
  },
  experience: {
    title: 'Expérience',
    listField: (it) => `${pickFr(it.role)} — ${it.company}`,
    listSub: (it) => `${it.type} · ${it.period}`,
    defaults: { slug: '', role: { fr: '', en: '', ar: '' }, company: '', location: '', period: '', type: 'Stage', is_current: false, description: { fr: '', en: '', ar: '' }, tasks: { fr: [], en: [], ar: [] }, color: '#c8a96e', display_order: 0 },
    fields: [
      { key: 'slug',           component: TextField, props: { label: 'Slug unique', required: true } },
      { key: 'role',           component: I18nField, props: { label: 'Poste / Rôle', required: true } },
      { key: 'company',        component: TextField, props: { label: 'Entreprise' } },
      { key: 'location',       component: TextField, props: { label: 'Lieu' } },
      { key: 'period',         component: TextField, props: { label: 'Période', placeholder: 'Avril 2026 — Juin 2026' } },
      { key: 'type',           component: TextField, props: { label: 'Type (Stage, Emploi, Projet académique)' } },
      { key: 'is_current',     component: CheckField, props: { label: 'En cours actuellement' } },
      { key: 'description',    component: I18nField, props: { label: 'Description', type: 'textarea' } },
      { key: 'tasks',          component: I18nArrayField, props: { label: 'Missions / tâches' } },
      { key: 'color',          component: TextField, props: { label: 'Couleur (hex)' } },
      { key: 'display_order',  component: TextField, props: { label: 'Ordre', type: 'number' } },
    ],
  },
  education: {
    title: 'Formation',
    listField: (it) => pickFr(it.degree),
    listSub: (it) => `${it.school} · ${it.period}`,
    defaults: { degree: { fr: '', en: '', ar: '' }, school: '', location: '', period: '', is_current: false, modules: { fr: [], en: [], ar: [] }, display_order: 0 },
    fields: [
      { key: 'degree',        component: I18nField, props: { label: 'Diplôme', required: true } },
      { key: 'school',        component: TextField, props: { label: 'École' } },
      { key: 'location',      component: TextField, props: { label: 'Lieu' } },
      { key: 'period',        component: TextField, props: { label: 'Période' } },
      { key: 'is_current',    component: CheckField, props: { label: 'En cours' } },
      { key: 'modules',       component: I18nArrayField, props: { label: 'Modules / matières' } },
      { key: 'display_order', component: TextField, props: { label: 'Ordre', type: 'number' } },
    ],
  },
  activities: {
    title: 'Activités & Engagements',
    listField: (it) => pickFr(it.title),
    listSub: (it) => `${pickFr(it.description)} · ${it.year}`,
    defaults: { icon: 'sparkles', title: { fr: '', en: '', ar: '' }, description: { fr: '', en: '', ar: '' }, year: '', display_order: 0 },
    fields: [
      { key: 'icon',          component: TextField, props: { label: 'Icône (mic, music, users, shield)' } },
      { key: 'title',         component: I18nField, props: { label: 'Titre', required: true } },
      { key: 'description',   component: I18nField, props: { label: 'Description', type: 'textarea' } },
      { key: 'year',          component: TextField, props: { label: 'Année' } },
      { key: 'display_order', component: TextField, props: { label: 'Ordre', type: 'number' } },
    ],
  },
  certifications: {
    title: 'Certifications',
    listField: 'name',
    listSub: (it) => `${it.issuer} · ${it.year}`,
    defaults: { name: '', issuer: '', year: '', color: '#00bceb', display_order: 0 },
    fields: [
      { key: 'name',          component: TextField, props: { label: 'Nom certification', required: true } },
      { key: 'issuer',        component: TextField, props: { label: 'Émetteur' } },
      { key: 'year',          component: TextField, props: { label: 'Année' } },
      { key: 'color',         component: TextField, props: { label: 'Couleur (hex)' } },
      { key: 'display_order', component: TextField, props: { label: 'Ordre', type: 'number' } },
    ],
  },
  tech_stack: {
    title: 'Tech Stack (marquee)',
    listField: 'name',
    listSub: (it) => `Icône : ${it.icon}`,
    defaults: { name: '', icon: '', display_order: 0 },
    fields: [
      { key: 'name',          component: TextField, props: { label: 'Nom', required: true } },
      { key: 'icon',          component: TextField, props: { label: 'Icône / emoji', placeholder: '⚛️' } },
      { key: 'display_order', component: TextField, props: { label: 'Ordre', type: 'number' } },
    ],
  },
  skill_categories: {
    title: 'Catégories de compétences',
    listField: (it) => pickFr(it.name),
    listSub: (it) => `Icône : ${it.icon} · Couleur : ${it.color}`,
    defaults: { name: { fr: '', en: '', ar: '' }, icon: 'shield', color: '#c8a96e', display_order: 0 },
    fields: [
      { key: 'name',          component: I18nField, props: { label: 'Nom', required: true } },
      { key: 'icon',          component: TextField, props: { label: 'Icône (shield, code, database, tool)' } },
      { key: 'color',         component: TextField, props: { label: 'Couleur (hex)' } },
      { key: 'display_order', component: TextField, props: { label: 'Ordre', type: 'number' } },
    ],
  },
  skills: {
    title: 'Compétences (skills individuelles)',
    listField: 'name',
    listSub: (it) => `Catégorie #${it.category_id} · ${it.level}%`,
    defaults: { category_id: 1, name: '', level: 50, display_order: 0 },
    fields: [
      { key: 'category_id',   component: TextField, props: { label: 'ID Catégorie', type: 'number', required: true } },
      { key: 'name',          component: TextField, props: { label: 'Nom', required: true } },
      { key: 'level',         component: TextField, props: { label: 'Niveau (0-100)', type: 'number' } },
      { key: 'display_order', component: TextField, props: { label: 'Ordre', type: 'number' } },
    ],
  },
  cv_templates: {
    title: 'Modèles CV',
    listField: 'name',
    listSub: (it) => `${it.category || '—'} · ${it.is_premium ? `Premium ${it.price}€` : 'Gratuit'} · ${it.style || ''}`,
    defaults: { slug: '', name: '', description: '', category: '', style: '', preview_url: '', edit_url: '', view_url: '', builder_id: '', is_premium: false, price: 0, currency: 'EUR', tags: [], display_order: 0 },
    fields: [
      { key: 'slug',          component: TextField, props: { label: 'Slug (unique, sans espace)', required: true } },
      { key: 'name',          component: TextField, props: { label: 'Nom', required: true } },
      { key: 'description',   component: TextField, props: { label: 'Description', type: 'textarea' } },
      { key: 'category',      component: TextField, props: { label: 'Catégorie', placeholder: 'Tech, Corporate, Créatif…' } },
      { key: 'style',         component: TextField, props: { label: 'Style (modern, classic, canva…)' } },
      { key: 'preview_url',   component: TextField, props: { label: 'URL aperçu (image ou Canva)' } },
      { key: 'edit_url',      component: TextField, props: { label: 'URL Canva (édition après achat)' } },
      { key: 'view_url',      component: TextField, props: { label: 'URL vue détaillée (optionnel)' } },
      { key: 'builder_id',    component: TextField, props: { label: 'Builder ID (modern, classic… pour templates gratuits)' } },
      { key: 'is_premium',    component: CheckField, props: { label: 'Template Premium (payant)' } },
      { key: 'price',         component: TextField, props: { label: 'Prix (€)', type: 'number' } },
      { key: 'currency',      component: TextField, props: { label: 'Devise', placeholder: 'EUR' } },
      { key: 'tags',          component: ArrayField, props: { label: 'Tags', placeholder: 'tech, propre, moderne…' } },
      { key: 'display_order', component: TextField, props: { label: 'Ordre d\'affichage', type: 'number' } },
    ],
  },
  testimonials: {
    title: 'Témoignages',
    listField: 'name',
    listSub: (it) => `${it.rating}★ · ${it.role || ''}${it.company ? ' · ' + it.company : ''} · ${it.is_approved ? '✓ publié' : '⏳ en attente'}${it.is_featured ? ' · ★ phare' : ''}`,
    defaults: { name: '', role: '', company: '', message: '', rating: 5, photo_url: '', relation: '', email: '', is_approved: true, is_featured: false, display_order: 0 },
    fields: [
      { key: 'name',          component: TextField, props: { label: 'Nom', required: true } },
      { key: 'role',          component: TextField, props: { label: 'Poste / Rôle' } },
      { key: 'company',       component: TextField, props: { label: 'Entreprise / École' } },
      { key: 'relation',      component: TextField, props: { label: 'Relation (Collègue, Mentor...)' } },
      { key: 'message',       component: TextField, props: { label: 'Message / Avis', type: 'textarea', required: true } },
      { key: 'rating',        component: TextField, props: { label: 'Note (1-5)', type: 'number' } },
      { key: 'photo_url',     component: TextField, props: { label: 'Photo URL (optionnel)' } },
      { key: 'email',         component: TextField, props: { label: 'Email (privé)' } },
      { key: 'is_approved',   component: CheckField, props: { label: 'Publié (visible sur le site)' } },
      { key: 'is_featured',   component: CheckField, props: { label: 'Mis en avant (carte large)' } },
      { key: 'display_order', component: TextField, props: { label: 'Ordre', type: 'number' } },
    ],
  },
};

export default function EntityManager({ table }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDelete] = useState(null);

  const schema = SCHEMAS[table];
  if (!schema) return <div className="text-center py-10" style={{ color: 'var(--coral)' }}>Table inconnue : {table}</div>;

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/entities/${table}`, { headers: headers() });
      setItems(res.data.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [table]);

  const save = async (data) => {
    try {
      if (data.id) {
        await axios.put(`${API}/api/admin/entities/${table}/${data.id}`, data, { headers: headers() });
        toast.success('Mis à jour ✓');
      } else {
        await axios.post(`${API}/api/admin/entities/${table}`, data, { headers: headers() });
        toast.success('Créé ✓');
      }
      setEditing(null); setCreating(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de sauvegarde');
    }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`${API}/api/admin/entities/${table}/${id}`, { headers: headers() });
      toast.success('Supprimé ✓');
      setDelete(null);
      load();
    } catch { toast.error('Erreur de suppression'); }
  };

  const titleOf = (it) => typeof schema.listField === 'function' ? schema.listField(it) : it[schema.listField];

  return (
    <Section
      title={`${schema.title} (${items.length})`}
      action={
        <button onClick={() => setCreating(true)} className="btn btn-gold py-2 px-4 text-xs">
          + Ajouter
        </button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-8"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Aucun élément. Cliquez "+ Ajouter" pour créer.</div>
      ) : (
        <div className="space-y-2">
          {items.map(it => (
            <div key={it.id} className="flex items-center justify-between p-3 rounded-lg transition-colors" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>#{it.id}</span>
                  <span className="font-medium truncate" style={{ color: 'var(--text)' }}>{titleOf(it)}</span>
                  {it.featured && <span className="text-2xs" style={{ color: 'var(--accent)' }}>★</span>}
                  {it.is_current && <span className="w-2 h-2 rounded-full bg-sage" />}
                </div>
                <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{schema.listSub?.(it) || ''}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setEditing(it)} className="lang-toggle" aria-label="Modifier">
                  <Icon.Code size={14} />
                </button>
                <button onClick={() => setDelete(it.id)} className="lang-toggle" style={{ color: 'var(--coral)' }} aria-label="Supprimer">
                  <Icon.Close size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(editing || creating) && (
          <EditModal
            schema={schema}
            item={editing || schema.defaults}
            onSave={save}
            onClose={() => { setEditing(null); setCreating(false); }}
          />
        )}
        {deletingId && (
          <Confirm
            title="Confirmer la suppression"
            message={`Supprimer définitivement #${deletingId} ? Cette action est irréversible.`}
            onConfirm={() => remove(deletingId)}
            onCancel={() => setDelete(null)}
          />
        )}
      </AnimatePresence>
    </Section>
  );
}

function EditModal({ schema, item, onSave, onClose }) {
  const [form, setForm] = useState(item);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal title={form.id ? `Modifier #${form.id}` : 'Nouveau'} onClose={onClose}>
      <div className="space-y-5">
        {schema.fields.map(f => {
          const Comp = f.component;
          return (
            <Comp
              key={f.key}
              value={form[f.key]}
              onChange={(v) => update(f.key, v)}
              {...f.props}
            />
          );
        })}
      </div>
      <div className="flex gap-3 justify-end mt-7 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
        <button onClick={onClose} className="btn btn-ghost py-2 px-5 text-sm">Annuler</button>
        <button onClick={() => onSave(form)} className="btn btn-gold py-2 px-5 text-sm">
          <Icon.Check size={14} /> Sauvegarder
        </button>
      </div>
    </Modal>
  );
}
