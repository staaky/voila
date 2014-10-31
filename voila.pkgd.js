/*!
 * Voilà - v1.0.1
 * (c) 2014 Nick Stakenburg
 *
 * MIT License
 */

// Use AMD or window
;(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (jQuery && !window.Voila) {
    window.Voila = factory(jQuery);
  }
}(function($) {

var _slice = Array.prototype.slice;

var Supports = {
  naturalWidth: (function() {
    return ('naturalWidth' in new Image())
  })()
};

function Voila(elements, options, callback) {
  if (!(this instanceof Voila)) {
    return new Voila(elements, options, callback);
  }

  this.options = $.extend({
    render: true
  }, $.type(options) == 'object' ? options : callback || {});

  this.deferred = new jQuery.Deferred();

  // if there's a callback, push it onto the stack
  if ($.type(callback) == 'function') {
    this.always(callback);
  }

  this._processed = 0;
  this.images = [];
  this._add(elements);

  return this;
};

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
            this._progress(image)
          }, this),
          // error
          $.proxy(function(image) {
            this._progress(image)
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


var ImageReady = function() { return this.initialize.apply(this, _slice.call(arguments)); };
$.extend(ImageReady.prototype, {
  initialize: function(img, successCallback, errorCallback) {
    this.img = $(img)[0];
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.isLoaded = false;

    this.options = $.extend({
      render: true,
      tickFallbackAfter: 1000
    }, arguments[3] || {});

    // can exit out right away if we have a naturalWidth
    if (this.img.complete && $.type(this.img.naturalWidth) != 'undefined') {
      setTimeout($.proxy(function() {
        if (this.img.naturalWidth > 0) {
          this.isLoaded = true;
          this.successCallback(this);
        } else {
          this.errorCallback(this);
        }
      }, this));
      return;
    }

    // fallback for browsers without support for naturalWidth/Height
    // IE7-8
    // we also use it to wait for complete image loading
    if (!Supports.naturalWidth || this.options.render) {
      // timeout allows callbacks to be attached
      setTimeout($.proxy(this.fallback, this));
      return;
    }

    // we instantly bind to onerror so we catch right away
    // timeout allows callbacks to be attached
    $(this.img).bind('error', $.proxy(function() {
      setTimeout($.proxy(function() {
        this.error();
      }, this));
    }, this));

    this.intervals = [
      [1 * 1000, 10],
      [2 * 1000, 50],
      [4 * 1000, 100],
      [20 * 1000, 500]
    ];

    // for testing, 2sec delay
    //this.intervals = [[20 * 1000, 2000]];

    this._ipos = 0;
    this._time = 0;
    this._delay = this.intervals[this._ipos][1];

    this.poll();
  },

  poll: function() {
    this._ticking = setTimeout($.proxy(function() {
      if (this.img.naturalWidth > 0) {
        this.success();
        return;
      }

      // update time spend
      this._time += this._delay;

      // use a fallback after waiting
      if (this.options.pollFallbackAfter &&
          this._time >= this.options.pollFallbackAfter &&
          !this._usedPollFallback) {
        this._usedPollFallback = true;
        this.fallback();
      }

      // next i within the interval
      if (this._time > this.intervals[this._ipos][0]) {
        // if there's no next interval, we asume
        // the image image errored out
        if (!this.intervals[this._ipos + 1]) {
          this.error();
          return;
        }

        this._ipos++;

        // update to the new bracket
        this._delay = this.intervals[this._ipos][1];
      }

      this.poll();
    }, this), this._delay);
  },

  fallback: function() {
    var img = new Image();
    this._fallbackImg = img;

    img.onload = $.proxy(function() {
      img.onload = function() {};

      if (!Supports.naturalWidth) {
        this.img.naturalWidth = img.width;
        this.img.naturalHeight = img.height;
      }

      this.success();
    }, this);

    img.onerror = $.proxy(this.error, this);

    img.src = $(this.img).attr('src');
  },

  abort: function() {
    if (this._fallbackImg) {
      this._fallbackImg.onload = function() { };
    }

    if (this._ticking) {
      clearTimeout(this._ticking);
      this._ticking = 0;
    }
  },

  success: function() {
    if (this._calledSuccess) return;
    this._calledSuccess = true;

    this.isLoaded = true;
    this.successCallback(this);
  },

  error: function() {
    if (this._calledError) return;
    this._calledError = true;

    this.abort();
    if (this.errorCallback) this.errorCallback(this);
  }
});

return Voila;

}));
