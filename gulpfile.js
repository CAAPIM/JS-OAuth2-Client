var gulp = require('gulp');
var wrap = require('gulp-umd');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');

var destOptions = {
  mode: 0755
};

var srcFiles = [
  './src/utils.js',
  './src/crypto.js',
  './src/cajso.js'
];

var umdOptions = {
  exports: function(file) {
    return 'cajso';
  },
  namespace: function(file) {
    return 'Cajso';
  }
};

gulp.task('build:min', function() {
  gulp.src(srcFiles)
    .pipe(babel())
    .pipe(concat('cajso.min.js'))
    .pipe(wrap(umdOptions))
    .pipe(uglify())
    .pipe(gulp.dest('./dist', destOptions));
});

gulp.task('build:dev', function() {
  gulp.src(srcFiles)
    .pipe(babel())
    .pipe(concat('cajso.js'))
    .pipe(wrap(umdOptions))
    .pipe(gulp.dest('./dist', destOptions));
});

gulp.task('example:min', function() {
  gulp.src(srcFiles)
    .pipe(babel())
    .pipe(concat('cajso.min.js'))
    .pipe(wrap(umdOptions))
    .pipe(uglify())
    .pipe(gulp.dest('./example/js', destOptions));
});

gulp.task('example:dev', function() {
  gulp.src(srcFiles)
    .pipe(babel())
    .pipe(concat('cajso.js'))
    .pipe(wrap(umdOptions))
    .pipe(gulp.dest('./example/js', destOptions));
});

gulp.task('build', ['build:dev','build:min']);

gulp.task('example', ['example:dev','example:min']);
