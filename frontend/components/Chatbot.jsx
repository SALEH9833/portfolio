import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Icon from './Icons';
import { useI18n } from '../lib/i18n';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

function MarkdownLite({ text }) {
  if (!text) return null;
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--surface-3);padding:1px 4px;border-radius:3px;font-size:0.92em">$1</code>')
    .replace(/\n/g, '<br/>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function Chatbot() {
  const { locale } = useI18n();
  const [open, setOpen]               = useState(false);
  const [history, setHistory]         = useState([]);   // [{role:'user'|'assistant', text, toolsUsed?}]
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [hasSeen, setHasSeen]         = useState(false);
  const scrollRef = useRef(null);
  const inputRef  = useRef(null);

  const labels = {
    fr: { open: 'Discuter avec l\'assistant', placeholder: 'Posez votre question...', send: 'Envoyer', subtitle: 'Assistant IA · Powered by Claude', online: 'En ligne', clear: 'Nouvelle conversation' },
    en: { open: 'Chat with assistant',         placeholder: 'Ask your question...',    send: 'Send',    subtitle: 'AI assistant · Powered by Claude',  online: 'Online', clear: 'New conversation' },
    ar: { open: 'تحدث مع المساعد',            placeholder: 'اطرح سؤالك...',           send: 'إرسال',   subtitle: 'مساعد ذكاء اصطناعي · Claude',         online: 'متصل', clear: 'محادثة جديدة' },
  }[locale] || { open: 'Chat', placeholder: 'Ask...', send: 'Send', subtitle: 'AI', online: 'Online', clear: 'New' };

  // Reset conversation on language change
  useEffect(() => {
    setHistory([]);
    setSuggestions([]);
  }, [locale]);

  // Greeting on open
  useEffect(() => {
    if (open && history.length === 0) {
      axios.get(`${API}/api/chatbot/suggestions?locale=${locale}`).then(res => {
        setHistory([{ role: 'assistant', text: res.data.greeting }]);
        setSuggestions(res.data.suggestions || []);
      }).catch(() => {
        setHistory([{ role: 'assistant', text: 'Bonjour ! Comment puis-je vous aider ?' }]);
      });
    }
  }, [open, locale]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => { if (!hasSeen && !open) setHasSeen(true); }, 4000);
    return () => clearTimeout(t);
  }, [hasSeen, open]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setSuggestions([]);
    const newHistory = [...history, { role: 'user', text: msg }];
    setHistory(newHistory);
    setLoading(true);

    try {
      // Send only the conversation turns (skip the initial greeting if it's the first assistant msg)
      const apiMessages = newHistory
        .filter((m, i) => !(i === 0 && m.role === 'assistant')) // strip greeting
        .map(m => ({ role: m.role, content: m.text }));

      const res = await axios.post(
        `${API}/api/chatbot`,
        { messages: apiMessages, locale },
        { timeout: 60000 }
      );
      setHistory(h => [...h, { role: 'assistant', text: res.data.text, toolsUsed: res.data.toolsUsed }]);
      if (res.data.suggestions) setSuggestions(res.data.suggestions);
    } catch (err) {
      const msg = err.response?.data?.error || 'Connexion perdue. Réessaye.';
      setHistory(h => [...h, { role: 'assistant', text: `⚠ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setHistory([]);
    setSuggestions([]);
    setTimeout(() => {
      axios.get(`${API}/api/chatbot/suggestions?locale=${locale}`).then(res => {
        setHistory([{ role: 'assistant', text: res.data.greeting }]);
        setSuggestions(res.data.suggestions || []);
      });
    }, 100);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            onClick={() => setOpen(true)}
            aria-label={labels.open}
            className="fixed bottom-6 end-6 z-40 w-14 h-14 rounded-full flex items-center justify-center group"
            style={{
              background: 'linear-gradient(135deg, var(--accent-light), var(--accent) 50%, var(--accent-dark))',
              boxShadow: '0 8px 28px rgba(200,169,110,0.45)',
              color: 'var(--bg)',
            }}
          >
            <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </motion.div>
            {!hasSeen && (
              <span className="absolute -top-1 -end-1 w-3.5 h-3.5 bg-coral rounded-full border-2 animate-pulse" style={{ borderColor: 'var(--bg)' }} />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 end-6 z-40 w-[calc(100vw-3rem)] sm:w-[400px] h-[calc(100vh-3rem)] sm:h-[600px] max-h-[680px] rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-hover)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-glow)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M12 2C6.5 2 2 5.5 2 10c0 2 1 4 3 5l-1 3 4-2c1 .5 2.5.5 4 .5 5.5 0 10-3.5 10-8s-4.5-8-10-8z" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
                  </div>
                  <span className="absolute bottom-0 end-0 w-2.5 h-2.5 rounded-full border-2 bg-sage animate-pulse" style={{ borderColor: 'var(--surface)' }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Saleh Assistant</div>
                  <div className="text-2xs font-mono flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                    {labels.online}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={clearChat} aria-label={labels.clear} className="lang-toggle" title={labels.clear}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/>
                  </svg>
                </button>
                <button onClick={() => setOpen(false)} aria-label="Fermer" className="lang-toggle">
                  <Icon.Close size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[88%]">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                      style={
                        m.role === 'user'
                          ? { background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: 'var(--bg)' }
                          : { background: 'var(--surface-2)', color: 'var(--text-soft)', border: '1px solid var(--border)' }
                      }
                    >
                      <MarkdownLite text={m.text} />
                    </div>
                    {m.toolsUsed && m.toolsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5 ms-1">
                        {m.toolsUsed.map((t, j) => (
                          <span key={j} className="text-2xs px-2 py-0.5 rounded-full font-mono"
                            style={{
                              background: t.success ? 'rgba(167, 195, 165, 0.15)' : 'rgba(228, 124, 105, 0.15)',
                              color: t.success ? 'var(--sage)' : 'var(--coral)',
                              border: `1px solid ${t.success ? 'var(--sage)' : 'var(--coral)'}`,
                            }}>
                            {t.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && !loading && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105"
                    style={{ borderColor: 'var(--border-hover)', color: 'var(--accent)', background: 'var(--accent-glow)' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder={labels.placeholder}
                maxLength={1000}
                disabled={loading}
                className="flex-1 px-3.5 py-2.5 rounded-full text-sm outline-none border disabled:opacity-50"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                aria-label={labels.send}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: 'var(--bg)' }}>
                <Icon.Send size={15} />
              </button>
            </div>

            <div className="text-center text-2xs py-2 font-mono" style={{ color: 'var(--text-faint)', background: 'var(--surface-2)' }}>
              {labels.subtitle}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
