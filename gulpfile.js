var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var autoprefix = require('gulp-autoprefixer');

gulp.task('compress', function() {
  return gulp.src('dev/js/wow_wizard.js')
    .pipe(uglify())
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
  gulp.watch('dev/js/*.js', ['compress']);
  gulp.watch('dev/css/*.scss', ['sass']);
});