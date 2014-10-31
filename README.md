# Voilà

Voilà is a [jQuery](http://jquery.com) plugin that provides callbacks for images, letting you know when they've loaded.

Its API is inspired by [imagesLoaded](http://imagesloaded.desandro.com). Voilà extends this by adding useful methods like `abort()` and support for `naturalWidth/Height` in all browsers, making it compatible with IE6 and IE7.

Voilà also comes with an alternative loading method that allows callbacks to be used as soon as naturalWidth/Height are available, even while images are still rendering.

## Install

Get a packaged source file:

+ [voila.pkgd.js](https://raw.githubusercontent.com/staaky/voila/master/voila.pkgd.js)
+ [voila.pkgd.min.js](https://raw.githubusercontent.com/staaky/voila/master/voila.pkgd.min.js)

Include Voilà below jQuery:

```
<script type="text/javascript" src="http://code.jquery.com/jquery-1.11.1.min.js"></script>
<script type="text/javascript" src="voila.pkgd.min.js"></script>
```

## Usage

```
$(element).voila([options][, callback]);
```

```js
// For example
$('#container').voila(callback);
$('#container').voila({ render: false }, callback);
```

+ `options` _Object_ - (optional) An object with Options
+ `callback` _Function_ - (optional) A function called when all images have been loaded

Using a callback is the same as using `always()`:

```js
$('#container').voila().always(callback);
```

Additional callbacks can be attached using `always()`, `progress()`, `fail()` and `done()`:

```js
$('#container').voila()
  .always(function(instance) {
    console.log('ALWAYS - All images have finished loading');
  )
  .progress(function(instance, image) {
    var status = image.isLoaded ? 'loaded' : 'broken';
    console.log('PROGRESS - Image ' + status + ': ' + image.img.src);
  })
  .fail(function(instance) {
    console.log('FAIL - All images finished loading, but some are broken');
  })
  .done(function(instance) {
    console.log('DONE - All images finished loading succesfully');
  });
```

## Options

Options can be set as the first parameter.

+ `render` - _Boolean_ - Wait for images to fully render before using callbacks when `true` (the default), or as soon as naturalWidth/Height are available when `false`. Using `false` means images could still be rendering as callbacks are called.

```js
$('#container').voila({ render: false }, function(instance) {
  console.log('naturalWidth/Height available, some images might still be rendering');
  $.each(instance.images, function(i, image) {
    var img = image.img;
    console.log(img.src + ' = ' + img.naturalWidth + 'x' + img.naturalHeight);
  });
});
```

## API

A `voila` instance can be stored, exposing some extra properties and functions:

```js
var voila = $('#container').voila();
```

+ `voila.images` _Array_ - contains an `image` object for each `img` element found
+ `voila.abort()` - aborts all callbacks
+ `voila.always(callback)` - Add a callback called after all images finished loading
+ `voila.progress(callback)` - Add a callback called as each image finishes loading
+ `voila.fail(callback)` - Add a callback called if one or more images fail to load
+ `voila.done(callback)` - Add a callback called after all images have succesfully loaded

Within the callbacks the `voila` instance is always the first argument, the second one can be an `image` object.

+ `image.img` _ImageElement_ - the `img` element
+ `image.isLoaded` _Boolean_ - `true` when succesfully loaded

Here's how to find out which images have succesfully loaded within the always callback:

```js
$('#container').voila(function(instance) {
  $.each(instance.images, function(i, image) {
    var status = image.isLoaded ? 'loaded' : 'broken';
    console.log(status + ': ' + image.img.src);
  });
});
```

## License

Voilà is [MIT Licensed](https://raw.githubusercontent.com/staaky/voila/master/LICENSE.txt).

* * *

By [Nick Stakenburg](http://www.nickstakenburg.com)
