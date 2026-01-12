/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue.js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors:{
        nexus:{
          900: '#0f172a', // Dark Navy
          800: '#1e293b', // Sidebar
          500: '#3b82f6', // Brand Blue
        }
      }
    },
  },
  plugins: [],
}

