/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#f4ecd8",
        ember: "#b3541e",
        inkwell: "#231d16",
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
      },
    },
  },
  plugins: [],
};
