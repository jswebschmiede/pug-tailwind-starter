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

const { dest, lastRun, parallel, series, src, watch } = pkg;

// File path variables etc.
const gulpMode = mode({
  modes: ["production", "development"],
  default: "development",
  verbose: false,
});
const dev_url = "yourlocal.dev";
const sass = gulpSass(dartSass);
const files = {
  scssPath: {
    src: "src/scss/**/*.scss",
    dest: "dist/css",
  },
  jsPath: {
    src: "src/js/components/*.js",
    dest: "dist/js",
  },
  imgPath: {
    src: "src/img/**/*.{jpg,jpeg,png,svg}",
    dest: "dist/img",
  },
  pugPath: {
    src: "src/pug/**/*.pug",
    dest: "dist",
  },
  fontsPath: {
    src: "src/fonts/**",
    dest: "dist/fonts",
  },
};

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
  return src(files.scssPath.src, { since: lastRun(scssTask) })
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
    .pipe(dest(files.scssPath.dest))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};

const jsTask = async () => {
  return src(files.jsPath.src, { since: lastRun(jsTask) })
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(concat("scripts.js"))
    .pipe(dest(files.jsPath.dest))
    .pipe(rename({ suffix: ".min" }))
    .pipe(uglify())
    .pipe(dest(files.jsPath.dest))
    .pipe(gulpMode.development(sourcemaps.init({ loadMaps: true })))
    .pipe(
      through.obj(function (file, enc, cb) {
        // Dont pipe through any source map files as it will be handled
        // by gulp-sourcemaps
        const isSourceMap = /\.map$/.test(file.path);
        if (!isSourceMap) this.push(file);
        cb();
      })
    )
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
  return src(["./src/pug/views/*.pug", "./src/pug/inludes/*.pug"])
    .pipe(plumber())
    .pipe(pug({ pretty: true }))
    .pipe(dest("./dist"))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};

// moveWebfontsToDist Task
const moveWebfontsToDist = async () => {
  return src(files.fontsPath.src).pipe(dest(files.fontsPath.dest));
};

// Images Task
const imagesTask = async () => {
  return src(files.imgPath.src).pipe(dest(files.imgPath.dest));
};

// Clean dist task
const cleanDist = async (done) => {
  return deleteAsync(["dist/**/*"], done());
};

// Browsersync Watch task
// Watch HTML file for change and reload browsersync server
// watch SCSS and JS files for changes, run scss and js tasks simultaneously and update browsersync
const bsWatchTask = async () => {
  watch(
    [
      files.scssPath.src,
      files.jsPath.src,
      files.pugPath.src,
      files.imgPath.src,
      files.fontsPath.src,
    ],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(
      parallel(scssTask, jsTask, htmlTask, moveWebfontsToDist, imagesTask),
      browserSyncReload
    )
  );
};

// Dev Task
export const dev = series(
  cleanDist,
  parallel(scssTask, jsTask, htmlTask),
  parallel(moveWebfontsToDist, imagesTask),
  browserSyncServe,
  bsWatchTask
);

// Build Task
export const build = series(
  cleanDist,
  parallel(scssTask, jsTask, htmlTask),
  parallel(moveWebfontsToDist, imagesTask)
);

export const clean = series(cleanDist);

// Default task
export default dev;
