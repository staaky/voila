# Voilà

Voilà is a [jQuery](http://jquery.com) plugin that provides callbacks for images, letting you know when they've loaded.

[voila.nickstakenburg.com](http://voila.nickstakenburg.com)

Voilà has an API inspired by [imagesLoaded](https://github.com/desandro/imagesloaded), extended with useful methods like `abort()` and support for `naturalWidth` and `naturalHeight` in all browsers, which makes it compatible with *IE6 & IE7*. Multiple loading methods are supported, by default callbacks are triggered as soon as naturalWidth is available, making Voilà faster than alternatives that wait for `onload` to fire.

## Install

Get a packaged source file:

+ [voila.pkgd.js](https://raw.githubusercontent.com/staaky/voila/master/voila.pkgd.js)
+ [voila.pkgd.min.js](https://raw.githubusercontent.com/staaky/voila/master/voila.pkgd.min.js)

Include Voilà below [jQuery](http://jquery.com):

```
<script type="text/javascript" src="jquery.min.js"></script>
<script type="text/javascript" src="voila.pkgd.min.js"></script>
```

Alternatively Voilà can be installed using [Bower](http://bower.io):

```
bower install voila
```

## Usage

```
$(element).voila([options][, callback]);
```

```js
// For example
$('#container').voila(callback);
$('#container').voila({ natural: false }, callback);
```

+ `options` - _Object_ - (optional) An object with Options
+ `callback` - _Function_ - (optional) A function called when all images have been loaded

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

+ `natural` - _Boolean_ - Callbacks are called as soon as `naturalWidth/Height` are available when `true` (the default). Using `false` will call callbacks as soon as `onload` fires on a detached Image object, which is slower, but can give the image more time to render.

```js
// give images more time to render with natural:false
$('#container').voila({ natural: false }, function(instance) {
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

+ `voila.images` - _Array_ - Contains an `image` object for each `img` element found
+ `voila.abort()` - Aborts all callbacks
+ `voila.always(callback)` - Add a callback called after all images finished loading
+ `voila.progress(callback)` - Add a callback called as each image finishes loading
+ `voila.fail(callback)` - Add a callback called if one or more images fail to load
+ `voila.done(callback)` - Add a callback called after all images have succesfully loaded

Within the callbacks the `voila` instance is always the first argument, the second one can be an `image` object.

+ `image.img` _ImageElement_ - The `img` element as found in the DOM
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
