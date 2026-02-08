/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c7ff',
          400: '#8ca3ff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4451b8',
          800: '#343b94',
          900: '#2a2f75',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#764ba2',
          600: '#6b3f8f',
          700: '#5f337c',
          800: '#532769',
          900: '#471b56',
        },
      },
    },
  },
  plugins: [],
}

// 
