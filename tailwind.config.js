/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        apricot: "#F6A66A",   // warmer apricot (less pink)
        latte:   "#D8C3A5",
        blush:   "#FCE8D8",
        card:    "rgba(255,255,255,0.5)",
        cardBorder: "rgba(255,255,255,0.35)"
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(0,0,0,0.10)',
        'soft-dark': '0 10px 30px rgba(0,0,0,0.35)'
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
