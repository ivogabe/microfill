Microfill
=========
Only loads polyfills for the missing gabs.

How does it work
----------------
Microfill replaces your javascript file with a file that looks like this:
```javascript
;(function(){
	var n = 0;

	if (!window.setImmediate) n += 1 << 0;
	if (!window.Promise) n += 1 << 1;
	if (!window.fetch) n += 1 << 2;
	if (!window.WeakMap || !window.Map || !window.Set) n += 1 << 3;

	var script = document.createElement("script");
	script.src = "file-" + n.toString(16) + ".js";
	script.type = "text/javascript";
	document.head.appendChild(script);
})();
```
If a feature is missing, `n` will be increased by a certain value. Based on the final value of `n` a file will be loaded.
Microfill generates such file for every possible combination of polyfills that are needed. See the `test` directory for a sample output.

How to use
----------
### Using node.js
```javascript
var microfill = require('microfill');

microfill.compile(
	'lib/script.js', // Input
	'dist/script.js', // Output
	'script.js', // Filename that will be used in the compiled file
	['set-immediate', 'promise', 'fetch', 'collections'] // Polyfills
);
```

### Using gulp
Use [gulp-microfill](https://github.com/ivogabe/gulp-microfill).
```javascript
var gulp = require('gulp');
var microfill = require('gulp-microfill');

gulp.task('default', function() {
	gulp.src('lib/**/*.js')
		.pipe(microfill(['set-immediate', 'promise', 'fetch', 'collection']))
		.pipe(gulp.dest('release'))
});
```

Supported polyfills
-------------------
- `set-immediate`
- `promise`
- `fetch`
- `collections` (WeapMap, Map, Set)

License
-------
MIT
