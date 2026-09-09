/** @type {import('tailwindcss').Config} */
// Tokens are generated from designs/Dashfixe Design System - Web.dc.html
// and designs/Dashfixe Design System - App.dc.html. Those files are the
// source of truth — do not invent values here.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          tint: '#EEF3FF',
          'tint-hover': '#DBE6FE',
          'tint-strong': '#DBE6FB',
          'on-dark': '#93B4FA',
        },
        ink: {
          DEFAULT: '#0F1B3D',
          80: '#26365E',
          60: '#5B6B8C',
          40: '#8A99B8',
          30: '#A3AEC5',
        },
        // Grounds
        page: '#F7F9FC',
        panel: '#FFFFFF',
        well: '#F1F4F9',
        canvas: '#EEF1F7',
        // Borders — line/card, panel, in-card divider, section rule
        line: {
          DEFAULT: '#E4E9F2',
          soft: '#E9EDF5',
          rule: '#F0F3F8',
          section: '#DDE4EF',
        },
        // On the navy field (sidebar, hero card)
        onink: {
          DEFAULT: '#8FA4CC',
          strong: '#DBE4F5',
        },
        success: {
          DEFAULT: '#16A34A',
          tint: '#DCFCE7',
          bright: '#34D399',
        },
        warning: {
          DEFAULT: '#B45309',
          tint: '#FEF3C7',
        },
        star: '#F5A524',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Web scale
        'label': ['12px', { lineHeight: '1.2', letterSpacing: '0.12em', fontWeight: '800' }],
        'meta': ['13.5px', { lineHeight: '1.45', fontWeight: '600' }],
        'body': ['14.5px', { lineHeight: '1.5', fontWeight: '600' }],
        'row': ['16.5px', { lineHeight: '1.35', fontWeight: '700' }],
        'section': ['19px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '800' }],
        'title': ['34px', { lineHeight: '1.05', letterSpacing: '-0.035em', fontWeight: '800' }],
        'hero': ['36px', { lineHeight: '1.04', letterSpacing: '-0.035em', fontWeight: '800' }],

        // Marketing scale — one step under uber.com. Fluid, capped, never past 52px.
        // Use these on the public pages instead of ad-hoc clamp() values.
        'display': ['clamp(34px, 4.4vw, 52px)', { lineHeight: '1.04', letterSpacing: '-0.04em', fontWeight: '800' }],
        'h2': ['clamp(24px, 2.8vw, 34px)', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '800' }],
        'h3': ['20px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '800' }],
        'lead': ['15.5px', { lineHeight: '1.55', fontWeight: '500' }],
        'nav': ['14px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      borderRadius: {
        // Web: buttons 13-14, inputs 16, cards 22, hero cards 26
        'btn': '14px',
        'input': '16px',
        'card': '22px',
        'hero': '26px',
        'well': '14px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(15,27,61,.09)',
        'selected': '0 10px 28px -14px rgba(37,99,235,.4)',
        'hero': '0 24px 50px -24px rgba(15,27,61,.55)',
        'panel': '0 24px 60px -20px rgba(15,27,61,.4)',
        'brand': '0 14px 30px -10px rgba(37,99,235,.7)',
        'map': '0 10px 30px -12px rgba(15,27,61,.28)',
        'marker': '0 8px 20px -8px rgba(15,27,61,.4)',
        'focus': '0 0 0 3px rgba(37,99,235,.28)',
        'input-focus': '0 0 0 4px rgba(37,99,235,.12)',
      },
      height: {
        // Web control heights: 52 hero, 44 standard, 38 compact
        'ctl-lg': '52px',
        'ctl': '44px',
        'ctl-sm': '38px',
      },
      backgroundImage: {
        'avatar': 'linear-gradient(140deg,#DBE6FB,#EEF3FF)',
      },
      transitionDuration: {
        DEFAULT: '120ms',
      },
    },
  },
  plugins: [],
}
