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
        dark: {
          950: '#0b0f19',
          900: '#111827',
          850: '#182234',
          800: '#1f2937',
          700: '#374151',
        },
        pulse: {
          danger: '#ef4444',
          warning: '#f59e0b',
          safe: '#10b981',
          accent: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
