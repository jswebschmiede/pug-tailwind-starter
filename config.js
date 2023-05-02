// config file for gulp tasks

export default {
  paths: {
    scss: {
      src: "src/scss/**/*.scss",
      dest: "dist/css",
    },
    js: {
      src: "src/js/components/*.js",
      dest: "dist/js",
    },
    img: {
      src: "src/img/**/*.{jpg,jpeg,png,svg}",
      dest: "dist/img",
    },
    pug: {
      src: "src/pug/**/*.pug",
      dest: "dist",
    },
    fonts: {
      src: "src/fonts/**",
      dest: "dist/fonts",
    },
  },
};
