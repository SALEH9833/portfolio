import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Icon from './Icons';
import { useI18n } from '../lib/i18n';

const INFO = [
  { label: 'Email',        value: 's.mahahatsaleh0043@uca.ac.ma', href: 'mailto:s.mahahatsaleh0043@uca.ac.ma', icon: 'Mail'  },
  { label: 'Téléphone',    value: '+212 6 46 60 89 11',           href: 'tel:+212646608911',                  icon: 'Phone' },
  { label: 'Localisation', value: 'Safi, Maroc',                  href: null,                                 icon: 'Pin'   },
  { label: 'GitHub',       value: 'github.com/SALEH9833',         href: 'https://github.com/SALEH9833',       icon: 'Github' },
];

const INIT = { name: '', email: '', subject: '', message: '' };
const ERRS = { name: '', email: '', subject: '', message: '' };

function Field({ label, id, error, type = 'text', required, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="block text-2xs font-mono text-ink-400 uppercase tracking-wider mb-2">
        {label}{required && <span className="text-gold-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea id={id} className={`field resize-none ${error ? 'error' : ''}`} rows={5} {...rest} />
      ) : (
        <input id={id} type={type} className={`field ${error ? 'error' : ''}`} {...rest} />
      )}
      {error && (
        <p className="mt-1.5 text-xs text-coral flex items-center gap-1.5">
          <span className="text-sm">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

export default function Contact({ profile }) {
  const { t, locale } = useI18n();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const [form,    setForm]    = useState(INIT);
  const [errors,  setErrors]  = useState(ERRS);
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const validate = () => {
    const e = { ...ERRS };
    let ok = true;
    if (form.name.trim().length < 2)    { e.name    = t('contact.form.errors.min2'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { e.email = t('contact.form.errors.email'); ok = false; }
    if (form.subject.trim().length < 3) { e.subject = t('contact.form.errors.min3'); ok = false; }
    if (form.message.trim().length < 10){ e.message = t('contact.form.errors.min10'); ok = false; }
    setErrors(e);
    return ok;
  };

  const change = (e) => {
    const { name, value } = e.target;
    const max = { name: 100, email: 254, subject: 150, message: 2000 };
    if (value.length <= (max[name] || 500)) {
      setForm(f => ({ ...f, [name]: value }));
      if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact`,
        form,
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      toast.success(res.data.message || 'Message envoyé !');
      setSent(true);
      setForm(INIT);
    } catch (err) {
      if (err.response?.status === 422) {
        const mapped = { ...ERRS };
        (err.response.data.errors || []).forEach(({ field, message }) => {
          if (mapped[field] !== undefined) mapped[field] = message;
        });
        setErrors(mapped);
        toast.error(t('contact.form.errors.validation'));
      } else if (err.response?.status === 429) {
        toast.error(t('contact.form.errors.tooMany'));
      } else {
        toast.error(t('contact.form.errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="bg-ink-950 py-28 lg:py-30">
      <div className="sep mb-0" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-22">

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-18 max-w-2xl mx-auto"
        >
          <div className="eyebrow justify-center mb-5">{t('contact.eyebrow')}</div>
          <h2 className="section-title text-balance">
            {t('contact.titleFull1')} <em>{t('contact.titleAccent')}</em><br />
            {t('contact.titleFull2')}
          </h2>
          {(() => {
            const tagline = profile?.tagline && typeof profile.tagline === 'object'
              ? (profile.tagline[locale] || profile.tagline.fr || profile.tagline.en || '')
              : (typeof profile?.tagline === 'string' ? profile.tagline : '');
            const text = tagline || t('contact.subtitle');
            if (!text || text.trim() === '-' || text.trim() === '') return null;
            return (
              <p className="text-ink-300 mt-5 text-base leading-[1.85]">
                {text}
              </p>
            );
          })()}
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 max-w-5xl mx-auto">

          {/* Info column */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="surface p-6 lg:p-7">
              <h3 className="font-display text-xl text-ink-50 mb-1">Saleh Mahamat Saleh</h3>
              <p className="text-sm text-ink-300 leading-relaxed mb-6 italic font-display">
                {t('contact.quote')}
              </p>
              <div className="space-y-4">
                {INFO.map(item => {
                  const IconC = Icon[item.icon];
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gold-glow border border-gold-500/15 flex items-center justify-center text-gold-500 shrink-0">
                        <IconC size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-2xs font-mono text-ink-500 uppercase tracking-wider mb-0.5">{item.label}</div>
                        {item.href ? (
                          <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                             className="text-sm text-ink-100 hover:text-gold-500 transition-colors truncate block">
                            {item.value}
                          </a>
                        ) : (
                          <div className="text-sm text-ink-100">{item.value}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {profile?.whatsapp && (() => {
                const num = String(profile.whatsapp).replace(/[^\d+]/g, '');
                const waNum = num.startsWith('+') ? num.slice(1) : num;
                const msg = encodeURIComponent(locale === 'en' ? 'Hi Saleh, I saw your portfolio and would like to talk.' : locale === 'ar' ? 'مرحباً صالح، رأيت ملفك وأودّ التحدث معك.' : 'Bonjour Saleh, j\'ai vu votre portfolio et j\'aimerais échanger avec vous.');
                return (
                  <a
                    href={`https://wa.me/${waNum}?text=${msg}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-5 w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-[1.02]"
                    style={{ background: '#25D366', color: 'white', boxShadow: '0 4px 16px rgba(37, 211, 102, 0.3)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                    </svg>
                    {locale === 'en' ? 'Chat on WhatsApp' : locale === 'ar' ? 'تواصل عبر واتساب' : 'Discuter sur WhatsApp'}
                  </a>
                );
              })()}
            </div>

            <div className="surface p-4 flex items-center gap-3">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-sage/30 animate-ping" />
                <span className="relative block w-2 h-2 rounded-full bg-sage" />
              </div>
              <div>
                <div className="text-sm font-medium text-ink-50">{t('contact.available')}</div>
                <div className="text-xs text-ink-400">{t('contact.availableSub')}</div>
              </div>
            </div>
          </motion.div>

          {/* Form column */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.18 }}
            className="lg:col-span-3"
          >
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
                className="surface p-10 lg:p-12 text-center flex flex-col items-center gap-5 h-full justify-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-sage to-sage/60 flex items-center justify-center text-ink-950 shadow-[0_0_30px_rgba(124,156,131,0.4)]"
                >
                  <Icon.Check size={26} strokeWidth={2.5} />
                </motion.div>
                <h3 className="font-display text-3xl text-ink-50">{t('contact.form.sent')}</h3>
                <p className="text-ink-300 max-w-xs leading-relaxed">
                  {t('contact.form.sentSub')} <span className="text-gold-500 font-semibold">{t('contact.form.hours')}</span>
                </p>
                <button onClick={() => setSent(false)} className="btn btn-ghost text-xs mt-3">
                  <Icon.Send size={14} /> {t('contact.form.another')}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={submit} noValidate className="surface p-7 lg:p-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label={t('contact.form.name')} id="name" name="name" value={form.name} onChange={change}
                         placeholder={t('contact.form.placeholderName')} error={errors.name} autoComplete="name" required />
                  <Field label={t('contact.form.email')} id="email" name="email" type="email" value={form.email} onChange={change}
                         placeholder={t('contact.form.placeholderEmail')} error={errors.email} autoComplete="email" required />
                </div>
                <Field label={t('contact.form.subject')} id="subject" name="subject" value={form.subject} onChange={change}
                       placeholder={t('contact.form.placeholderSubject')} error={errors.subject} required />
                <div>
                  <Field label={t('contact.form.message')} id="message" name="message" type="textarea" value={form.message} onChange={change}
                         placeholder={t('contact.form.placeholderMessage')} error={errors.message} required />
                  <div className="text-right mt-1.5">
                    <span className="text-2xs font-mono text-ink-500">{form.message.length} / 2000</span>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-gold w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <><div className="spinner" /> {t('contact.form.sending')}</>
                  ) : (
                    <>
                      <Icon.Send size={15} />
                      {t('contact.form.send')}
                    </>
                  )}
                </button>

                <p className="text-center text-2xs font-mono text-ink-500">
                  {t('contact.form.secure')}
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
