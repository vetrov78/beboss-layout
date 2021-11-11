const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const csso = require("postcss-csso");
const autoprefixer = require("autoprefixer");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const minify = require("gulp-minify");
const htmlmin = require("gulp-htmlmin");
const sync = require("browser-sync").create();
const rename = require("gulp-rename");
const svgstore = require("gulp-svgstore");
const del = require("del");
const { dest } = require("gulp");
const critical = require('critical').stream;

//Sprite
const sprite = () => {
  return gulp
    .src("source/img/icons/*.svg")
    .pipe(svgstore())
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
}
exports.sprite = sprite;

//Images
const images = () => {
  return gulp
    .src("source/img/**/*.{jpg,png,svg}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.mozjpeg({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"))
}
exports.images = images;

//WebP
const createWebp = () => {
  return gulp
    .src("source/img/**/*.{jpg,png}")
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("build/img"))
}
exports.createWebp = createWebp;

// Styles
const styles = () => {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(gulp.dest("build/css"))
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(sourcemap.write("."))
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("build/css"))
    .pipe(sync.stream());
}
exports.styles = styles;

//HTML Minifier
const html = () => {
  return gulp
    .src("source/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("build"))
    .pipe(sync.stream());
}
exports.html = html;

//JS minifier
const jsMin = () => {
  return gulp
    .src("source/js/*.js")
    .pipe(minify())
    .pipe(gulp.dest("build/js"))
    .pipe(sync.stream());
}
exports.jsMin = jsMin;

// Server
const server = (done) => {
  sync.init({
    server: {
      baseDir: "build"
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}
exports.server = server;

//Reload
const reload = (done) => {
  sync.reload
  done();
}

// Watcher
const watcher = () => {
  gulp.watch("source/sass/**/*.scss", gulp.series(styles));
  gulp.watch("source/js/**/*.js", gulp.series(jsMin));
  gulp.watch("source/*.html", gulp.series(html));
}

//Clean build folder
const clean = () => {
  return(del("build"));
}
exports.clean = clean;

//Copy not changed files
const copy = (done) => {
  gulp
    .src([
      "source/fonts/*.{woff2,woff}",
      "source/*.ico",
      "source/*.html",
      "source/styles/*.css"
    ], {base: "source"})
    .pipe(gulp.dest("build"))
  done();
}
exports.copy = copy;

const build = gulp
  .series(
    clean,
    copy,
    gulp.parallel(
      images,
      createWebp,
      styles,
      sprite,
      jsMin,
      html
    )
  );
exports.build = build;

const criticalTask = () => {
  return gulp
    .src('build/*.html')
    .pipe(
      critical({
        base: 'build/',
        inline: true,
        css: ['build/css/style.min.css'],
      })
    )
    .on('error', err => {
      log.error(err.message);
    })
    .pipe(gulp.dest('build'));
};
exports.critical = criticalTask;

exports.default = gulp
.series(
  build,
  // criticalTask,
  server,
  watcher
);
