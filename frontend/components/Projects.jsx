import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Icon from './Icons';
import { useI18n, pickLocale } from '../lib/i18n';

const ACCENTS = {
  graphsense: { color: '#c8a96e', tint: 'rgba(200,169,110,0.08)', iconName: 'Network' },
  cryptolab:  { color: '#7c9c83', tint: 'rgba(124,156,131,0.08)', iconName: 'Lock' },
  hybah:      { color: '#d97b6c', tint: 'rgba(217,123,108,0.08)', iconName: 'Coffee' },
};

function Modal({ project, onClose, t, locale }) {
  const a = ACCENTS[project.id] || ACCENTS.graphsense;
  const IconC = Icon[a.iconName];

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
        className="relative w-full max-w-2xl surface overflow-hidden"
        style={{ borderColor: `${a.color}30` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${a.color}, transparent)` }} />

        <div className="p-7 lg:p-8">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-ink-300 hover:text-ink-50 hover:border-white/30 hover:bg-white/5 transition-all"
            aria-label="Fermer"
          >
            <Icon.Close size={16} />
          </button>

          <div className="flex items-start gap-4 mb-6 pr-12">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: a.tint, border: `1px solid ${a.color}25`, color: a.color }}
            >
              <IconC size={24} />
            </div>
            <div>
              <span
                className="text-2xs font-mono tracking-wider px-2.5 py-0.5 rounded-full border mb-2 inline-block"
                style={{ color: a.color, borderColor: `${a.color}30`, background: a.tint }}
              >
                {project.category}
              </span>
              <h3 className="font-display text-2xl lg:text-3xl text-ink-50 leading-tight">
                {project.title}
              </h3>
              <p className="text-sm text-ink-300 mt-1 font-display italic">{pickLocale(project.subtitle, locale)}</p>
            </div>
          </div>

          <p className="text-ink-200 text-[0.95rem] leading-[1.85] mb-6">
            {pickLocale(project.longDescription, locale)}
          </p>

          <div className="mb-6">
            <h4 className="text-2xs font-mono text-ink-400 uppercase tracking-[0.2em] mb-3">
              {t('projects.modal.features')}
            </h4>
            <ul className="space-y-2">
              {(pickLocale(project.highlights, locale) || project.highlights || []).map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-ink-200">
                  <Icon.Check size={16} className="text-gold-500 mt-0.5 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-7">
            <h4 className="text-2xs font-mono text-ink-400 uppercase tracking-[0.2em] mb-3">
              {t('projects.modal.stack')}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {project.tech?.map(t => <span key={t} className="badge">{t}</span>)}
            </div>
          </div>

          {project.github && (
            <a
              href={project.github}
              target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost w-full justify-center"
            >
              <Icon.Github size={16} />
              {t('projects.modal.github')}
              <Icon.ArrowUpRight size={14} />
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Featured (first project, big hero card) ──────────────────────────────── */
function FeaturedCard({ project, onOpen, t, locale }) {
  const a = ACCENTS[project.id] || ACCENTS.graphsense;
  const IconC = Icon[a.iconName];
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className="featured-card p-8 lg:p-10 mb-6"
    >
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">

        {/* Left — info */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xs font-mono text-gold-500 tracking-[0.22em] uppercase">{t('projects.featured')}</span>
            <span
              className="text-2xs font-mono px-2 py-0.5 rounded-full border"
              style={{ color: a.color, borderColor: `${a.color}30`, background: a.tint }}
            >
              {project.category}
            </span>
          </div>

          <h3 className="font-display text-3xl lg:text-4xl text-ink-50 leading-tight mb-2">
            {project.title}
          </h3>
          <p className="text-base font-display italic text-ink-300 mb-5">{pickLocale(project.subtitle, locale)}</p>

          <p className="text-ink-200 leading-[1.85] mb-6 max-w-xl">
            {pickLocale(project.description, locale)}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {project.tech?.slice(0, 6).map(t => <span key={t} className="badge">{t}</span>)}
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => onOpen(project)} className="btn btn-gold py-2.5 px-5 text-xs">
              <Icon.Eye size={14} />
              {t('projects.details')}
            </button>
            {project.github && (
              <a
                href={project.github}
                target="_blank" rel="noopener noreferrer"
                className="btn btn-ghost py-2.5 px-5 text-xs"
              >
                <Icon.Github size={14} />
                {t('projects.source')}
              </a>
            )}
          </div>
        </div>

        {/* Right — large icon visual */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-3xl blur-2xl" style={{ background: `radial-gradient(circle, ${a.color}40, transparent)` }} />
            <div
              className="relative w-44 h-44 lg:w-52 lg:h-52 rounded-3xl flex items-center justify-center backdrop-blur-sm"
              style={{ background: a.tint, border: `1px solid ${a.color}40` }}
            >
              <IconC size={72} className="opacity-80" />
              <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 backdrop-blur-sm" />
              <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/20 backdrop-blur-sm" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Regular card ──────────────────────────────────────────────────────────── */
function Card({ project, index, onOpen, t, locale }) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const a = ACCENTS[project.id] || ACCENTS.graphsense;
  const IconC = Icon[a.iconName];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.13 }}
      onClick={() => onOpen(project)}
      className="project-card flex flex-col group"
    >
      <span className="corner-deco" />

      <div className="p-6 lg:p-7 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
            style={{ background: a.tint, border: `1px solid ${a.color}25`, color: a.color }}
          >
            <IconC size={22} />
          </div>
          <span
            className="text-2xs font-mono tracking-wider px-2.5 py-1 rounded-full border"
            style={{ color: a.color, borderColor: `${a.color}30`, background: a.tint }}
          >
            {project.category}
          </span>
        </div>

        <h3 className="font-display text-xl text-ink-50 leading-tight mb-1 group-hover:text-gold-500 transition-colors">
          {project.title}
        </h3>
        <p className="text-sm font-display italic text-ink-400 mb-3">{pickLocale(project.subtitle, locale)}</p>
        <p className="text-sm text-ink-300 leading-[1.75] mb-5 flex-1 line-clamp-3">
          {pickLocale(project.description, locale)}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tech?.slice(0, 4).map(t => <span key={t} className="badge">{t}</span>)}
          {project.tech?.length > 4 && <span className="badge text-ink-500">+{project.tech.length - 4}</span>}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
          <span className="text-xs text-ink-400 font-mono group-hover:text-gold-500 transition-colors flex items-center gap-1.5">
            {t('projects.details')}
          </span>
          {project.github && (
            <a
              href={project.github}
              target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-ink-300 hover:text-ink-50 hover:border-white/30 transition-all"
              aria-label="GitHub"
            >
              <Icon.Github size={13} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Projects({ projects: initial }) {
  const { t, locale } = useI18n();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const [projects, setProjects] = useState(initial || []);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState('all');

  const categories = ['all', ...new Set((initial || []).map(p => p.category))];

  const handleFilter = async (cat) => {
    setFilter(cat);
    setLoading(true);
    try {
      const url = cat === 'all'
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects?category=${encodeURIComponent(cat)}`;
      const res = await axios.get(url);
      setProjects(res.data.data);
    } catch {
      toast.error('Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  const openProject = async (p) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${p.id}`);
      setSelected(res.data.data);
    } catch {
      setSelected(p);
    }
  };

  // separate featured project from the rest
  const [featured, ...rest] = projects;

  return (
    <>
      <section id="projects" className="bg-ink-950 py-28 lg:py-30">
        <div className="sep mb-0" />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-22">

          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="mb-12 max-w-3xl"
          >
            <div className="eyebrow mb-5">{t('projects.eyebrow')}</div>
            <h2 className="section-title text-balance">
              {t('projects.title1')} <em>{t('projects.titleAccent')}</em>
            </h2>
            <p className="text-ink-300 mt-5 text-base leading-[1.85] max-w-lg">
              {t('projects.subtitle')}
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-2 mb-10"
          >
            <span className="text-2xs font-mono text-ink-500 uppercase tracking-wider mr-2">{t('projects.filter')}</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                  filter === cat
                    ? 'bg-gold-glow border-gold-500/50 text-gold-500'
                    : 'border-white/[0.07] text-ink-300 hover:text-ink-50 hover:border-white/20'
                }`}
              >
                {cat === 'all' ? t('projects.all') : cat}
              </button>
            ))}
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="spinner" /></div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 text-ink-400">{t('projects.empty')}</div>
          ) : (
            <>
              {featured && <FeaturedCard project={featured} onOpen={openProject} t={t} locale={locale} />}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                  {rest.map((p, i) => (
                    <Card key={p.id} project={p} index={i} onOpen={openProject} t={t} locale={locale} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selected && <Modal project={selected} onClose={() => setSelected(null)} t={t} locale={locale} />}
      </AnimatePresence>
    </>
  );
}
