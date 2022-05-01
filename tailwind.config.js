const _ = require("lodash");
const theme = require("./theme.json");
const defaultTheme = require("tailwindcss/defaultTheme");
const tailpress = require("@jeffreyvr/tailwindcss-tailpress");

module.exports = {
  content: [
    "./src/**/*.{html,js,pug}",
    "./node_modules/tw-elements/dist/js/**/*.js",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Open Sans", ...defaultTheme.fontFamily.sans],
      },
      colors: tailpress.colorMapper(
        tailpress.theme("settings.color.palette", theme)
      ),
      fontSize: tailpress.fontSizeMapper(
        tailpress.theme("settings.typography.fontSizes", theme)
      ),

      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme("colors.slate.900"),
            h1: {
              color: theme("colors.primary"),
              "margin-bottom": "1rem",
            },
          },
        },
      }),
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwind-scrollbar"),
    require("tw-elements/dist/plugin"),
    require("@tailwindcss/forms"),
    tailpress.tailwind,
  ],
};
