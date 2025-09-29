/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'fredoka': ['Fredoka', 'sans-serif'],
        'comic': ['Comic Neue', 'Comic Sans MS', 'cursive'],
        'nunito': ['Nunito', 'sans-serif'],
        'quicksand': ['Quicksand', 'sans-serif'],
      },
      colors: {
        'dost-purple': '#512DA8',
        'dost-blue': '#7986CB',
      }
    },
  },
  plugins: [],
}