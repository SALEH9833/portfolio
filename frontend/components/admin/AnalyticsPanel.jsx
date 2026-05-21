import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Section } from './AdminUI';
import Icon from '../Icons';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

const fmtDate = (iso) => {
  if (!iso) return '-';
  try { return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return '-'; }
};
const fmtDay = (iso) => {
  if (!iso) return '-';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); }
  catch { return '-'; }
};

// Trim long user-agent strings to readable browser info
const niceUA = (ua) => {
  if (!ua) return '-';
  if (/iPhone|iPad/i.test(ua)) return '📱 iPhone/iPad';
  if (/Android/i.test(ua))     return '📱 Android';
  if (/Macintosh/i.test(ua))   return '💻 Mac';
  if (/Windows/i.test(ua))     return '💻 Windows';
  if (/Linux/i.test(ua))       return '💻 Linux';
  return ua.slice(0, 40) + (ua.length > 40 ? '…' : '');
};

export default function AnalyticsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/track/stats`, { headers: headers() })
      .then(r => setStats(r.data.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading) return <div className="flex justify-center py-10"><div className="spinner" /></div>;
  if (!stats) return <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>Aucune donnée</div>;

  // Max for bar chart scaling
  const maxDay = Math.max(1, ...(stats.by_day || []).map(d => d.unique_visitors));

  const cards = [
    { label: "Aujourd'hui",    value: stats.today,  icon: 'Sparkles', color: 'var(--accent)' },
    { label: '7 derniers jours', value: stats.week,   icon: 'Calendar', color: 'var(--sage)' },
    { label: '30 derniers jours', value: stats.month, icon: 'Clock',    color: 'var(--accent-light)' },
    { label: 'Total visiteurs',   value: stats.total, icon: 'Users',    color: 'var(--accent-dark)' },
  ];

  return (
    <div className="space-y-6">
      <Section
        title="Statistiques visiteurs"
        action={
          <button onClick={load} className="lang-toggle" title="Rafraîchir">
            <Icon.Refresh size={14} />
          </button>
        }
      >
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map(c => {
            const IconC = Icon[c.icon] || Icon.Sparkles;
            return (
              <div key={c.label} className="surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${c.color}15`, color: c.color }}>
                    <IconC size={16} />
                  </div>
                </div>
                <div className="stat-number text-gold-grad">{c.value}</div>
                <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>{c.label}</div>
              </div>
            );
          })}
        </div>

        {/* Bar chart per day */}
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Visiteurs uniques (14 derniers jours)</h3>
          {stats.by_day?.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Pas encore de données</div>
          ) : (
            <div className="flex items-end gap-1 h-32" style={{ borderBottom: '1px solid var(--border)' }}>
              {[...stats.by_day].reverse().map((d, i) => {
                const h = Math.max(4, Math.round((d.unique_visitors / maxDay) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${fmtDay(d.day)}: ${d.unique_visitors} visiteurs uniques (${d.hits} pages vues)`}>
                    <div className="text-2xs font-mono" style={{ color: 'var(--text-faint)' }}>{d.unique_visitors}</div>
                    <div style={{ width: '100%', background: 'var(--accent)', height: `${h}%`, borderRadius: '2px 2px 0 0', minHeight: '4px' }} />
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-between mt-2 text-2xs font-mono" style={{ color: 'var(--text-faint)' }}>
            {[...stats.by_day].reverse().filter((_, i, arr) => i === 0 || i === arr.length - 1 || i === Math.floor(arr.length / 2)).map((d, i) => (
              <span key={i}>{fmtDay(d.day)}</span>
            ))}
          </div>
        </div>
      </Section>

      {/* Top pages */}
      <Section title="Pages les plus visitées (30 derniers jours)">
        {stats.popular?.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Pas encore de pages vues</div>
        ) : (
          <div className="space-y-2">
            {stats.popular.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                <span className="text-xs font-mono truncate" style={{ color: 'var(--text-soft)' }}>{p.path}</span>
                <span className="text-xs font-mono font-bold ms-2 shrink-0" style={{ color: 'var(--accent)' }}>{p.hits} vues</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Recent visits */}
      <Section title="20 dernières visites">
        {stats.recent?.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Pas encore de visite</div>
        ) : (
          <div className="space-y-2">
            {stats.recent.map((v, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text)' }}>{v.path}</span>
                  <span className="text-2xs font-mono" style={{ color: 'var(--text-faint)' }}>{fmtDate(v.visited_at)}</span>
                </div>
                <div className="text-2xs font-mono flex flex-wrap gap-3" style={{ color: 'var(--text-muted)' }}>
                  <span>{niceUA(v.user_agent)}</span>
                  {v.ip && <span>📍 {v.ip}</span>}
                  {v.referer && <span>↩ {(() => { try { return new URL(v.referer).hostname; } catch { return v.referer.slice(0, 30); } })()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
