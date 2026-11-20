import { useI18n } from '../lib/i18n';

export default function Stats() {
  const { t } = useI18n();

  const STATS = [
    { value: 3, suffix: '+', label: t('stats.projects'),     sub: t('stats.projectsSub'),     icon: 'Layers' },
    { value: 7, suffix: '',  label: t('stats.languages'),    sub: t('stats.languagesSub'),    icon: 'Code'   },
    { value: 1, suffix: '',  label: t('stats.certification'), sub: t('stats.certificationSub') },
    { value: 3, suffix: '',  label: t('stats.spoken'),       sub: t('stats.spokenSub'),       icon: 'Globe'  },
  ];

  return (
    <section style={{ background: 'var(--bg)' }}>
      <dl className="max-w-5xl mx-auto px-6 lg:px-8 py-12 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
        {STATS.map((s) => (
          <div key={s.label}>
            <dt className="text-sm font-medium" style={{ color: 'var(--text-soft)' }}>{s.label}</dt>
            <dd className="stat-number mt-1">{s.value}{s.suffix}</dd>
            <dd className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>{s.sub}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
