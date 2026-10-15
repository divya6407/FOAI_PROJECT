/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:      '#6D28D9',
        primaryHover: '#5B21B6',
        primaryLight: '#A78BFA',
        secondary:    '#4C1D95',
        bgApp:        '#F8F7FC',
        surfaceAlt:   '#F1EEFA',
        border:       '#E4DEF7',
        textMuted:    '#6B6478',
        // Dark theme tokens
        darkBgApp:    '#0F0D1A',
        darkSurface:  '#1A172A',
        darkSurfaceAlt:'#242038',
        darkBorder:   '#342E52',
        darkTextMuted:'#A099B8',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
