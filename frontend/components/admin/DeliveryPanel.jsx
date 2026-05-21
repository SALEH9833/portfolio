import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Section, TextField } from './AdminUI';
import Icon from '../Icons';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

export default function DeliveryPanel() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);

  // Form fields
  const [templateId, setTemplateId] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerName,  setBuyerName]  = useState('');
  const [paypalAmount, setAmount]   = useState('');

  useEffect(() => {
    axios.get(`${API}/api/admin/entities/cv_templates`, { headers: headers() })
      .then(r => {
        // Only Premium templates with edit_url can be delivered
        const list = (r.data.data || []).filter(t => t.is_premium && t.edit_url);
        setTemplates(list);
      })
      .catch(() => toast.error('Erreur de chargement des modèles'))
      .finally(() => setLoading(false));
  }, []);

  const selectedTpl = templates.find(t => String(t.id) === String(templateId));

  const send = async (e) => {
    e?.preventDefault();
    if (!templateId || !buyerEmail) return toast.error('Choisis un modèle et entre un email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) return toast.error('Email invalide');

    setSending(true);
    try {
      const res = await axios.post(`${API}/api/admin/deliver-template`,
        { templateId: Number(templateId), buyerEmail: buyerEmail.trim(), buyerName: buyerName.trim(), paypalAmount: paypalAmount ? Number(paypalAmount) : undefined },
        { headers: headers() }
      );
      toast.success(res.data.message || 'Email envoyé ✓');
      // Reset form (keep template selected so admin can deliver to multiple buyers)
      setBuyerEmail('');
      setBuyerName('');
      setAmount('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Échec d\'envoi');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><div className="spinner" /></div>;

  return (
    <Section title="Livraison manuelle d'un modèle CV">
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
        Quand un client te paie sur PayPal.me, utilise ce formulaire pour lui envoyer le lien Canva par email automatiquement.
        L'email est envoyé depuis <strong>noreply@salehmahamatsaleh.com</strong> via Brevo.
      </p>

      <form onSubmit={send} className="space-y-4">
        {/* Template selector */}
        <div>
          <div className="text-2xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Modèle acheté <span style={{ color: 'var(--coral)' }}>*</span>
          </div>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg"
            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            <option value="">— Sélectionne un modèle —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.price}€ ({t.category || 'Premium'})
              </option>
            ))}
          </select>
          {selectedTpl && (
            <div className="text-2xs font-mono mt-2 p-2 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}>
              🔗 {selectedTpl.edit_url}
            </div>
          )}
        </div>

        <TextField label="Email du client" type="email" value={buyerEmail} onChange={setBuyerEmail} required placeholder="client@example.com" />
        <TextField label="Prénom du client (optionnel)" value={buyerName} onChange={setBuyerName} placeholder="Marie" />
        <TextField label="Montant payé (optionnel, pour les stats)" type="number" value={paypalAmount} onChange={setAmount} placeholder={selectedTpl?.price || ''} />

        <button
          type="submit"
          disabled={sending || !templateId || !buyerEmail}
          className="btn btn-gold w-full py-3 text-sm"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {sending ? <><div className="spinner" /> Envoi en cours...</> : <><Icon.Send size={14} /> Envoyer le lien Canva au client</>}
        </button>
      </form>

      <div className="mt-6 p-3 rounded-lg text-xs leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
        💡 La vente est automatiquement enregistrée dans l'onglet <strong>Ventes</strong> après envoi.
      </div>
    </Section>
  );
}
