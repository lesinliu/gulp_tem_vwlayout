 // 引入gulp及插件
const gulp              = require('gulp'),  
      del               = require('del'), 
      scss              = require('gulp-sass'),//scss  
      babel             = require('gulp-babel'),
      concat            = require('gulp-concat'),//多个文件合并为一个；  
      ugLify            = require('gulp-uglify'),//压缩js  
      changed           = require('gulp-changed'),//检查改变状态  
      htmlMin           = require('gulp-htmlmin'),//压缩html  
      fileinclude       = require('gulp-file-include');
      cleanCSS          = require('gulp-clean-css'),//- 压缩CSS为一行；  
      imageMin          = require('gulp-imagemin'),//压缩图片  
      pngquant          = require('imagemin-pngquant'), // 深度压缩  
      plumber           = require('gulp-plumber'), // 出错不中断
      runSequence       = require('run-sequence'),
      browserSync       = require("browser-sync").create();//浏览器实时刷新 
// 引入postcss及插件
const postcss           = require('gulp-postcss'),
      bem               = require('postcss-bem'),
      cssNext           = require('postcss-cssnext'),
      autoprefixer      = require('autoprefixer'),
      postcssSimpleVars = require("postcss-simple-vars"),
      postcssMixins     = require("postcss-mixins"),
      postcssNested     = require("postcss-nested"),
      postClean         = require('postcss-clean'),
      sourcemaps        = require("gulp-sourcemaps"),
      postcsswritesvg   = require('postcss-write-svg') // 解决1px方案
      pxtoviewport      = require('postcss-px-to-viewport'); // 代码中写px编译后转化成vm

// ========================= 删除dist下的所有文件 ========================= 
gulp.task('delete', (cb) => {  
    return del(['src/scss/css/**/*.css','dist/*','!dist/images'],cb);  
})  
  
// ========================= 压缩html =========================  
gulp.task('html', () => {  
    var options = {  
        removeComments: true,//清除HTML注释  
        collapseWhitespace: true,//压缩HTML  
        removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"  
        removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"  
        minifyJS: true,//压缩页面JS  
        minifyCSS: true//压缩页面CSS  
    };  
    gulp.src(['src/**/*.html','!src/views/include/**.html'])  
        .pipe( plumber() ) 
        .pipe(fileinclude({
            prefix: '@@',
            basepath: './src/views/include'
        }))
        .pipe(changed('dist', {hasChanged: changed.compareSha1Digest}))  
        // .pipe(htmlMin(options))  //压缩html
        .pipe(gulp.dest('dist'))  
        .pipe(browserSync.reload({stream:true}));  
});  

// ========================= 实时编译scss =========================  
// gulp.task('scss', () => {  
//     gulp.src('src/scss/**/*.scss') //多个文件以数组形式传入  
//         .pipe( plumber() ) 
//         .pipe(changed('src/scss/css', {hasChanged: changed.compareSha1Digest})) 
//         .pipe(scss())//编译scss文件  
//         .pipe(concat('main.css'))//合并之后生成main.css
//         // .pipe(cleanCSS())//此处不压缩，后期备忘  
//         .pipe(gulp.dest('src/scss/css'))//将会在css下生成main.css  
//         .pipe(browserSync.reload({stream:true}));   
// });  

// ========================= postcss处理css =========================
gulp.task("postcss", () => {
    let processors = [
        pxtoviewport({
            viewportWidth: 750,
            viewportHeight: 1334,
            unitPrecision: 5,
            viewportUnit: 'vw',
            selectorBlackList: [],
            minPixelValue: 1,
            mediaQuery: false
        }),
        autoprefixer({
            browsers: ["Android 4.1", "iOS 7.1", "Chrome > 31", "ff > 31", "ie >= 10"]
        }),
        postClean()
    ];
    gulp.src(['src/scss/**/*.scss'])
        .pipe( plumber() ) 
        .pipe(scss())//编译scss文件  
        .pipe(changed('src/scss/**/*.scss', {hasChanged: changed.compareSha1Digest}))
        .pipe(concat('main.css'))//合并之后生成main.css
        .pipe(postcss(processors))
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write("maps"))
        .pipe(gulp.dest("dist/css"))
        .pipe(browserSync.reload({stream:true}));  
});

// ========================= 压缩js =========================  
gulp.task("script",() => {  
    gulp.src(['src/js/**/*.js'])  
        .pipe(changed('dist/js', {hasChanged: changed.compareSha1Digest}))  
        .pipe( plumber() ) 
        .pipe(babel({presets:['es2015']}))
        .pipe(concat('index.js'))  
        .pipe(ugLify())  
        .pipe(gulp.dest('dist/js'))  
        .pipe(browserSync.reload({stream:true}));  
});  

//  ========================= 压缩图片 =========================
gulp.task('images', () => {  
    gulp.src('src/images/*.*')  
        .pipe(changed('dist/images', {hasChanged: changed.compareSha1Digest}))  
        .pipe(imageMin({  
            progressive: true,// 无损压缩JPG图片  
            svgoPlugins: [{removeViewBox: false}], // 不移除svg的viewbox属性  
            use: [pngquant()] // 使用pngquant插件进行深度压缩  
        }))  
        .pipe(gulp.dest('dist/images'))  
        .pipe(browserSync.reload({stream:true}));  
});  
  
// ========================= 启动热更新 ========================= 
gulp.task('serve', (cb) => { 
    runSequence(// 同步执行任务
        'delete',
        // 'scss',
        'script',
        'postcss',
        'html',
        cb
    );  
    browserSync.init({  
        port: 2018,  
        server: {  
            baseDir: ['dist']  
        }  
    });  
    gulp.watch('src/js/**/*.js', ['script']);//监控文件变化，自动更新  
    // gulp.watch('src/scss/**/*.scss', ['scss']);  
    gulp.watch('src/scss/**/*.scss', ['postcss']);  
    gulp.watch('src/images/*.*', ['images']);  
    gulp.watch('src/**/*.html', ['html']);  
});  

// =========================默认任务=========================
gulp.task('default',['serve']);  