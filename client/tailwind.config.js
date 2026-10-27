/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#dbe4f3',
          200: '#b9c9e6',
          300: '#8fa8d3',
          400: '#5f80b8',
          500: '#3f5f9c',
          600: '#2d4a80',
          700: '#233a66',
          800: '#1a2c4d',
          900: '#111d35',
        },
      },
    },
  },
  plugins: [],
};
