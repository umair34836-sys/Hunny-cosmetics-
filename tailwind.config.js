/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', 'Fira Sans', 'system-ui', 'sans-serif'],
        ur: ['"Noto Nastaliq Urdu"', 'serif'],
      },
      colors: {
        // Base dashboard chrome — Flat Design system (slate)
        surface: {
          DEFAULT: '#F8FAFC',
          card: '#FFFFFF',
          muted: '#F2F3F4',
          border: '#E6E8EA',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#475569',
          soft: '#64748B',
        },
        // Brand accent — Beauty/Spa rose + lavender
        brand: {
          50: '#FDF2F8',
          100: '#FBCFE8',
          300: '#F9A8D4',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
          900: '#831843',
        },
        accent: {
          DEFAULT: '#8B5CF6',
        },
        // Semantic status colors
        success: {
          DEFAULT: '#059669',
          bg: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FFFBEB',
        },
        danger: {
          DEFAULT: '#DC2626',
          bg: '#FEF2F2',
        },
      },
      borderRadius: {
        xl: '0.875rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
      },
    },
  },
  plugins: [],
}
