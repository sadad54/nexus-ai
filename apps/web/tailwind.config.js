/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        nexus: {
          950: '#030712', // Much deeper, almost black background
          900: '#0B1120', // Rich panel background
          800: '#161e32', // Card/Element background
          700: '#334155', // Subtle borders
          500: '#6366f1', // Electric Indigo (Primary)
          400: '#818cf8', // Lighter Indigo
          accent: '#06b6d4', // Cyan (for AI/Tech accents)
        }
      },
      backgroundImage: {
        // Subtle grid pattern for technical feel
        'subtle-grid': "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.03' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(99, 102, 241, 0.4)', // The "Force Field" glow
        'glow-accent': '0 0 20px -5px rgba(6, 182, 212, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
}