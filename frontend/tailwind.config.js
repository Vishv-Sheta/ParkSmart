/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',
          card: '#1a1a1a',
          border: '#2a2a2a',
        },
        silver: {
          light: '#c0c0c0',
          DEFAULT: '#a8a8a8',
          dark: '#808080',
        }
      },
      animation: {
        'border-glow': 'borderGlow 3s ease-in-out infinite',
      },
      keyframes: {
        borderGlow: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}