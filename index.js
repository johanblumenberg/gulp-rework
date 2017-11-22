'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var _ = require('lodash');
var rework = require('rework');
var applySourceMap = require('vinyl-sourcemaps-apply');

var lastIsObject = _.flowRight(_.isPlainObject, _.last);

module.exports = function () {
	var args = [].slice.call(arguments);
	var options = lastIsObject(args) ? args.pop() : {};
	var plugins = args;

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-rework', 'Streaming not supported'));
			return;
		}

		try {
			var ret = rework(file.contents.toString(), {source: file.path});
			plugins.forEach(ret.use.bind(ret));

			if (file.sourceMap) {
				options.sourcemap = true;
				options.inputSourcemap = false;
				options.sourcemapAsObject = true;
			}
			var result = ret.toString(options);
			if (file.sourceMap) {
				file.contents = new Buffer(result.code);

				result.map.file = file.relative;
				result.map.sources = result.map.sources.map(function (src) {
					return file.relative;
				});

				applySourceMap(file, result.map);
			} else {
				file.contents = new Buffer(result);				
			}

			cb(null, file);
		} catch (err) {
			cb(new gutil.PluginError('gulp-rework', err, {fileName: err.filename || file.path}));
		}
	});
};
