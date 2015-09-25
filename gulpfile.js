var gulp = require('gulp');
var oghliner = require('oghliner');
var fse = require('fs-extra');

gulp.task('default', function() {
  fse.removeSync('dist');
  fse.mkdirSync('dist');
  fse.copySync('js', 'dist/js');
  fse.copySync('tictactoe.html', 'dist/tictactoe.html');
});

gulp.task('clean', function() {
  fse.removeSync('dist');
});

gulp.task('offline', function(callback) {
  oghliner.offline({
    rootDir: 'dist',
    fileGlobs: [
      'tictactoe.html',
      'js/**/*.js',
    ],
  }, callback);
});

gulp.task('deploy', function(callback) {
  oghliner.deploy({
    rootDir: 'dist',
  }, callback);
});
