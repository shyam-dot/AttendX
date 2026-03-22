/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0d1117',
          900: '#0f1923',
          800: '#131f2e',
          700: '#1a2a3a',
          600: '#1e3448',
        },
        cyan: {
          electric: '#00e5ff',
          glow: '#00b8d4',
          dim: '#0097a7',
        },
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-red': 'pulseRed 1.5s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'slideUp': 'slideUp 0.4s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.12)' },
          '50%': { boxShadow: '0 0 20px 8px rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.2)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
