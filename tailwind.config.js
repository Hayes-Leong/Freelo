/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 温润日式色板
        rice: {
          50:  '#fffcf7',
          100: '#fdfaf5',
          200: '#faf3e6',
          300: '#f5e6c8',
          400: '#e8ddd0',
          500: '#d4a853',
          600: '#c17f59',
          700: '#8b7e6e',
          800: '#6b5e4e',
          900: '#4a3f35',
        },
        ink: {
          400: '#7a9e7a',
          500: '#5b8c5a',
          600: '#4a7a49',
        },
        terracotta: {
          400: '#d4956b',
          500: '#c17f59',
          600: '#a86d4a',
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'toast-in': 'slideIn 0.35s ease-out',
        'toast-out': 'slideOut 0.3s ease-in forwards',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(60px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
