var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var autoprefix = require('gulp-autoprefixer');
var ts = require('gulp-typescript');
var ignore = require('gulp-ignore');
var gutil = require('gulp-util');
var babel = require('gulp-babel');

var tsProject = ts.createProject('dev/ts/tsconfig.json');

gulp.task('compress', function() {
  return gulp.src('dev/js/*.js')
    .pipe(ignore.exclude([ "dev/js/*.map" ]))
    .pipe(uglify().on('error', gutil.log))
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('sass', function() {
  return gulp.src('dev/css/wow_wizard.scss')
    .pipe(sass())
    .pipe(autoprefix())
    .pipe(gulp.dest('dist/css'));
});

gulp.task('watch', function() {
  gulp.watch('dev/ts/*.ts', ['ts']);
  gulp.watch('dev/js/*.js', ['compress']);
  gulp.watch('dev/css/*.scss', ['sass']);
});

gulp.task('ts', function () {
  var tsResult = tsProject.src() // instead of gulp.src(...)
        .pipe(ts(tsProject));

  return tsResult.js.pipe(gulp.dest('dev/js'));
});

gulp.task('default', ['ts', 'compress', 'sass', 'watch']);
