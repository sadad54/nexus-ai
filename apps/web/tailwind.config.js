/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        nexus: {
          950: '#020617', // Deepest background
          900: '#0f172a', // Main background
          800: '#1e293b', // Secondary/Cards
          700: '#334155', // Borders
          500: '#3b82f6', // Brand Blue
          400: '#60a5fa', // Brand Lighter
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}