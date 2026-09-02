/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563EB',
          hover: '#1D4ED8',
          navy: '#0F172A',
          slate: '#64748B',
          bg: '#FFFFFF',
          alt: '#F8FAFC',
        },
        df: {
          cream: '#F7F4EE',
          primary: '#b8462f',
          'primary-dark': '#9c3520',
          black: '#221F1C',
          muted: '#746E62',
          border: '#E4DFD4',
          surface: '#fff8f6',
          'surface-warm': '#ffe9e5',
        },
      },
      fontFamily: {
        garamond: ['"EB Garamond"', 'Georgia', 'serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
