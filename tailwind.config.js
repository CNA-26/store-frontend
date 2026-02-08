/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'monstera-brown': '#8C7A64',
        'monstera-dark': '#40513B',
        'monstera-green': '#609966',
        'monstera-light': '#EDF1D6',
        'monstera-lime': '#9DC08B',
      },
      fontFamily: {
        'lemonfunky': ['Lemon', 'cursive'],
      },
    },
  },
  plugins: [],
}
