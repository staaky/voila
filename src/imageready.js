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
