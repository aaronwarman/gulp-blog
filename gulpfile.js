(function() {

  var gulp    = require('gulp');
  var plugins = require('gulp-load-plugins')();
  var del     = require('del');
  var bsync   = require('browser-sync');
  var reload  = bsync.reload;
  var through = require('through2');
  
  var site    = {title: 'Aarons Blog'};

  var postExtractor = function(){
    var posts = [];
    var extractPost = function(file, enc, cb){
    var post = {
        body : file.contents.toString()
      };
        posts.push(post);
        cb(null, file);
  };
  var savePosts = function(cb){
      site.posts = posts; 
      cb();
    };
    return through.obj(extractPost, savePosts);
  };

  gulp.task('sass', function() {
    return gulp.src('src/sass/**/*.sass')
               .pipe(plugins.sass({
                 outputStyle: 'compressed', errLogToConsole: true
               }))
               .pipe(gulp.dest('dist/css'))
               .pipe(reload({stream: true}));
  });

  gulp.task('posts', function(){
    return gulp.src('src/posts/**/*.md')
               .pipe(plugins.marked())
               .pipe(postExtractor())
               .pipe(gulp.dest('dist/posts'))
               .pipe(reload({stream: true}));
  });

  gulp.task('pages', function(){
    return gulp.src('src/pages/**/*.nunjucks')
               .pipe(plugins.data({site:site}))
               .pipe(plugins.nunjucksRender({ path: 'src/templates' }))
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
    gulp.watch( [ 'src/templates/**/*.nunjucks'], [ 'content']);
    gulp.watch( [ 'src/posts/**/*.md'],           [ 'content']);
    gulp.watch( [ 'src/pages/**/*.nunjucks'],     [ 'content']);
    gulp.watch( [ 'src/sass/**/*.sass'],          [ 'assets']);
    cb();
  });

  gulp.task('clean', function(cb) {
    del('dist/*');
    cb();
  });

  gulp.task('sync', function(){
    return bsync({server:{baseDir:'dist'}});
  });

  gulp.task('default', plugins.sequence('clean', 'assets', 'content', 'sync', 'watch'));

}());
