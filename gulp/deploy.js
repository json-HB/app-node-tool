const gulp = require('gulp'),
  crypto = require('crypto'),
  deployOss = require('webui-gulp/tasks/deploy-oss').deployOss,
  Vinyl = require('vinyl'),
  through = require('through2');

gulp.task('gen-app-md5', function () {
  return gulp
    .src('dist/apk/**/*.apk')
    .pipe(
      through.obj(function (file, enc, callback) {
        const md5 = crypto
          .createHash('md5')
          .update(file.contents)
          .digest('hex');
        const newFile = new Vinyl({
          base: file.base,
          cwd: file.cwd,
          path: file.path.replace(/\.apk$/i, '.md5'),
          contents: new Buffer(md5)
        });
        this.push(newFile);
        callback();
      })
    )
    .pipe(gulp.dest('dist/apk'));
});

gulp.task('deploy-oss', ['gen-app-md5'], function (done) {
  deployOss({src: ['dist/apk/**/*.apk', 'dist/apk/**/*.md5']}, done);
});

gulp.task('publish-new-version', function (done) {
  deployOss({src: 'dist/apk/publish-*.json'}, done);
});
