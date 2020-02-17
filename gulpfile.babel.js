import { src, dest, watch, series, parallel } from 'gulp';
import babel from 'gulp-babel';
import browserSync from 'browser-sync';
import bro from 'gulp-bro';
import babelify from 'babelify';
import cond from 'gulp-cond';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import del from 'del';
import concat from 'gulp-concat';


const PROD = process.env.NODE_ENV === 'production';
const buildDir = PROD ? 'build' : 'dist';
const clean = () => del(['./dest/**/*', './build/**/*'])
const server = browserSync.create();

const runServer = resolve => {
  server.init({
    server: {
      baseDir: buildDir
    }
  });
  resolve();
};

const reload = none => {
  server.reload();
  none();
};

const path = {
  scripts: {
    site: 'src/js/*.js',
    src: 'src/js/**/*.*',
    dest: 'dist/js',
  },
  html: {
    src: 'src/html/index.html',
    dest: buildDir
  }
};

function mvHtml () {
  return src(path.html.src).pipe(dest(path.html.dest))
}

function scripts() {
  return src(path.scripts.site, { sourcemaps: !PROD })
    .pipe(babel())
    .pipe(cond(PROD, uglify()))
    .pipe(cond(PROD, concat('main.min.js'), concat('main.js')))
    .pipe(dest(path.scripts.dest, { sourcemaps: '.' }));
}

function buildReact() {
  return src('./src/js/index.jsx', { sourcemaps: !PROD })
    .pipe(
      bro({
        basedir: './src/js/',
        extensions: ['.js', '.jsx'],
        debug: !PROD,
        transform: [babelify],
      }),
    )
    .pipe(rename('bundle.js'))// Stream files
    .pipe(cond(PROD, uglify()))
    .pipe(dest(path.scripts.dest, { sourcemaps: '.' }));
}

function watchIt() {
  watch(
    [path.scripts.src, path.html.src],
    series(mvHtml, parallel(scripts, buildReact), reload))
};

export default series(
  clean,
  mvHtml,
  parallel(scripts, buildReact),
  runServer,
  watchIt
);
