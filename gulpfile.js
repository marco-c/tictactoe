var gulp = require('gulp');
var oghliner = require('oghliner');
var fse = require('fs-extra');

gulp.task('default', ['clean', 'build', 'offline']);

gulp.task('build', function() {
  fse.mkdirSync('dist');
  fse.copySync('js', 'dist/js');
  fse.copySync('node_modules/localforage/dist/localforage.min.js', 'dist/js/localforage.min.js');
  fse.copySync('index.html', 'dist/index.html');
  fse.copySync('style.css', 'dist/style.css');
});

gulp.task('clean', function() {
  fse.removeSync('dist');
});

gulp.task('offline', function(callback) {
  return oghliner.offline({
    rootDir: 'dist',
    fileGlobs: [
      'index.html',
      'js/**/*.js',
    ],
    importScripts: ['js/sw-push.js'],
  });
});

gulp.task('deploy', function(callback) {
  return oghliner.deploy({
    rootDir: 'dist',
  });
});
