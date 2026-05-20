import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../Icons';

export const LOCALE_TABS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'ar', label: 'العربية',   flag: '🇸🇦' },
];

export function TextField({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}{required && <span className="ms-1" style={{ color: 'var(--accent)' }}>*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          className="field resize-none"
          rows={3}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          className="field"
          value={value ?? ''}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

export function I18nField({ label, value, onChange, type = 'text', required }) {
  const [tab, setTab] = useState('fr');
  const val = value && typeof value === 'object' ? value : {};

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-2xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}{required && <span className="ms-1" style={{ color: 'var(--accent)' }}>*</span>}
        </label>
        <div className="flex gap-1">
          {LOCALE_TABS.map(t => (
            <button
              key={t.code}
              type="button"
              onClick={() => setTab(t.code)}
              className={`px-2 py-0.5 rounded-md text-2xs font-mono transition-all ${tab === t.code ? '' : 'opacity-50'}`}
              style={{
                background: tab === t.code ? 'var(--accent-glow)' : 'transparent',
                color: tab === t.code ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${tab === t.code ? 'var(--border-hover)' : 'var(--border)'}`,
              }}
            >
              {t.flag} {t.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {type === 'textarea' ? (
        <textarea
          className="field resize-none"
          rows={3}
          value={val[tab] ?? ''}
          dir={tab === 'ar' ? 'rtl' : 'ltr'}
          onChange={(e) => onChange({ ...val, [tab]: e.target.value })}
          placeholder={`${tab.toUpperCase()}...`}
        />
      ) : (
        <input
          className="field"
          value={val[tab] ?? ''}
          dir={tab === 'ar' ? 'rtl' : 'ltr'}
          onChange={(e) => onChange({ ...val, [tab]: e.target.value })}
          placeholder={`${tab.toUpperCase()}...`}
        />
      )}
    </div>
  );
}

export function I18nArrayField({ label, value, onChange }) {
  const [tab, setTab] = useState('fr');
  const val = value && typeof value === 'object' && !Array.isArray(value) ? value : { fr: Array.isArray(value) ? value : [], en: [], ar: [] };
  const list = Array.isArray(val[tab]) ? val[tab] : [];

  const update = (newList) => onChange({ ...val, [tab]: newList });

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-2xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</label>
        <div className="flex gap-1">
          {LOCALE_TABS.map(t => (
            <button key={t.code} type="button" onClick={() => setTab(t.code)}
              className={`px-2 py-0.5 rounded-md text-2xs font-mono transition-all ${tab === t.code ? '' : 'opacity-50'}`}
              style={{
                background: tab === t.code ? 'var(--accent-glow)' : 'transparent',
                color: tab === t.code ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${tab === t.code ? 'var(--border-hover)' : 'var(--border)'}`,
              }}>
              {t.flag} {t.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {list.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="field flex-1"
              value={item}
              dir={tab === 'ar' ? 'rtl' : 'ltr'}
              onChange={(e) => {
                const next = [...list]; next[i] = e.target.value;
                update(next);
              }}
            />
            <button
              type="button"
              onClick={() => update(list.filter((_, j) => j !== i))}
              className="lang-toggle shrink-0"
              style={{ color: 'var(--coral)' }}
              aria-label="Supprimer"
            >
              <Icon.Close size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update([...list, ''])}
          className="btn btn-ghost py-1.5 px-3 text-xs"
        >
          + Ajouter une ligne
        </button>
      </div>
    </div>
  );
}

export function ArrayField({ label, value, onChange, placeholder }) {
  const list = Array.isArray(value) ? value : [];
  return (
    <div>
      <label className="block text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <div className="space-y-2">
        {list.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="field flex-1"
              value={item}
              placeholder={placeholder}
              onChange={(e) => { const next = [...list]; next[i] = e.target.value; onChange(next); }}
            />
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))}
              className="lang-toggle shrink-0" style={{ color: 'var(--coral)' }} aria-label="Supprimer">
              <Icon.Close size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...list, ''])} className="btn btn-ghost py-1.5 px-3 text-xs">
          + Ajouter
        </button>
      </div>
    </div>
  );
}

export function CheckField({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full transition-colors"
        style={{ background: value ? 'var(--accent)' : 'var(--border)' }}
        role="switch"
        aria-checked={value}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            background: 'white',
            transform: value ? 'translateX(20px)' : 'translateX(2px)',
          }}
        />
      </button>
      <span className="text-sm" style={{ color: 'var(--text-soft)' }}>{label}</span>
    </label>
  );
}

export function Modal({ title, onClose, children, size = 'md' }) {
  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' };
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, scale: 0.96, opacity: 0 }}
        animate={{ y: 0,  scale: 1,   opacity: 1 }}
        exit={{    y: 24, scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={e => e.stopPropagation()}
        className={`relative w-full ${widths[size]} max-h-[90vh] flex flex-col rounded-2xl overflow-hidden`}
        style={{ background: 'var(--surface)', border: '1px solid var(--border-hover)' }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-display text-xl" style={{ color: 'var(--text)' }}>{title}</h3>
          <button onClick={onClose} className="lang-toggle"><Icon.Close size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

export function Confirm({ title, message, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="btn btn-ghost py-2 px-5 text-sm">Annuler</button>
        <button
          onClick={onConfirm}
          className="btn py-2 px-5 text-sm"
          style={{ background: 'var(--coral)', color: 'white' }}
        >
          Supprimer
        </button>
      </div>
    </Modal>
  );
}

export const Section = ({ title, action, children }) => (
  <div className="surface p-6 lg:p-7 mb-6">
    <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
      <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>{title}</h2>
      {action}
    </div>
    {children}
  </div>
);
