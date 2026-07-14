/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          lighter: 'rgb(var(--color-primary-lighter) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          page: 'rgb(var(--color-surface-page) / <alpha-value>)',
          hover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
          blue: 'rgb(var(--color-surface-blue) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          focus: 'rgb(var(--color-border-focus) / <alpha-value>)',
        },
        success: { DEFAULT: '#2E7D32', light: '#E8F5E9', text: '#1B5E20' },
        error: { DEFAULT: '#C62828', light: '#FFEBEE', text: '#B71C1C' },
        warning: { DEFAULT: '#E65100', light: '#FFF3E0', text: '#BF360C' },
      },
      fontFamily: { sans: ['DM Sans', 'sans-serif'] },
      borderRadius: { card: '12px', modal: '16px', btn: '8px' },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.08)',
        hover: '0 4px 16px rgba(21,101,192,0.15)',
        modal: '0 8px 32px rgba(0,0,0,0.18)',
        focus: '0 0 0 3px rgba(21,101,192,0.18)',
      },
      keyframes: {
        scroll: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        fadeIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        toastIn: { from: { opacity: 0, transform: 'translateX(-50%) translateY(16px)' }, to: { opacity: 1, transform: 'translateX(-50%) translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
      },
      animation: {
        scroll: 'scroll 30s linear infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.25s ease-out',
        toastIn: 'toastIn 0.3s ease-out',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
