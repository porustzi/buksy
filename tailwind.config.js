/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        noir: {
          DEFAULT: '#0A0A0A',
          50: '#1A1A1A',
          100: '#151515',
          200: '#121212',
          300: '#0F0F0F',
          400: '#0D0D0D',
          500: '#0A0A0A',
          600: '#080808',
          700: '#060606',
          800: '#040404',
          900: '#020202',
        },
        blood: {
          DEFAULT: '#B10006',
          50: '#FF4D4D',
          100: '#FF3333',
          200: '#E61919',
          300: '#CC0F0F',
          400: '#B30808',
          500: '#B10006',
          600: '#8A0005',
          700: '#630004',
          800: '#3C0003',
          900: '#1A0001',
        },
        ash: {
          DEFAULT: '#1A1A1A',
          50: '#333333',
          100: '#2A2A2A',
          200: '#222222',
          300: '#1F1F1F',
          400: '#1A1A1A',
          500: '#151515',
          600: '#111111',
          700: '#0D0D0D',
          800: '#0A0A0A',
          900: '#080808',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        heading: ['Bebas Neue', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'reveal': 'reveal 1s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #B10006, 0 0 10px #B10006, 0 0 15px #B10006' },
          '100%': { boxShadow: '0 0 10px #B10006, 0 0 20px #B10006, 0 0 30px #B10006' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'scale(0.8) rotateY(90deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotateY(0deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'blood': '0 0 15px rgba(177, 0, 6, 0.3)',
        'blood-lg': '0 0 30px rgba(177, 0, 6, 0.4)',
        'inner-blood': 'inset 0 0 20px rgba(177, 0, 6, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-blood': 'linear-gradient(135deg, #B10006 0%, #0A0A0A 100%)',
        'gradient-noir': 'linear-gradient(180deg, #0A0A0A 0%, #1A1A1A 100%)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(177, 0, 6, 0.1), transparent)',
      },
    },
  },
  plugins: [],
};
