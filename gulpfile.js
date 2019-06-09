const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageResize = require('gulp-image-resize');
const rename = require('gulp-rename');

gulp.task('images', () => {

  //   specify different image sizes
  const sizes = [
    { width: 320, quality: 40, suffix: 'small' },
    { width: 480, quality: 60, suffix: 'medium' },
    { width: 800, quality: 80, suffix: 'large' },
  ];
  let stream;
  sizes.forEach((size) => {
    stream = gulp
      //     source for images to optimize
      .src('./img/**/*.{gif,jpg,png,svg}')
      //     resize image
      .pipe(imageResize({ width: size.width }))
      //       add suffix to image
      .pipe(
        rename((path) => {
          path.basename += `-${size.suffix}`;
        }),
      )
      //     reduce image quality based on the size
      .pipe(
        imagemin(
          [
            imageminMozjpeg({
              quality: size.quality,
            }),
          ],
          {
            verbose: true,
          },
        ),
      )
      //     output optimized images to a destination folder
      .pipe(gulp.dest('./img-res/'));
  });
  return stream;
});
