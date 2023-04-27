// imports
import pkg from 'gulp';
import { deleteAsync } from 'del';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import autoprefixer from 'autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import postcss from 'gulp-postcss';
import terser from 'gulp-terser';
import cssnano from 'cssnano';
import tailwindcss from 'tailwindcss';
import browserSync from 'browser-sync';
import pug from 'gulp-pug';
import webpackstream from 'webpack-stream';
import through from 'through2';
import mode from 'gulp-mode';

const { dest, lastRun, parallel, series, src, watch } = pkg;

// File path variables etc.
const gulpMode = mode({
    modes: ['production', 'development'],
    default: 'development',
    verbose: false
});
const dev_url = 'yourlocal.dev';
const sass = gulpSass(dartSass);
const files = {
    scssPath: {
        src: 'src/scss/**/*.scss',
        dest: 'dist/css'
    },
    jsPath: {
        src: 'src/js/main.js',
        dest: 'dist/js'
    },
    imgPath: {
        src: 'src/img/**/*.{jpg,jpeg,png,svg}',
        dest: 'dist/img'
    },
    pugPath: {
        src: 'src/pug/**/*.pug',
        dest: 'dist'
    }
};

// Browsersync to spin up a local server
const browserSyncServe = (cb) => {
    // initializes browsersync server
    browserSync.init({
        server: {
            baseDir: 'dist'
            // proxy: dev_url,
        },
        notify: {
            styles: {
                top: 'auto',
                bottom: '0'
            }
        }
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
    return src(files.scssPath.src)
        .pipe(gulpMode.development(sourcemaps.init()))
        .pipe(
            sass({ includePaths: ['./node_modules'] }).on(
                'error',
                sass.logError
            )
        )
        .pipe(postcss([autoprefixer(), cssnano(), tailwindcss()]))
        .pipe(gulpMode.development(sourcemaps.write('.')))
        .pipe(dest(files.scssPath.dest));
};

const jsTask = async () => {
    return src(files.jsPath.src, { since: lastRun(jsTask) })
        .pipe(
            webpackstream({
                mode: gulpMode.development() ? 'development' : 'production',
                output: {
                    filename: '[name].bundle.js'
                },
                devtool: 'source-map'
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
        .pipe(gulpMode.development(sourcemaps.write('.')))
        .pipe(dest(files.jsPath.dest));
};

// HTML Task
const htmlTask = async () => {
    return src('./src/pug/views/*.pug', { since: lastRun(htmlTask) })
        .pipe(pug({ pretty: true }))
        .pipe(dest('./dist'));
};

// moveWebfontsToDist Task
const moveWebfontsToDist = async () => {
    return src(['src/webfonts/**'], {
        since: lastRun(moveWebfontsToDist)
    }).pipe(dest('dist/webfonts'));
};

// Browsersync Watch task
// Watch HTML file for change and reload browsersync server
// watch SCSS and JS files for changes, run scss and js tasks simultaneously and update browsersync
const bsWatchTask = async () => {
    watch(
        [files.scssPath.src, files.jsPath.src, files.pugPath.src],
        { interval: 1000, usePolling: true }, //Makes docker work
        series(parallel(scssTask, jsTask, htmlTask), browserSyncReload)
    );
};

// Images Task
const imagesTask = async () => {
    return src(files.imgPath.src, { since: lastRun(imagesTask) }).pipe(
        dest(files.imgPath.dest)
    );
};

// Clean dist task
const cleanDist = async (done) => {
    return deleteAsync(['dist/**/*'], done());
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