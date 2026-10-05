/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#fff5f7',
          100: '#ffe4e8',
          200: '#fecdd6',
          300: '#fda4b4',
          400: '#fb7185',
          500: '#e14d6e',
          600: '#c53051',
          700: '#9f1f3a',
          DEFAULT: '#F6D5DA',
        },
        cream: {
          50: '#fdfcf7',
          100: '#faf7ed',
          200: '#f4eed8',
          300: '#ece0be',
          400: '#e0cd9c',
          500: '#cdb67c',
          DEFAULT: '#FBF5EC',
        },
        gold: {
          50: '#fbf8ee',
          100: '#f6eed3',
          200: '#eddda6',
          300: '#dfc571',
          400: '#d4b245',
          500: '#b89329',
          600: '#94711f',
          DEFAULT: '#C9A24B',
        },
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#C4486A',
          600: '#b03b5a',
          700: '#942b47',
          800: '#7a243a',
          DEFAULT: '#C4486A',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'rotate-slow': 'rotate 20s linear infinite',
      },
      keyframes: {
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(225, 77, 110, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 30px -4px rgba(225, 77, 110, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.05)',
        'rose-glow': '0 10px 25px -5px rgba(196, 72, 106, 0.4)',
      },
    },
  },
  plugins: [],
}
