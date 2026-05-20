import { Toaster } from 'react-hot-toast';
import { I18nProvider } from '../lib/i18n';
import { ThemeProvider } from '../lib/theme';
import '../styles/globals.css';
import '../styles/cv-templates.css';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <I18nProvider>
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
