/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand maroon scale
        maroon: {
          DEFAULT: '#6f0e13',
          dark: '#58090d',
          50: '#fcefee',
          100: '#f8dcda',
          200: '#f0b9b6',
          light: '#fcefee',
        },
        // Brand gold — bright for accents on dark, darker for text on light
        gold: {
          DEFAULT: '#f1c53e',
          soft: '#f7e29a',
          dark: '#9a7b16',
        },
        paper: '#f6f5f2',
        ink: '#1c1b1a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(28 27 26 / 0.04), 0 1px 3px 0 rgb(28 27 26 / 0.03)',
        'card-hover': '0 6px 20px -6px rgb(28 27 26 / 0.12), 0 2px 6px -2px rgb(28 27 26 / 0.06)',
        sidebar: '1px 0 0 0 rgb(28 27 26 / 0.06)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
