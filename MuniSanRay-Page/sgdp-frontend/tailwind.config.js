/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#652681',
          50:  '#f5eefa',
          100: '#e9d4f5',
          200: '#d4aaeb',
          300: '#b97fdc',
          400: '#9e54ce',
          500: '#652681',
          600: '#56206e',
          700: '#481a5c',
          800: '#3a154a',
          900: '#2c1038',
        },
        accent: {
          DEFAULT: '#FDB701',
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FDB701',
          600: '#d97706',
          700: '#b45309',
        },
        surface: '#F6F6F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
