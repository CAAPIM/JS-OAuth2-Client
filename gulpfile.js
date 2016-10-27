var gulp = require('gulp');
var wrap = require('gulp-wrap-amd');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var multiDest = require('gulp-multi-dest');

var destOptions = {
    mode: 0755
};

gulp.task('wrap', function() {
	gulp.src([
			'./src/utils.js',
			'./src/crypto.js',
			'./src/cajso.js'
		])
		.pipe(babel({presets: ['es2015']}))
		.pipe(concat('cajso.min.js'))
		.pipe(uglify())
		.pipe(wrap({
      	exports: 'cajso'
    	}))
		.pipe(multiDest(['./dist', './app/js'], destOptions));
});
gulp.task('default', ['wrap']);