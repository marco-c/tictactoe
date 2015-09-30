var gulp = require('gulp');
var oghliner = require('oghliner');
var fse = require('fs-extra');

gulp.task('default', function() {
  fse.removeSync('dist');
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
  oghliner.offline({
    rootDir: 'dist',
    fileGlobs: [
      'index.html',
      'js/**/*.js',
    ],
    importScripts: ['js/sw-push.js'],
  }, callback);
});

gulp.task('deploy', function(callback) {
  oghliner.deploy({
    rootDir: 'dist',
  }, callback);
});
