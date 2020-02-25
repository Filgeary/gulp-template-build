'use strict';

// Gulp 4.0.2
// =====================================================================

// Load plugins
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const minify = require('gulp-csso');
const htmlmin = require('gulp-htmlmin');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const pipeline = require('readable-stream').pipeline;
const rename = require('gulp-rename');
const del = require('del');
const changed = require('gulp-changed');
const imagemin = require('gulp-imagemin');
const webp = require('imagemin-webp');
const svgstore = require('gulp-svgstore');
const ghPages = require('gulp-gh-pages');
const server = require('browser-sync').create();

// Styles
// =====================================================================

// Dev Style
// Compile SASS into CSS & auto-inject into browsers
function devStyle() {
  return gulp
    .src('src/sass/style.scss', { sourcemaps: true })
    .pipe(plumber())
    .pipe(sass())
    .pipe(plumber.stop())
    .pipe(gulp.dest('src/css', { sourcemaps: '.' }))
    .pipe(server.stream());
}

// Prod Style
// Compile SASS into CSS, add Autoprefixer, Minify CSS, Move to Build & auto-inject into browsers
function prodStyle() {
  return gulp
    .src('src/sass/style.scss', { sourcemaps: true })
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(plumber.stop())
    .pipe(minify())
    .pipe(gulp.dest('build/css', { sourcemaps: '.' }))
    .pipe(server.stream());
}

// HTML
// =====================================================================

// Minify HTML
function html() {
  return gulp
    .src('src/*.html', !'src/_TEMPLATE.html')
    .pipe(
      htmlmin({
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        html5: true,
        minifyCSS: true,
        minifyJS: true,
        processConditionalComments: true,
        removeComments: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true
      })
    )
    .pipe(gulp.dest('build'));
}

// Scripts
// =====================================================================

// Dev Script
// Concat JS
function devScript() {
  return gulp
    .src(['src/js/**/*.js', '!src/js/main.js'], { sourcemaps: true })
    .pipe(concat('main.js'))
    .pipe(gulp.dest('src/js', { sourcemaps: '.' }));
}

// Prod Script
// Transpile, Concat and Minify JS, move to Build
function prodScript() {
  return pipeline(
    gulp.src(['src/js/**/*.js', '!src/js/main.js'], { sourcemaps: true }),
    babel(),
    concat('main.js'),
    uglify(),
    gulp.dest('build/js', { sourcemaps: '.' })
  );
}

// Images
// =====================================================================

// Optimize Images
function images() {
  return gulp
    .src('src/img/**/*', !'src/img/svg-sprite/*')
    .pipe(changed('build/img'))
    .pipe(
      imagemin([
        imagemin.gifsicle({
          interlaced: true
        }),
        imagemin.optipng({
          optimizationLevel: 5,
          interlaced: true
        }),
        imagemin.mozjpeg({
          quality: 75,
          progressive: true
        }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest('build/img'));
}

// Convert images to WebP
function imagesWebp() {
  return gulp
    .src('src/img/**/*.{png,jpg,jpeg}')
    .pipe(
      imagemin([
        webp({
          quality: 75
        })
      ])
    )
    .pipe(
      rename({
        extname: '.webp'
      })
    )
    .pipe(gulp.dest('build/img'));
}

// SVG Sprites
// =====================================================================

// Dev Sprite - Combine SVG files into SVG Sprite
function devSprite() {
  return gulp
    .src('src/img/svg-sprite/*.svg')
    .pipe(
      svgstore({
        inlineSvg: true
      })
    )
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('src/img'));
}

// Prod Sprite - Minify & Combine SVG files into one SVG Sprite
function prodSprite() {
  return gulp
    .src('src/img/svg-sprite/*.svg')
    .pipe(
      imagemin([
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false
            }
          ]
        })
      ])
    )
    .pipe(
      svgstore({
        inlineSvg: true
      })
    )
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/img'));
}

// Copy Tasks
// =====================================================================

// Copy Fonts
function copyFonts() {
  return gulp
    .src(['src/fonts/**/*.{woff,woff2}'], {
      base: 'src'
    })
    .pipe(gulp.dest('build'));
}

// Copy Favicons
function copyFavicons() {
  return gulp.src(['src/favicons/*']).pipe(gulp.dest('build'));
}

// Delete Tasks
// =====================================================================

// Delete 'Build' folder
function cleanBuild() {
  return del('build');
}

// Delete All Junk files
function cleanJunkFiles() {
  return del([
    'build/**/*.txt',
    'build/img/svg-sprite',
    'build/**/_TEMPLATE.*'
  ]);
}

// Servers
// =====================================================================

function reload(done) {
  server.reload();
  done();
}

// Dev Server
function devServer() {
  server.init({
    server: './src',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  // Watch files
  gulp.watch('src/sass/**/*.scss', devStyle);
  gulp.watch('src/*.html', reload);
  gulp.watch(
    ['src/js/**/*.js', '!src/js/main.js'],
    gulp.series(devScript, reload)
  );
  gulp.watch(['src/img/**/*', '!src/img/svg-sprite/*.svg'], reload);
  gulp.watch('src/img/svg-sprite/*.svg', gulp.series(devSprite, reload));
}

// Prod Server
function prodServer() {
  server.init({
    server: './build',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  // Watch files
  gulp.watch('src/sass/**/*.scss', prodStyle);
  gulp.watch('src/*.html', gulp.series(html, reload));
  gulp.watch(
    ['src/js/**/*.js', '!src/js/main.js'],
    gulp.series(prodScript, reload)
  );
  gulp.watch(
    ['src/img/**/*', '!src/img/svg-sprite/*.svg'],
    gulp.series(images, imagesWebp, reload)
  );
  gulp.watch('src/img/svg-sprite/*.svg', gulp.series(prodSprite, reload));
}

// Deploy to Github Pages
// =====================================================================

function deployGithub() {
  return gulp.src('./build/**/*').pipe(ghPages());
}

// Complex Tasks
// =====================================================================

// DEV
const dev = gulp.series(
  cleanBuild,
  gulp.parallel(devStyle, devScript, devSprite),
  devServer
);

// PROD
const build = gulp.series(
  cleanBuild,
  gulp.parallel(
    html,
    prodStyle,
    prodScript,
    copyFonts,
    copyFavicons,
    images,
    imagesWebp,
    prodSprite
  ),
  cleanJunkFiles,
  prodServer
);

// Exports
// =====================================================================

exports.deployGithub = deployGithub;
exports.dev = dev;
exports.build = build;
