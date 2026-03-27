/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
        fredoka: ['"Fredoka One"', 'cursive'],
      },
      colors: {
        brand: {
          50:  '#FFF0E8',
          100: '#FFD4B8',
          400: '#E8763A',
          500: '#D85A30',
          600: '#C04E28',
        },
        surface: '#FFF9F5',
      },
    },
  },
  plugins: [],
}
