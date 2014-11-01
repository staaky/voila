function Voila(elements, opts, cb) {
  if (!(this instanceof Voila)) {
    return new Voila(elements, opts, cb);
  }

  var argTypeOne = $.type(arguments[1]),
      options    = (argTypeOne === 'object' ? arguments[1] : {}),
      callback   = argTypeOne === 'function' ? arguments[1] :
                   $.type(arguments[2]) === 'function' ? arguments[2] : false;

  this.options = $.extend({
    render: true
  }, options);

  this.deferred = new jQuery.Deferred();

  // if there's a callback, push it onto the stack
  if (callback) {
    this.always(callback);
  }

  this._processed = 0;
  this.images = [];
  this._add(elements);

  return this;
}

$.extend(Voila.prototype, {
  _add: function(elements) {
    // normalize to an array
    var array = $.type(elements) == 'string' ? $(elements) : // selector
                (elements instanceof jQuery) || elements.length > 0 ? elements : // jQuery obj, Array
                [elements]; // element node

    // subtract the images
    $.each(array, $.proxy(function(i, element) {
      var images = $(),
          $element = $(element);

      // single image
      if ($element.is('img')) {
        images = images.add($element);
      } else {
        // nested
        images = images.add($element.find('img'));
      }

      images.each($.proxy(function(i, element) {
        this.images.push(new ImageReady(element,
          // success
          $.proxy(function(image) {
            this._progress(image);
          }, this),
          // error
          $.proxy(function(image) {
            this._progress(image);
          }, this),
          // options
          this.options
        ));
      }, this));
    }, this));

    // no images found
    if (this.images.length < 1) {
      setTimeout($.proxy(function() {
        this._resolve();
      }, this));
    }
  },

  abort: function() {
    // clear callbacks
    this._progress = this._notify = this._reject = this._resolve = function() { };

    // clear images
    $.each(this.images, function(i, image) {
      image.abort();
    });
    this.images = [];
  },

  _progress: function(image) {
    this._processed++;

    // when a broken image passes by keep track of it
    if (!image.isLoaded) this._broken = true;

    this._notify(image);

    // completed
    if (this._processed == this.images.length) {
      this[this._broken ? '_reject' : '_resolve']();
    }
  },

  _notify: function(image) { this.deferred.notify(this, image); },
  _reject: function() { this.deferred.reject(this); },
  _resolve: function() { this.deferred.resolve(this); },

  always: function(callback) {
    this.deferred.always(callback);
    return this;
  },

  done: function(callback) {
    this.deferred.done(callback);
    return this;
  },

  fail: function(callback) {
    this.deferred.fail(callback);
    return this;
  },

  progress: function(callback) {
    this.deferred.progress(callback);
    return this;
  }
});

// extend jQuery
$.fn.voila = function(callback, options) {
  return Voila.apply(Voila, [this].concat(_slice.call(arguments)));
};

