/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          black: '#090909',
          charcoal: '#171717',
          surface: '#1f1f1f',
          offwhite: '#F1F0EB',
          warmgrey: '#898989',
          dim: '#262626',
          accent: '#CEFF00', // Signature acid neon brutalist accent
          accentHover: '#b5e300',
          accentOrange: '#FF4800'
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Syne', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        arabic: ['IBM Plex Sans Arabic', 'Cairo', 'sans-serif']
      },
      letterSpacing: {
        widestx: '0.25em',
        brutal: '0.35em'
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
