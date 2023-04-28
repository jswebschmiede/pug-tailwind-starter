/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{html,js,pug}"],
  theme: {
    container: {
      center: true,
    },
    colors: {
      black: {
        100: "#d2d2d2",
        200: "#a5a5a5",
        300: "#787878",
        400: "#4b4b4b",
        500: "#1e1e1e",
        600: "#181818",
        700: "#121212",
        800: "#0c0c0c",
        900: "#060606",
      },
      orange: {
        100: "#fee4d9",
        200: "#fec9b3",
        300: "#fdaf8e",
        400: "#fd9468",
        500: "#fc7942",
        600: "#ca6135",
        700: "#974928",
        800: "#65301a",
        900: "#32180d",
      },
      graygreen: {
        100: "#edf7f0",
        200: "#dbefe1",
        300: "#cae8d3",
        400: "#b8e0c4",
        500: "#a6d8b5",
        600: "#85ad91",
        700: "#64826d",
        800: "#425648",
        900: "#212b24",
      },
      whitegreen: {
        100: "#fcfdfa",
        200: "#f9fcf5",
        300: "#f7faf1",
        400: "#f4f9ec",
        500: "#f1f7e7",
        600: "#c1c6b9",
        700: "#91948b",
        800: "#60635c",
        900: "#30312e",
      },
    },
    fontFamily: {
      poppins: "Poppins, sans-serif",
      catamaran: "Catamaran, sans-serif",
    },
    extend: {
      boxShadow: ({ theme }) => ({
        custom: `4px 4px 0 ${theme("colors.black.500")}`,
      }),
    },
  },
  darkMode: ["dark", '[data-mode="dark"]'],
  plugins: [require("@tailwindcss/typography"), require("tailwind-scrollbar")],
};
