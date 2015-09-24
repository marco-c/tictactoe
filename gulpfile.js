var gulp = require('gulp');
var oghliner = require('oghliner');

gulp.task('default', function() {
});

gulp.task('offline', function(callback) {
  oghliner.offline({
    rootDir: '.',
    fileGlobs: [
      'tictactoe.html',
      'js/**/*.js',
    ],
  }, callback);
});

gulp.task('deploy', function(callback) {
  oghliner.deploy({
    rootDir: '.',
  }, callback);
});
