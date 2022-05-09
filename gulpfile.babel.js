// imports
import { dest, lastRun, parallel, series, src, watch } from "gulp";
import del from "del";
import path from "path";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import autoprefixer from "autoprefixer";
import sourcemaps from "gulp-sourcemaps";
import postcss from "gulp-postcss";
import terser from "gulp-terser";
import cssnano from "cssnano";
import tailwindcss from "tailwindcss";
import browserSync from "browser-sync";
import squoosh from "gulp-libsquoosh";
import pug from "gulp-pug";
import webpackstream from "webpack-stream";
import through from "through2";
import named from "vinyl-named";
import webpack from "webpack";
import mode from "gulp-mode";
import cached from "gulp-cached";
import remember from "gulp-remember";

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
    src: "src/js/main.js",
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
};

// Browsersync to spin up a local server
const browserSyncServe = (cb) => {
  // initializes browsersync server
  browserSync.init({
    server: {
      baseDir: "./dist",
      // proxy: dev_url,
    },
    notify: {
      styles: {
        top: "auto",
        bottom: "0",
      },
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
const scssTask = () => {
  return src(files.scssPath.src)
    .pipe(gulpMode.development(sourcemaps.init()))
    .pipe(cached("scss"))
    .pipe(sass({ includePaths: ["./node_modules"] }).on("error", sass.logError))
    .pipe(postcss([autoprefixer(), cssnano(), tailwindcss()]))
    .pipe(remember("scss"))
    .pipe(gulpMode.development(sourcemaps.write(".")))
    .pipe(dest(files.scssPath.dest));
};

const jsTask = () => {
  return src(files.jsPath.src, { since: lastRun(jsTask) })
    .pipe(named())
    .pipe(
      webpackstream({
        mode: gulpMode.development() ? "development" : "production",
        output: {
          filename: "[name].bundle.js",
        },
        devtool: "source-map",
        cache: {
          type: "filesystem",
          cacheDirectory: path.resolve(__dirname, ".temp_cache"),
        },
        plugins: [
          new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
          }),
        ],
      })
    )
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
    .pipe(gulpMode.production(terser()))
    .pipe(gulpMode.development(sourcemaps.write(".")))
    .pipe(dest(files.jsPath.dest));
};

// HTML Task
const htmlTask = () => {
  return src("./src/pug/views/*.pug", { since: lastRun(htmlTask) })
    .pipe(cached("pug"))
    .pipe(pug({ pretty: true }))
    .pipe(remember("pug"))
    .pipe(dest("./dist"));
};

// moveWebfontsToDist Task
const moveWebfontsToDist = () => {
  return src(["src/webfonts/**"], { since: lastRun(moveWebfontsToDist) }).pipe(
    dest("dist/webfonts")
  );
};

// Browsersync Watch task
// Watch HTML file for change and reload browsersync server
// watch SCSS and JS files for changes, run scss and js tasks simultaneously and update browsersync
const bsWatchTask = () => {
  watch(
    [files.scssPath.src, files.jsPath.src, files.pugPath.src],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(parallel(scssTask, jsTask, htmlTask), browserSyncReload)
  );
};

// Images Task
const imagesTask = () => {
  return src(files.imgPath.src, { since: lastRun(imagesTask) })
    .pipe(gulpMode.production(squoosh()))
    .pipe(dest(files.imgPath.dest));
};

// Clean dist task
const cleanDist = (cb) => {
  return del(["dist/**/*"], cb);
};

// Watch Task
const watchTask = () => {
  watch(
    [files.scssPath.src, files.jsPath.src, files.pugPath.src],
    parallel(scssTask, jsTask, htmlTask)
  );
};

// Default Task
exports.default = series(
  cleanDist,
  parallel(scssTask, jsTask, htmlTask),
  moveWebfontsToDist,
  imagesTask,
  watchTask
);

// Build Task
exports.build = series(
  cleanDist,
  parallel(scssTask, jsTask, htmlTask),
  parallel(moveWebfontsToDist, imagesTask)
);
// Browsersync Task
exports.bs = series(
  cleanDist,
  parallel(scssTask, jsTask, htmlTask),
  parallel(moveWebfontsToDist, imagesTask),
  browserSyncServe,
  bsWatchTask
);

exports.clean = series(cleanDist);
