/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'rgba(30, 30, 38, 0.7)',
          hover: 'rgba(40, 40, 52, 0.8)',
        },
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        secondary: {
          DEFAULT: '#8b5cf6',
          hover: '#7c3aed',
        },
        accent: {
          DEFAULT: '#ec4899',
          hover: '#db2777',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        'dark-gradient': 'linear-gradient(to bottom, #09090b, #111115)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-highlight': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        'glass': '12px',
      }
    },
  },
  plugins: [],
}