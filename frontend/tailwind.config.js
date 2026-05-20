/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: 'var(--bg)',
          900: 'var(--surface)',
          850: 'var(--surface-2)',
          800: 'var(--surface-3)',
          750: 'var(--surface-3)',
          700: 'var(--border)',
          600: 'var(--text-dim)',
          500: 'var(--text-faint)',
          400: 'var(--text-muted)',
          300: 'var(--text-muted)',
          200: 'var(--text-soft)',
          100: 'var(--text-soft)',
          50:  'var(--text)',
        },
        gold: {
          50:  'var(--accent-glow)',
          100: 'var(--accent-glow)',
          200: 'var(--accent-light)',
          300: 'var(--accent-light)',
          400: 'var(--accent-light)',
          500: 'var(--accent)',
          600: 'var(--accent)',
          700: 'var(--accent-dark)',
          800: 'var(--accent-dark)',
          glow: 'var(--accent-glow)',
          DEFAULT: 'var(--accent)',
        },
        sage:  'var(--sage)',
        coral: 'var(--coral)',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      maxWidth: { '8xl': '88rem' },
      animation: {
        'fade-up':    'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':    'fadeIn 0.7s ease forwards',
        'shimmer':    'shimmer 2.5s linear infinite',
        'marquee':    'marquee 35s linear infinite',
        'spin-slow':  'spin 14s linear infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: '0', transform: 'translateY(28px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        marquee:   { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
      },
    },
  },
  plugins: [],
};
