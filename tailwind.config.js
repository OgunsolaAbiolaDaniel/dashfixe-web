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
          blue: '#2563EB',      // Primary CTA Blue
          hover: '#1D4ED8',     // Hover state blue
          navy: '#0F172A',      // Headlines
          slate: '#64748B',     // Body text
          bg: '#FFFFFF',        // Background
          alt: '#F8FAFC',       // Section background
        }
      }
    },
  },
  plugins: [],
}






