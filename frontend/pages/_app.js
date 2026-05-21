import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';
import { I18nProvider } from '../lib/i18n';
import { ThemeProvider } from '../lib/theme';
import '../styles/globals.css';
import '../styles/cv-templates.css';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

function PageTracker() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined' || !API) return;

    const send = (path) => {
      // Skip admin & API pages from tracking
      if (path.startsWith('/admin') || path.startsWith('/api')) return;
      // Use beacon if available (non-blocking, survives page unload)
      try {
        const body = JSON.stringify({ path, referer: document.referrer || '' });
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon(`${API}/api/track`, blob);
        } else {
          fetch(`${API}/api/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
        }
      } catch {}
    };

    // Initial pageview
    send(window.location.pathname);
    // SPA route changes
    const onRouteChange = (url) => send(url.split('?')[0]);
    router.events.on('routeChangeComplete', onRouteChange);
    return () => router.events.off('routeChangeComplete', onRouteChange);
  }, [router.events]);

  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <PageTracker />
        <Analytics />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--text-soft)',
              border: '1px solid var(--border)',
              fontFamily: '"Inter", sans-serif',
              fontSize: '0.875rem',
              borderRadius: '10px',
            },
            success: { iconTheme: { primary: 'var(--sage)',  secondary: 'var(--surface)' } },
            error:   { iconTheme: { primary: 'var(--coral)', secondary: 'var(--surface)' } },
          }}
        />
        <Component {...pageProps} />
      </I18nProvider>
    </ThemeProvider>
  );
}
