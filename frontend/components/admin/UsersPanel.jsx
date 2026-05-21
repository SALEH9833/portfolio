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

export default function UsersPanel() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all'); // all | verified | unverified
  const [search, setSearch]   = useState('');

  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/admin/users`, { headers: headers() })
      .then(r => setUsers(r.data.data || []))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const del = async (u) => {
    if (!confirm(`Supprimer le compte de ${u.email} ?\nCette action est irréversible.`)) return;
    try {
      await axios.delete(`${API}/api/admin/users/${u.id}`, { headers: headers() });
      toast.success('Compte supprimé');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de suppression');
    }
  };

  const filtered = users.filter(u => {
    if (filter === 'verified' && !u.email_verified) return false;
    if (filter === 'unverified' && u.email_verified) return false;
    if (search && !u.email.toLowerCase().includes(search.toLowerCase()) && !(u.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-10"><div className="spinner" /></div>;

  const stats = {
    total:      users.length,
    verified:   users.filter(u => u.email_verified).length,
    unverified: users.filter(u => !u.email_verified).length,
  };

  return (
    <Section
      title={`Utilisateurs inscrits (${stats.total})`}
      action={
        <button onClick={load} className="lang-toggle" title="Rafraîchir">
          <Icon.Refresh size={14} />
        </button>
      }
    >
      {/* Mini-stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="surface p-3 text-center">
          <div className="text-2xl font-display" style={{ color: 'var(--accent)' }}>{stats.total}</div>
          <div className="text-2xs font-mono uppercase mt-1" style={{ color: 'var(--text-muted)' }}>Total</div>
        </div>
        <div className="surface p-3 text-center">
          <div className="text-2xl font-display" style={{ color: 'var(--sage)' }}>{stats.verified}</div>
          <div className="text-2xs font-mono uppercase mt-1" style={{ color: 'var(--text-muted)' }}>Vérifiés</div>
        </div>
        <div className="surface p-3 text-center">
          <div className="text-2xl font-display" style={{ color: 'var(--coral)' }}>{stats.unverified}</div>
          <div className="text-2xs font-mono uppercase mt-1" style={{ color: 'var(--text-muted)' }}>Non vérifiés</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (email ou nom)..."
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm"
          style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />
        {[
          { id: 'all',        label: `Tous (${stats.total})` },
          { id: 'verified',   label: `Vérifiés (${stats.verified})` },
          { id: 'unverified', label: `Non vérifiés (${stats.unverified})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-3 py-2 rounded-lg text-xs"
            style={{
              background: filter === f.id ? 'var(--accent)' : 'var(--surface-2)',
              color: filter === f.id ? 'var(--bg)' : 'var(--text)',
              border: '1px solid var(--border)',
              fontWeight: filter === f.id ? 600 : 400,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Users list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
          {users.length === 0 ? 'Aucun utilisateur inscrit pour le moment.' : 'Aucun résultat avec ces filtres.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div
              key={u.id}
              className="p-3 rounded-lg flex flex-wrap items-center justify-between gap-3"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                    {u.name || u.email.split('@')[0]}
                  </span>
                  {u.email_verified ? (
                    <span className="text-2xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(167,195,165,0.15)', color: 'var(--sage)' }}>
                      <Icon.Check size={10} /> Vérifié
                    </span>
                  ) : (
                    <span className="text-2xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(255,127,80,0.15)', color: 'var(--coral)' }}>
                      <Icon.Clock size={10} /> En attente
                    </span>
                  )}
                </div>
                <a href={`mailto:${u.email}`} className="text-xs font-mono" style={{ color: 'var(--accent)' }}>
                  {u.email}
                </a>
                <div className="text-2xs font-mono mt-1" style={{ color: 'var(--text-faint)' }}>
                  Inscrit : {fmtDate(u.created_at)} {u.last_login && `· Dernière connexion : ${fmtDate(u.last_login)}`}
                </div>
              </div>
              <button
                onClick={() => del(u)}
                className="lang-toggle"
                style={{ color: 'var(--coral)' }}
                title="Supprimer ce compte"
                aria-label="Supprimer"
              >
                <Icon.Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
