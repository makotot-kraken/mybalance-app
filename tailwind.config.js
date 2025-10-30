/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'robinhood-green': '#00C853',
        'dark-bg': '#0E1111',
        'dark-text': '#F5F5F5',
      },
    },
  },
  plugins: [],
}

