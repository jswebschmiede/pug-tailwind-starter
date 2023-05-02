// imports
import pkg from "gulp";
import babel from "gulp-babel";
import concat from "gulp-concat";
import uglify from "gulp-uglify";
import plumber from "gulp-plumber";
import { deleteAsync } from "del";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import autoprefixer from "autoprefixer";
import sourcemaps from "gulp-sourcemaps";
import postcss from "gulp-postcss";
import terser from "gulp-terser";
import cssnano from "cssnano";
import tailwindcss from "tailwindcss";
import browserSync from "browser-sync";
import pug from "gulp-pug";
import rename from "gulp-rename";
import through from "through2";
import mode from "gulp-mode";
import config from "./config.js";

const { dest, lastRun, parallel, series, src, watch } = pkg;

// File path variables etc.
const gulpMode = mode({
  modes: ["production", "development"],
  default: "development",
  verbose: false,
});
const dev_url = "yourlocal.dev";
const sass = gulpSass(dartSass);

// Browsersync to spin up a local server
const browserSyncServe = (cb) => {
  // initializes browsersync server
  browserSync.init({
    server: {
      baseDir: "dist",
      // proxy: dev_url,
    },
  });
  cb();
};

const browserSyncReload = (cb) => {
  // reloads browsersync server
  browserSync.reload();
  cb();
};

// Sass Task
const scssTask = async () => {
  return src(config.paths.scss.src, { since: lastRun(scssTask) })
    .pipe(gulpMode.development(sourcemaps.init()))
    .pipe(
      sass({
        outputStyle: "compressed",
        includePaths: ["./node_modules"],
      }).on("error", sass.logError)
    )
    .pipe(postcss([autoprefixer(), cssnano(), tailwindcss()]))
    .pipe(gulpMode.development(sourcemaps.write(".")))
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest(config.paths.scss.dest))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};

const jsTask = async () => {
  return src(config.paths.js.src, { since: lastRun(jsTask) })
    .pipe(gulpMode.development(sourcemaps.init()))
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(concat("scripts.js"))
    .pipe(dest(config.paths.js.dest))
    .pipe(rename({ suffix: ".min" }))
    .pipe(uglify())
    .pipe(dest(config.paths.js.dest))
    .pipe(gulpMode.development(sourcemaps.write(".")))
    .pipe(gulpMode.production(terser()))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};

// HTML Task
const htmlTask = async () => {
  const cbString = new Date().getTime();

  return src(["./src/pug/views/*.pug", "./src/pug/inludes/*.pug"])
    .pipe(plumber())
    .pipe(pug({ pretty: true, locals: { cbString: cbString } }))
    .pipe(dest("./dist"))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};

// copyFonts Task
const copyFontsTask = async () => {
  return src(config.paths.fonts.src).pipe(dest(config.paths.fonts.dest));
};

// Images Task
const imagesTask = async () => {
  return src(config.paths.img.src).pipe(dest(config.paths.img.dest));
};

// Clean dist task
const cleanDist = async (done) => {
  return deleteAsync(["dist/**/*"], done());
};

// Browsersync Watch task
// Watch HTML file for change and reload browsersync server
// watch SCSS and JS config.paths for changes, run scss and js tasks simultaneously and update browsersync
const bsWatchTask = async () => {
  watch(
    [
      config.paths.scss.src,
      config.paths.js.src,
      config.paths.pug.src,
      config.paths.img.src,
      config.paths.fonts.src,
    ],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(
      parallel(scssTask, jsTask, htmlTask, copyFontsTask, imagesTask),
      browserSyncReload
    )
  );
};

// Dev Task
export const dev = series(
  cleanDist,
  parallel(scssTask, jsTask, htmlTask),
  parallel(copyFontsTask, imagesTask),
  browserSyncServe,
  bsWatchTask
);

// Build Task
export const build = series(
  cleanDist,
  parallel(scssTask, jsTask, htmlTask),
  parallel(copyFontsTask, imagesTask)
);

export const clean = series(cleanDist);

// Default task
export default dev;
