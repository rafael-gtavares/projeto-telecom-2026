/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1565C0', dark: '#0D47A1', light: '#1976D2', lighter: '#42A5F5' },
        surface: { DEFAULT: '#FFFFFF', page: '#F5F7FA', hover: '#E3F0FF', blue: '#EBF2FF' },
        text: { primary: '#1A1A2E', secondary: '#5C6880', muted: '#9EA8B8' },
        border: { DEFAULT: '#DDE3EE', focus: '#1565C0' },
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
      },
      animation: {
        scroll: 'scroll 30s linear infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.25s ease-out',
        toastIn: 'toastIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
