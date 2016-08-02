(function() {
  var path            = require('path');
  var gulp            = require('gulp');
  var plugins         = require('gulp-load-plugins')();
  var del             = require('del');
  var bsync           = require('browser-sync');
  var reload          = bsync.reload;
  var through         = require('through2');
  var extractMeta     = require('./lib/extract-meta');

  var site = {
    title: 'Aarons Blog',
    siteRoot: '/'
  };

  var summarize = function(contents, marker) {
    if (contents.indexOf(marker) !== -1) {
      var summary = contents.split(marker)[0];
      if (summary) {
        return summary;
      }
    }

    return contents;
  };

  var permalink = function(path) {
    return '/blog/' + path.split("/posts")[1];
  };

  var prettyDate = function(date) {
    if (typeof(date) === Date) {
      return date.toDateString();
    }
    var d = Date.parse(date);
    return new Date(d).toDateString();
  };

  var collectPosts = function() {
    var posts = [];

    return through.obj(function(file, enc, next) {
      console.log(file);
      var meta = extractMeta()(file.relative);
      var body = file.contents.toString();
      var post          = file.page;
      post.title        = meta.title;
      post.publishedOn  = meta.date;
      post.prettyDate   = prettyDate(meta.date);
      post.body         = body;
      post.summary      = summarize(body, '<!--more-->');
      post.permalink    = permalink(file.path);

      posts.push(post);
      this.push(file);
      next();
    }, function(done) {
      posts.sort(function(a, b) {
        return Date.parse(b.publishedOn) - Date.parse(a.publishedOn);
      });

      site.posts = posts;
      done();
    });
  };

  gulp.task('sass', function() {
    return gulp.src('src/sass/**/*.scss')
               .pipe(plugins.sass({
                 outputStyle: 'compressed', errLogToConsole: true
               }))
               .pipe(gulp.dest('dist/css'))
               .pipe(reload({stream: true}));
  });

  gulp.task('posts', function(){
    return gulp.src('src/posts/**/*.md')
               .pipe(plugins.frontMatter({
                  property: 'page',
                  remove: true}))
               .pipe(plugins.marked())
               .pipe(collectPosts())
               .pipe(plugins.data({site:site}))
               .pipe(plugins.assignToPug('src/templates/post.pug', {
                 basedir: 'src/templates'
               }))
               .pipe(gulp.dest('dist/blog'))
               .pipe(reload({stream: true}));
  });

  gulp.task('pages', function(){
    return gulp.src('src/pages/**/*.pug')
               .pipe(plugins.data({site:site}))
               .pipe(plugins.pug())
               .pipe(gulp.dest('dist'))
               .pipe(reload({stream: true}));
  });

  gulp.task('content', function(cb) {
    plugins.sequence('posts', 'pages')(cb);
  });

  gulp.task('assets', function(cb) {
    plugins.sequence('sass')(cb);
  });

  gulp.task('watch', function(cb) {
    gulp.watch( [ 'src/templates/**/*.pug' ] , [ 'content' ] );
    gulp.watch( [ 'src/posts/**/*.md'      ] , [ 'content' ] );
    gulp.watch( [ 'src/pages/**/*.pug'     ] , [ 'content' ] );
    gulp.watch( [ 'src/sass/**/*.scss'     ] , [ 'assets'  ] );
    cb();
  });

  gulp.task('clean', function(cb) {
    del('dist/*');
    cb();
  });

  gulp.task('sync', function(){
    return bsync({server:{baseDir:'dist'}});
  });

  gulp.task('deploy', function() {
    return gulp.src('dist/**/*')
      .pipe(plugins.ghPages({}));
  });

  gulp.task('default', plugins.sequence('clean', 'assets', 'content', 'sync', 'watch'));

}());
