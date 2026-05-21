import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Icon from '../components/Icons';
import ThemeToggle from '../components/ThemeToggle';
import { TEMPLATES } from '../components/cv-templates';
import { userAuth } from '../lib/user-auth';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

const STORAGE_KEY = 'cv_builder_data_v1';
const TEMPLATE_KEY = 'cv_builder_template_v1';
const COLOR_KEY    = 'cv_builder_color_v1';

const EMPTY_DATA = {
  personal: { fullName: '', title: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '', photo: '', summary: '' },
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
};

const STEPS = [
  { id: 'template', label: 'Modèle',        icon: 'Layers' },
  { id: 'personal', label: 'Identité',      icon: 'Users' },
  { id: 'about',    label: 'Profil',        icon: 'Sparkles' },
  { id: 'exp',      label: 'Expérience',    icon: 'Briefcase' },
  { id: 'edu',      label: 'Formation',     icon: 'GraduationCap' },
  { id: 'skills',   label: 'Compétences',   icon: 'Tool' },
  { id: 'extra',    label: 'Langues & +',   icon: 'Globe' },
  { id: 'preview',  label: 'Aperçu',        icon: 'Eye' },
];

// Small reusable components
const Field = ({ label, children, hint, full }) => (
  <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
    <div className="text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {label}
    </div>
    {children}
    {hint && <div className="text-2xs mt-1 italic" style={{ color: 'var(--text-faint)' }}>{hint}</div>}
  </label>
);

const Btn = ({ children, onClick, variant = 'ghost', className = '', ...rest }) => {
  const cls = variant === 'gold' ? 'btn-gold' : variant === 'coral' ? 'btn-ghost' : 'btn-ghost';
  const style = variant === 'coral' ? { color: 'var(--coral)' } : {};
  return (
    <button onClick={onClick} className={`btn ${cls} py-2 px-4 text-xs ${className}`} style={style} {...rest}>
      {children}
    </button>
  );
};

export default function CVBuilder() {
  const [step, setStep]         = useState(0);
  const [templateId, setTpl]    = useState('modern');
  const [color, setColor]       = useState('#c8a96e');
  const [data, setData]         = useState(EMPTY_DATA);
  const [loaded, setLoaded]     = useState(false);

  const [syncState, setSyncState] = useState('idle'); // idle | syncing | saved | offline
  const [isLogged, setIsLogged]   = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const debounceRef = useRef(null);

  // Hydrate: prefer DB draft (if logged in) > localStorage > default
  useEffect(() => {
    const logged = userAuth.isLoggedIn();
    setIsLogged(logged);

    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setData({ ...EMPTY_DATA, ...JSON.parse(raw) });
        const t = localStorage.getItem(TEMPLATE_KEY);
        if (t && TEMPLATES.find((x) => x.id === t)) setTpl(t);
        const c = localStorage.getItem(COLOR_KEY);
        if (c) setColor(c);
      } catch {}
    };

    if (logged) {
      axios.get(`${API}/api/auth/cv-draft`, { headers: userAuth.authHeaders() })
        .then((res) => {
          const draft = res.data?.draft;
          if (draft && draft.data && Object.keys(draft.data).length) {
            setData({ ...EMPTY_DATA, ...draft.data });
            if (draft.template_id && TEMPLATES.find((x) => x.id === draft.template_id)) setTpl(draft.template_id);
            if (draft.color) setColor(draft.color);
            if (typeof draft.last_step === 'number') setStep(draft.last_step);
            toast.success('CV restauré depuis votre compte');
          } else {
            loadLocal();
          }
        })
        .catch(loadLocal)
        .finally(() => setLoaded(true));
    } else {
      loadLocal();
      setLoaded(true);
    }
  }, []);

  // Persist to localStorage (always)
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);
  useEffect(() => {
    if (loaded) localStorage.setItem(TEMPLATE_KEY, templateId);
  }, [templateId, loaded]);
  useEffect(() => {
    if (loaded) localStorage.setItem(COLOR_KEY, color);
  }, [color, loaded]);

  // Auto-sync to DB if logged in (debounced 2s)
  useEffect(() => {
    if (!loaded || !isLogged) return;
    setSyncState('syncing');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await axios.put(
          `${API}/api/auth/cv-draft`,
          { data, template_id: templateId, color, last_step: step },
          { headers: userAuth.authHeaders() }
        );
        setSyncState('saved');
      } catch {
        setSyncState('offline');
      }
    }, 2000);
    return () => clearTimeout(debounceRef.current);
  }, [data, templateId, color, step, loaded, isLogged]);

  const update     = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const updP       = (k, v) => setData((d) => ({ ...d, personal: { ...d.personal, [k]: v } }));
  const addItem    = (k, blank) => setData((d) => ({ ...d, [k]: [...(d[k] || []), blank] }));
  const updItem    = (k, i, patch) =>
    setData((d) => ({ ...d, [k]: d[k].map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));
  const removeItem = (k, i) => setData((d) => ({ ...d, [k]: d[k].filter((_, idx) => idx !== i) }));

  const resetAll = async () => {
    if (!confirm('Tout réinitialiser ? Vos données seront perdues définitivement.')) return;
    setData(EMPTY_DATA);
    setTpl('modern');
    setColor('#c8a96e');
    setStep(0);
    if (isLogged) {
      try {
        await axios.delete(`${API}/api/auth/cv-draft`, { headers: userAuth.authHeaders() });
      } catch {}
    }
    toast.success('Réinitialisé');
  };

  const fillDemo = () => {
    setData({
      personal: {
        fullName: 'Marie Dupont',
        title: 'Développeuse Full-Stack',
        email: 'marie.dupont@example.com',
        phone: '+33 6 12 34 56 78',
        location: 'Lyon, France',
        linkedin: 'linkedin.com/in/mariedupont',
        github: 'github.com/mariedupont',
        website: '',
        photo: '',
        summary: 'Développeuse passionnée avec 5 ans d\'expérience dans la création d\'applications web modernes. Spécialisée en React/Node.js avec un fort intérêt pour l\'UX et la performance.',
      },
      experience: [
        {
          role: 'Lead Developer',
          company: 'TechCorp',
          location: 'Lyon',
          period: '2022 — Aujourd\'hui',
          description: 'Pilotage d\'une équipe de 4 développeurs sur une plateforme SaaS B2B.',
          tasks: ['Mise en place de l\'architecture microservices', 'Migration vers Next.js 14 (-40% temps de chargement)', 'Mentorat des juniors'],
        },
        {
          role: 'Développeuse Full-Stack',
          company: 'StartupXYZ',
          location: 'Paris',
          period: '2019 — 2022',
          description: 'Développement from scratch d\'une application mobile et son backend.',
          tasks: ['React Native + Node.js + PostgreSQL', 'Intégration de Stripe et déploiement AWS'],
        },
      ],
      education: [
        { degree: 'Master en Informatique', school: 'INSA Lyon', location: 'Lyon', period: '2017 — 2019', description: 'Spécialisation génie logiciel' },
        { degree: 'Licence Mathématiques', school: 'Université Lyon 1', location: 'Lyon', period: '2014 — 2017', description: '' },
      ],
      skills: [
        { category: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
        { category: 'Backend',  items: ['Node.js', 'Python', 'PostgreSQL', 'Redis'] },
        { category: 'DevOps',   items: ['Docker', 'AWS', 'CI/CD', 'Linux'] },
      ],
      languages: [
        { name: 'Français', level: 'Natif' },
        { name: 'Anglais',  level: 'Courant (C1)' },
        { name: 'Espagnol', level: 'Intermédiaire (B1)' },
      ],
      certifications: [
        { name: 'AWS Certified Developer', issuer: 'Amazon', year: '2023' },
        { name: 'Scrum Master', issuer: 'Scrum.org', year: '2021' },
      ],
    });
    toast.success('Exemple chargé');
  };

  const Template = TEMPLATES.find((t) => t.id === templateId)?.component || TEMPLATES[0].component;
  const goPrint = () => {
    setStep(7);
    setTimeout(() => window.print(), 200);
  };

  return (
    <>
      <Head>
        <title>CV Builder · Construisez votre CV pro</title>
        <meta name="description" content="Créez un CV professionnel en quelques minutes. 5 modèles, export PDF, multilingue." />
      </Head>

      <main className="min-h-screen no-print" style={{ background: 'var(--bg)' }}>
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 92%, transparent)' }}>
          <div className="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: 'var(--bg)' }}>S</div>
              <div className="hidden sm:block">
                <div className="font-display text-sm" style={{ color: 'var(--text)' }}>CV Builder</div>
                <div className="text-2xs font-mono" style={{ color: 'var(--text-muted)' }}>Création gratuite · Export PDF</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              {isLogged && (
                <span className="text-2xs font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5"
                  style={{
                    background: syncState === 'saved' ? 'rgba(167, 195, 165, 0.15)' : syncState === 'syncing' ? 'var(--accent-glow)' : 'rgba(228, 124, 105, 0.15)',
                    color:      syncState === 'saved' ? 'var(--sage)'           : syncState === 'syncing' ? 'var(--accent)'    : 'var(--coral)',
                  }}
                  title={syncState === 'saved' ? 'Sauvegardé dans votre compte' : syncState === 'syncing' ? 'Sauvegarde en cours...' : 'Hors ligne'}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                  <span className="hidden sm:inline">
                    {syncState === 'saved' ? 'Sauvegardé' : syncState === 'syncing' ? 'Sauvegarde…' : 'Hors ligne'}
                  </span>
                </span>
              )}
              {!isLogged && (
                <Link href="/login?next=/cv-builder" className="text-2xs font-mono px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--border-hover)' }}
                  title="Connectez-vous pour sauver votre CV en ligne et le retrouver sur tout appareil">
                  Connexion = sauvegarde cloud
                </Link>
              )}
              <ThemeToggle />
              <button onClick={fillDemo} className="btn btn-ghost py-1.5 px-3 text-xs" title="Charger un exemple">
                <Icon.Sparkles size={12} /> <span className="hidden sm:inline">Exemple</span>
              </button>
              <button onClick={resetAll} className="btn btn-ghost py-1.5 px-3 text-xs" style={{ color: 'var(--coral)' }} title="Réinitialiser">
                <Icon.Close size={12} /> <span className="hidden sm:inline">Reset</span>
              </button>
              <Link href="/" className="btn btn-ghost py-1.5 px-3 text-xs">
                <span className="hidden sm:inline">Retour</span>
                <span className="sm:hidden">←</span>
              </Link>
            </div>
          </div>

          {/* Stepper */}
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex gap-1.5 overflow-x-auto">
            {STEPS.map((s, i) => {
              const IconC = Icon[s.icon];
              const isActive = step === i;
              const isDone   = step > i;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(i)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                  style={{
                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                    color:      isActive ? 'var(--accent)' : isDone ? 'var(--text-soft)' : 'var(--text-muted)',
                    border:     `1px solid ${isActive ? 'var(--border-hover)' : 'var(--border)'}`,
                  }}
                >
                  <span className="text-2xs font-mono opacity-60">{i + 1}</span>
                  <IconC size={12} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Body */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 grid lg:grid-cols-[420px_1fr] gap-6">
          {/* LEFT — Form */}
          <div className="surface p-5 lg:p-6 lg:sticky lg:top-32 lg:self-start lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
            {step === 0 && (
              <>
                <h2 className="font-display text-lg mb-4" style={{ color: 'var(--text)' }}>Choisissez un modèle</h2>
                <div className="space-y-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTpl(t.id); setColor(t.defaultColor); }}
                      className="w-full flex items-center justify-between p-3 rounded-lg text-start transition-all"
                      style={{
                        background:  templateId === t.id ? 'var(--accent-glow)' : 'var(--surface-2)',
                        border:      `1px solid ${templateId === t.id ? 'var(--border-hover)' : 'var(--border)'}`,
                      }}
                    >
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{t.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.description}</div>
                      </div>
                      <div className="w-5 h-5 rounded shrink-0" style={{ background: t.defaultColor }} />
                    </button>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
                  <Field label="Couleur principale">
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-10 rounded-lg border" style={{ borderColor: 'var(--border)' }} />
                  </Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="font-display text-lg mb-4" style={{ color: 'var(--text)' }}>Votre identité</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Nom complet" full>
                    <input className="field" value={data.personal.fullName} onChange={(e) => updP('fullName', e.target.value)} placeholder="Marie Dupont" />
                  </Field>
                  <Field label="Poste / Titre" full>
                    <input className="field" value={data.personal.title} onChange={(e) => updP('title', e.target.value)} placeholder="Développeuse Full-Stack" />
                  </Field>
                  <Field label="Email">
                    <input type="email" className="field" value={data.personal.email} onChange={(e) => updP('email', e.target.value)} />
                  </Field>
                  <Field label="Téléphone">
                    <input className="field" value={data.personal.phone} onChange={(e) => updP('phone', e.target.value)} />
                  </Field>
                  <Field label="Localisation">
                    <input className="field" value={data.personal.location} onChange={(e) => updP('location', e.target.value)} placeholder="Lyon, France" />
                  </Field>
                  <Field label="Site web">
                    <input className="field" value={data.personal.website} onChange={(e) => updP('website', e.target.value)} />
                  </Field>
                  <Field label="LinkedIn">
                    <input className="field" value={data.personal.linkedin} onChange={(e) => updP('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
                  </Field>
                  <Field label="GitHub">
                    <input className="field" value={data.personal.github} onChange={(e) => updP('github', e.target.value)} placeholder="github.com/..." />
                  </Field>
                  <PhotoUploader
                    value={data.personal.photo}
                    onChange={(url) => updP('photo', url)}
                  />
                  <Field label="...ou collez une URL externe" full hint="Si vous préférez utiliser une image déjà en ligne">
                    <input className="field" value={data.personal.photo} onChange={(e) => updP('photo', e.target.value)} placeholder="https://..." />
                  </Field>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display text-lg mb-4" style={{ color: 'var(--text)' }}>Résumé / Profil</h2>
                <Field label="Résumé professionnel" hint="2-4 phrases qui résument votre parcours et ce que vous recherchez">
                  <textarea rows={6} className="field resize-none" value={data.personal.summary} onChange={(e) => updP('summary', e.target.value)} placeholder="Développeuse passionnée avec 5 ans d'expérience..." />
                </Field>
              </>
            )}

            {step === 3 && (
              <ListEditor
                title="Expérience professionnelle"
                items={data.experience}
                onAdd={() => addItem('experience', { role: '', company: '', location: '', period: '', description: '', tasks: [] })}
                onRemove={(i) => removeItem('experience', i)}
                render={(it, i) => (
                  <div className="space-y-2">
                    <input className="field" placeholder="Poste" value={it.role} onChange={(e) => updItem('experience', i, { role: e.target.value })} />
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input className="field" placeholder="Entreprise" value={it.company} onChange={(e) => updItem('experience', i, { company: e.target.value })} />
                      <input className="field" placeholder="Lieu" value={it.location} onChange={(e) => updItem('experience', i, { location: e.target.value })} />
                    </div>
                    <input className="field" placeholder="Période (ex: 2020 — 2023)" value={it.period} onChange={(e) => updItem('experience', i, { period: e.target.value })} />
                    <textarea rows={2} className="field resize-none" placeholder="Description du poste" value={it.description} onChange={(e) => updItem('experience', i, { description: e.target.value })} />
                    <TaskList
                      tasks={it.tasks || []}
                      onChange={(tasks) => updItem('experience', i, { tasks })}
                    />
                  </div>
                )}
              />
            )}

            {step === 4 && (
              <ListEditor
                title="Formation"
                items={data.education}
                onAdd={() => addItem('education', { degree: '', school: '', location: '', period: '', description: '' })}
                onRemove={(i) => removeItem('education', i)}
                render={(it, i) => (
                  <div className="space-y-2">
                    <input className="field" placeholder="Diplôme" value={it.degree} onChange={(e) => updItem('education', i, { degree: e.target.value })} />
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input className="field" placeholder="École" value={it.school} onChange={(e) => updItem('education', i, { school: e.target.value })} />
                      <input className="field" placeholder="Lieu" value={it.location} onChange={(e) => updItem('education', i, { location: e.target.value })} />
                    </div>
                    <input className="field" placeholder="Période" value={it.period} onChange={(e) => updItem('education', i, { period: e.target.value })} />
                    <textarea rows={2} className="field resize-none" placeholder="Description (optionnel)" value={it.description} onChange={(e) => updItem('education', i, { description: e.target.value })} />
                  </div>
                )}
              />
            )}

            {step === 5 && (
              <ListEditor
                title="Compétences"
                items={data.skills}
                onAdd={() => addItem('skills', { category: '', items: [] })}
                onRemove={(i) => removeItem('skills', i)}
                render={(it, i) => (
                  <div className="space-y-2">
                    <input className="field" placeholder="Catégorie (Frontend, Backend, etc.)" value={it.category} onChange={(e) => updItem('skills', i, { category: e.target.value })} />
                    <TaskList
                      tasks={it.items || []}
                      placeholder="Compétence (ex: React)"
                      addLabel="+ Ajouter une compétence"
                      onChange={(items) => updItem('skills', i, { items })}
                    />
                  </div>
                )}
              />
            )}

            {step === 6 && (
              <div className="space-y-6">
                <ListEditor
                  title="Langues"
                  items={data.languages}
                  onAdd={() => addItem('languages', { name: '', level: '' })}
                  onRemove={(i) => removeItem('languages', i)}
                  render={(it, i) => (
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input className="field" placeholder="Langue" value={it.name} onChange={(e) => updItem('languages', i, { name: e.target.value })} />
                      <input className="field" placeholder="Niveau (B2, Natif...)" value={it.level} onChange={(e) => updItem('languages', i, { level: e.target.value })} />
                    </div>
                  )}
                />
                <ListEditor
                  title="Certifications"
                  items={data.certifications}
                  onAdd={() => addItem('certifications', { name: '', issuer: '', year: '' })}
                  onRemove={(i) => removeItem('certifications', i)}
                  render={(it, i) => (
                    <div className="space-y-2">
                      <input className="field" placeholder="Nom de la certification" value={it.name} onChange={(e) => updItem('certifications', i, { name: e.target.value })} />
                      <div className="grid sm:grid-cols-2 gap-2">
                        <input className="field" placeholder="Émetteur" value={it.issuer} onChange={(e) => updItem('certifications', i, { issuer: e.target.value })} />
                        <input className="field" placeholder="Année" value={it.year} onChange={(e) => updItem('certifications', i, { year: e.target.value })} />
                      </div>
                    </div>
                  )}
                />
              </div>
            )}

            {step === 7 && (
              <>
                <h2 className="font-display text-lg mb-3" style={{ color: 'var(--text)' }}>Aperçu & téléchargement</h2>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                  Votre CV est prêt ! Cliquez sur <strong>Imprimer / Sauvegarder en PDF</strong> ci-dessous. Dans la fenêtre d'impression, choisissez « <em>Enregistrer au format PDF</em> » comme destination.
                </p>
                <div className="grid gap-2 mb-3">
                  <button onClick={() => setPreviewOpen(true)} className="btn py-3 px-5 text-sm w-full" style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                    <Icon.Eye size={14} /> Aperçu plein écran
                  </button>
                  <button onClick={goPrint} className="btn btn-gold py-3 px-5 text-sm w-full">
                    <Icon.Download size={14} /> Imprimer / Sauvegarder en PDF
                  </button>
                </div>
                <div className="text-2xs leading-relaxed p-3 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  💡 Vos données sont sauvegardées <strong>localement dans votre navigateur</strong>. Elles ne sont jamais envoyées à un serveur.
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-2 mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <Btn onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                ← Précédent
              </Btn>
              <Btn onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} variant="gold" className="flex-1 ms-auto">
                {step === STEPS.length - 1 ? 'Imprimer →' : 'Suivant →'}
              </Btn>
            </div>
          </div>

          {/* RIGHT — Live Preview */}
          <div className="overflow-x-auto">
            <div className="cv-preview-wrap" style={{ transform: 'scale(0.78)', transformOrigin: 'top left', width: 'fit-content' }}>
              <Template data={data} color={color} />
            </div>
          </div>
        </div>
      </main>

      {/* Printable area (visible only during print) */}
      <div className="print-only" style={{ display: 'none' }}>
        <Template data={data} color={color} />
      </div>

      {/* Full-screen Preview Modal */}
      {previewOpen && (
        <div
          className="cv-preview-modal"
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column',
            backdropFilter: 'blur(4px)',
          }}
        >
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px',
            background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon.Eye size={16} style={{ color: 'var(--accent)' }} />
              <strong style={{ color: 'var(--text)', fontSize: '14px' }}>Aperçu plein écran — {data.personal?.fullName || 'Mon CV'}</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setPreviewOpen(false); setTimeout(() => window.print(), 200); }}
                className="btn btn-gold py-2 px-3 text-xs"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon.Download size={12} /> Télécharger en PDF
              </button>
              <button
                onClick={() => setPreviewOpen(false)}
                className="lang-toggle"
                style={{ padding: '6px 10px' }}
                aria-label="Fermer l'aperçu"
              >
                <Icon.Close size={14} />
              </button>
            </div>
          </div>

          {/* Scrollable CV at full size */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'white',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              maxWidth: '100%',
            }}>
              <Template data={data} color={color} />
            </div>
          </div>

          {/* Hint */}
          <div style={{
            padding: '10px 20px',
            background: 'var(--bg)', borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center',
          }}>
            💡 Vérifie ton CV avant le téléchargement. Clique en dehors ou sur ✕ pour fermer.
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .print-only { display: block !important; }
        }
        @media (max-width: 1024px) {
          .cv-preview-wrap { transform: scale(0.5) !important; }
        }
      `}</style>
    </>
  );
}

// ============================================================================
// Sub-components
// ============================================================================
function ListEditor({ title, items, onAdd, onRemove, render }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg" style={{ color: 'var(--text)' }}>{title}</h2>
        <button onClick={onAdd} className="btn btn-gold py-1.5 px-3 text-xs">+ Ajouter</button>
      </div>
      {(!items || items.length === 0) && (
        <div className="text-center py-5 text-sm" style={{ color: 'var(--text-muted)' }}>
          Aucune entrée. Cliquez "+ Ajouter".
        </div>
      )}
      <div className="space-y-3">
        {(items || []).map((it, i) => (
          <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-mono" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
              <button onClick={() => onRemove(i)} className="lang-toggle" style={{ color: 'var(--coral)' }} aria-label="Supprimer">
                <Icon.Close size={12} />
              </button>
            </div>
            {render(it, i)}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fullUrl = (u) => {
    if (!u) return '';
    if (u.startsWith('http')) return u;
    if (u.startsWith('/')) return `${API}${u}`;
    return u;
  };

  const onFile = async (e) => {
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
      const res = await axios.post(`${API}/api/public-uploads/cv-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.url) {
        onChange(`${API}${res.data.url}`);
        toast.success('Photo ajoutée ✓');
      } else {
        toast.error('Erreur d\'upload');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur d\'upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="sm:col-span-2">
      <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
        Votre photo
      </label>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: 'var(--surface-2)', border: '2px dashed var(--border-hover)' }}>
          {value ? (
            <img src={fullUrl(value)} alt="Aperçu" className="w-full h-full object-cover" />
          ) : (
            <Icon.Users size={28} style={{ color: 'var(--text-faint)' }} />
          )}
        </div>
        <div className="flex-1">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            onChange={onFile}
            disabled={uploading}
            className="hidden"
            id="cv-photo-input"
          />
          <label
            htmlFor="cv-photo-input"
            className="btn btn-gold py-2 px-4 text-xs cursor-pointer inline-flex"
            style={{ opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? <><div className="spinner" /> Upload...</> : (value ? 'Changer la photo' : 'Choisir une photo')}
          </label>
          {value && (
            <button
              onClick={() => onChange('')}
              type="button"
              className="btn btn-ghost py-2 px-3 text-xs ms-2"
              style={{ color: 'var(--coral)' }}
            >
              Retirer
            </button>
          )}
          <div className="text-2xs mt-2" style={{ color: 'var(--text-muted)' }}>
            JPG, PNG ou WebP · Max 2 Mo · Conservée localement, jamais partagée
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskList({ tasks, onChange, placeholder = 'Mission / tâche', addLabel = '+ Ajouter' }) {
  return (
    <div className="space-y-1.5">
      {(tasks || []).map((t, i) => (
        <div key={i} className="flex gap-1.5">
          <input
            className="field flex-1 text-sm"
            value={t}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...tasks]; next[i] = e.target.value; onChange(next);
            }}
          />
          <button onClick={() => onChange(tasks.filter((_, j) => j !== i))} className="lang-toggle shrink-0" style={{ color: 'var(--coral)' }} aria-label="Supprimer">
            <Icon.Close size={12} />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...(tasks || []), ''])} className="btn btn-ghost py-1 px-2.5 text-2xs">
        {addLabel}
      </button>
    </div>
  );
}
