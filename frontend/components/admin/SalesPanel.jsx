import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Section } from './AdminUI';
import Icon from '../Icons';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

export default function SalesPanel() {
  const [data, setData]       = useState([]);
  const [stats, setStats]     = useState(null);
  const [mode, setMode]       = useState('all');     // all | live | sandbox
  const [paypalMode, setPpM]  = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('completed'); // all | completed | pending

  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/payments/admin/purchases`, { headers: headers() })
      .then((r) => {
        setData(r.data.data || []);
        setStats(r.data.stats || null);
        setPpM(r.data.paypal_mode || '');
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    return data.filter((d) => filter === 'all' || d.status === filter);
  }, [data, filter]);

  const exportCSV = () => {
    const headers = ['id', 'date', 'status', 'template', 'amount', 'currency', 'payer_name', 'payer_email', 'paypal_order_id', 'canva_url'];
    const csvRows = [headers.join(',')];
    for (const r of filtered) {
      csvRows.push([
        r.id,
        new Date(r.created_at).toISOString(),
        r.status,
        `"${(r.template_name || '').replace(/"/g, '""')}"`,
        Number(r.amount || 0).toFixed(2),
        r.currency || 'EUR',
        `"${(r.payer_name || '').replace(/"/g, '""')}"`,
        r.payer_email || '',
        r.paypal_order_id || '',
        r.canva_edit_url || '',
      ].join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ventes-cv-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exporté ✓');
  };

  if (loading) {
    return <div className="flex justify-center py-10"><div className="spinner" /></div>;
  }

  const fmtPrice = (v, c = 'EUR') => `${Number(v || 0).toFixed(2)} ${c}`;

  const cards = [
    { label: 'Revenu total',  value: fmtPrice(stats?.revenue || 0), icon: 'Sparkles', color: 'var(--accent)' },
    { label: 'Ventes valid.', value: stats?.completed || 0,         icon: 'Check',    color: 'var(--sage)' },
    { label: 'En attente',    value: stats?.pending || 0,           icon: 'Clock',    color: 'var(--accent-light)' },
    { label: 'Mode PayPal',   value: (paypalMode || '-').toUpperCase(), icon: 'Globe', color: paypalMode === 'live' ? 'var(--sage)' : 'var(--coral)' },
  ];

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => {
          const IconC = Icon[c.icon] || Icon.Sparkles;
          return (
            <div key={c.label} className="surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${c.color}15`, color: c.color }}>
                  <IconC size={16} />
                </div>
              </div>
              <div className="stat-number text-gold-grad" style={{ fontSize: '1.6rem' }}>{c.value}</div>
              <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>{c.label}</div>
            </div>
          );
        })}
      </div>

      <Section
        title={`Ventes (${filtered.length})`}
        action={
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="field text-xs py-1.5"
              style={{ width: 'auto' }}
            >
              <option value="completed">✓ Validées</option>
              <option value="pending">⏳ En attente</option>
              <option value="all">Tout</option>
            </select>
            <button onClick={exportCSV} className="btn btn-ghost py-2 px-3 text-xs" disabled={!filtered.length}>
              ⬇ CSV
            </button>
            <button onClick={load} className="btn btn-ghost py-2 px-3 text-xs">↻</button>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            {filter === 'completed' ? 'Aucune vente validée pour le moment.' : 'Aucune entrée pour ce filtre.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-2 px-2 text-2xs font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Date</th>
                  <th className="text-left py-2 px-2 text-2xs font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Template</th>
                  <th className="text-left py-2 px-2 text-2xs font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Acheteur</th>
                  <th className="text-right py-2 px-2 text-2xs font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Montant</th>
                  <th className="text-center py-2 px-2 text-2xs font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Statut</th>
                  <th className="text-center py-2 px-2 text-2xs font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Lien</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2.5 px-2 whitespace-nowrap text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}<br/>
                      <span className="text-2xs">{new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.template_name}</div>
                      <div className="text-2xs font-mono" style={{ color: 'var(--text-muted)' }}>#{r.paypal_order_id?.slice(-8)}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      {r.payer_name && <div className="text-sm" style={{ color: 'var(--text)' }}>{r.payer_name}</div>}
                      {r.payer_email && (
                        <a href={`mailto:${r.payer_email}`} className="text-xs" style={{ color: 'var(--accent)' }}>
                          {r.payer_email}
                        </a>
                      )}
                      {!r.payer_email && <span className="text-2xs" style={{ color: 'var(--text-faint)' }}>Invité</span>}
                    </td>
                    <td className="py-2.5 px-2 text-right whitespace-nowrap font-semibold" style={{ color: 'var(--text)' }}>
                      {fmtPrice(r.amount, r.currency)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {r.canva_edit_url ? (
                        <a href={r.canva_edit_url} target="_blank" rel="noopener noreferrer"
                          className="text-2xs font-mono px-2 py-1 rounded"
                          style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                          ↗ Canva
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {paypalMode !== 'live' && (
        <Section title="Configuration">
          <div className="p-4 rounded-lg" style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-hover)', color: 'var(--text-soft)' }}>
            <div className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>⚠ Mode test (sandbox)</div>
            <p className="text-sm leading-relaxed">
              PayPal tourne actuellement en mode <strong>{paypalMode || 'non configuré'}</strong>. Pour encaisser de l'argent réel,
              configure <code style={{ color: 'var(--accent)' }}>PAYPAL_MODE=live</code> dans <code style={{ color: 'var(--accent)' }}>backend/.env</code>
              avec des clés Live du Developer Dashboard.
            </p>
          </div>
        </Section>
      )}
    </>
  );
}

function StatusBadge({ status }) {
  const styles = {
    completed: { bg: 'rgba(167, 195, 165, 0.2)', color: 'var(--sage)',  label: '✓ Validé' },
    pending:   { bg: 'rgba(200, 169, 110, 0.2)', color: 'var(--accent)', label: '⏳ En attente' },
    failed:    { bg: 'rgba(228, 124, 105, 0.2)', color: 'var(--coral)', label: '✗ Échec' },
  }[status] || { bg: 'var(--surface-2)', color: 'var(--text-muted)', label: status };
  return (
    <span className="text-2xs font-mono px-2 py-1 rounded-full whitespace-nowrap"
      style={{ background: styles.bg, color: styles.color }}>
      {styles.label}
    </span>
  );
}
