var gulp = require('gulp');
var ts = require('gulp-typescript');
var footer = require('gulp-footer');
var merge2 = require('merge2');
var dts = require('dts-generator');
var childProcess = require('child_process');

var tsProject = ts.createProject('tsconfig.json', { typescript: require('typescript') });
var typingsFooter =
	'\ndeclare module \'microfill\' {' +
	'\n\texport * from \'__microfill/index\';' +
	'\n}\n';

gulp.task('scripts', function() {
	var tsResult = gulp.src(['lib/**/**.ts', 'typings/**/**.d.ts'])
		.pipe(ts(tsProject));
	
	return merge2([
		tsResult.js.pipe(gulp.dest('release/js')),
		tsResult.dts.pipe(gulp.dest('release/typings'))
	]);
});

gulp.task('typings', ['scripts'], function(done) {
	dts.generate({
		name: '__microfill',
		baseDir: './release/typings',
		files: [ 'index.d.ts', 'compiler.d.ts' ],
		out: 'release/typings.d.ts'
	}).then(function() {
		gulp.src('release/typings.d.ts')
			.pipe(footer(typingsFooter))
			.pipe(gulp.dest('release'))
			.on('finish', done);
	});
});

function fork(accept, done) {
	var args = []; // ['release/js/test'];
	if (accept) args.push('--accept');
	
	var child = childProcess.fork('./release/js/test', args);
	child.on('close', done);
}

gulp.task('test', ['scripts'], function(done) {
	fork(false, done);
});

gulp.task('test-accept', ['scripts'], function(done) {
	fork(true, done);
})

gulp.task('default', ['scripts']);