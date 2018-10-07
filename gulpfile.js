const path          = require('path');
const gulp          = require('gulp');
const clean         = require('gulp-clean');
const cleancss      = require('gulp-clean-css');
const jeditor       = require("gulp-json-editor");
const browserify    = require('browserify');
const babelify      = require('babelify');
const source        = require('vinyl-source-stream');
const buffer        = require('gulp-buffer');
const sourcemaps    = require('gulp-sourcemaps');
const uglify        = require('gulp-uglify');

const JS_OUTPUT = 'game.js'
const JS_FOLDER = 'public/js';
const SOURCE_DIR = './src';
const BUILD_FOLDER = './production';
const PRODUCTION_FILES = [
    './routes/**/*',
    'server.js'
    ];

gulp.task('clean', function() {
    return gulp.src('production',{allowEmpty:true})
    .pipe(clean());
});

gulp.task('minifycss', () => {
    return gulp.src('public/css/*.css')
      .pipe(cleancss({compatibility: 'ie8'}))
      .pipe(gulp.dest(BUILD_FOLDER + '/public/css'));
});

gulp.task('compress', function() {
    return browserify(
        {
          paths: [path.join(__dirname, SOURCE_DIR)],
          entries: './src/index.js',
          debug: true
        })
        .transform(babelify.configure({presets:['@babel/preset-env']}))
        .bundle()
        .pipe(source(JS_OUTPUT))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(JS_FOLDER));
});

gulp.task('package', function(){
    return gulp.src("./package.json")
    .pipe(jeditor(function(json){
        json.devDependencies = {};
        return json;
    }))
    .pipe(gulp.dest(BUILD_FOLDER));
});

gulp.task('copylib', function(){
    return gulp.src('./node_modules/phaser/dist/phaser.min.js')
    .pipe(gulp.dest(JS_FOLDER + '/lib/'));
});

gulp.task('make', function() {
    return Promise.all([
        new Promise(function(resolve, reject){
            gulp.src('./public/**/*')
            .on('error', reject)
            .pipe(gulp.dest(BUILD_FOLDER + '/public/'))
            .on('end', resolve)
        }),
        new Promise(function(resolve, reject){
            gulp.src(PRODUCTION_FILES, { base: './' })
            .on('error', reject)
            .pipe(gulp.dest(BUILD_FOLDER))
            .on('end', resolve)
        }),
    ]);
});

gulp.task('build', gulp.series('compress', 'copylib'));

gulp.task('deploy', gulp.series('clean', 'compress', 'copylib', 'make', 'minifycss', 'package'));