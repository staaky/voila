/*!
 * Voilà - v1.2.0
 * (c) 2015 Nick Stakenburg
 *
 * http://voila.nickstakenburg.com
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

function Voila(elements, opts, cb) {
  if (!(this instanceof Voila)) {
    return new Voila(elements, opts, cb);
  }

  var argTypeOne = $.type(arguments[1]),
      options    = (argTypeOne === 'object' ? arguments[1] : {}),
      callback   = argTypeOne === 'function' ? arguments[1] :
                   $.type(arguments[2]) === 'function' ? arguments[2] : false;

  this.options = $.extend({
    method: 'onload'
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
$.fn.voila = function() {
  return Voila.apply(Voila, [this].concat(Array.prototype.slice.call(arguments)));
};

/* ImageReady (standalone) - part of Voilà
 * http://voila.nickstakenburg.com
 * MIT License
 */
var ImageReady = function() {
  return this.initialize.apply(this, Array.prototype.slice.call(arguments));
};

$.extend(ImageReady.prototype, {
  supports: {
    naturalWidth: (function() {
      return ('naturalWidth' in new Image());
    })()
  },

  // NOTE: setTimeouts allow callbacks to be attached
  initialize: function(img, successCallback, errorCallback) {
    this.img = $(img)[0];
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.isLoaded = false;

    this.options = $.extend({
      method: 'onload',
      pollFallbackAfter: 1000
    }, arguments[3] || {});

    // onload and a fallback for no naturalWidth support (IE6-7)
    if (this.options.method == 'onload' || !this.supports.naturalWidth) {
      setTimeout($.proxy(this.load, this));
      return;
    }

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

    // start polling
    this.poll();
  },

  // NOTE: Polling for naturalWidth is only reliable if the
  // <img>.src never changes. naturalWidth isn't always reset
  // to 0 after the src changes (depending on how the spec
  // was implemented). The spec even seems to be against
  // this, making polling unreliable in those cases.
  poll: function() {
    this._polling = setTimeout($.proxy(function() {
      if (this.img.naturalWidth > 0) {
        this.success();
        return;
      }

      // update time spend
      this._time += this._delay;

      // use load() after waiting as a fallback
      if (this.options.pollFallbackAfter &&
          this._time >= this.options.pollFallbackAfter &&
          !this._usedPollFallback) {
        this._usedPollFallback = true;
        this.load();
      }

      // next i within the interval
      if (this._time > this.intervals[this._ipos][0]) {
        // if there's no next interval, we assume
        // the image errored out
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

  load: function() {
    var image = new Image();
    this._onloadImage = image;

    image.onload = $.proxy(function() {
      image.onload = function() {};

      if (!this.supports.naturalWidth) {
        this.img.naturalWidth = image.width;
        this.img.naturalHeight = image.height;
      }

      this.success();
    }, this);

    image.onerror = $.proxy(this.error, this);

    image.src = this.img.src;
  },

  success: function() {
    if (this._calledSuccess) return;

    this._calledSuccess = true;

    // stop loading/polling
    this.abort();

    // some time to allow layout updates, IE requires this!
    this._successRenderTimeout = setTimeout($.proxy(function() {
      this.isLoaded = true;
      this.successCallback(this);
    }, this));
  },

  error: function() {
    if (this._calledError) return;

    this._calledError = true;

    // stop loading/polling
    this.abort();

    this._errorRenderTimeout = setTimeout($.proxy(function() {
      if (this.errorCallback) this.errorCallback(this);
    }, this));
  },

  abort: function() {
    this.stopLoading();
    this.stopPolling();
    this.stopWaitingForRender();
  },

  stopPolling: function() {
    if (!this._polling) return;
    clearTimeout(this._polling);
    this._polling = null;
  },

  stopLoading: function() {
    if (!this._onloadImage) return;
    this._onloadImage.onload = function() { };
    this._onloadImage.onerror = function() { };
  },

  stopWaitingForRender: function() {
    if (this._successRenderTimeout) {
      clearTimeout(this._successRenderTimeout);
      this._successRenderTimeout = null;
    }

    if (this._errorRenderTimeout) {
      clearTimeout(this._errorRenderTimeout);
      this._errorRenderTimeout = null;
    }
  }
});

return Voila;

}));
