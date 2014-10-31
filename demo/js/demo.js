(function($) {

var Browser = (function(uA) {
  function getVersion(identifier) {
    var version = new RegExp(identifier + '([\\d.]+)').exec(uA);
    return version ? parseFloat(version[1]) : true;
  }

  return {
    IE: !!(window.attachEvent && uA.indexOf('Opera') === -1) && getVersion('MSIE ')
  };
})(navigator.userAgent);

(function(IE) {
  if (!IE) return;
  if (IE < 7) $('html').addClass('lt-ie7');
  if (IE < 9) $('html').addClass('lt-ie9');
})(Browser.IE);


var Demo = {
  initialize: function() {
    this.element = $('#demo');
    this.images = $('#images');
    this._items = 6;
    this._loading = 0;
    this._debug = true;

    Progress.initialize({ items: this._items });

    this.renderChange();

    this.startObserving();
  },

  setOptions: function(options) {
    this.options = $.extend({}, options || {});
  },

  startObserving: function() {
    $('#add').on('click', $.proxy(this.add, this));
    $('#reset').on('click', $.proxy(this.reset, this));
    $('#render').on('change', $.proxy(this.renderChange, this));
  },

  add: function() {
    this.abort();

    this.images.prepend(Images.getFragment(this._items));

    var images = this.images.find('.is-loading img');

    // update the max value in the progress bar
    // multiple clicks can increase the amount
    this._loading += this._items;
    Progress.setMax(this._loading);

    this.voila = $(images).voila(this.options)
      .progress(function(instance, image) {
        $(image.img).parent().attr({ 'class': image.isLoaded ? '' : 'is-broken' });
        Progress.tick();
      })
      .always($.proxy(function() {
        this._loading = 0;
        Progress.reset(true);
        Progress.hide();
      }, this));


    // add dimensions
    if ($('#dimensions').prop('checked')) {
      this.voila.progress(function(instance, image) {
        if (!image.isLoaded) return;

        $(image.img).parent().append($('<span>').addClass('dimensions')
          .html(image.img.naturalWidth + 'x' + image.img.naturalHeight)
        );
      });
    }

  },

  reset: function() {
    this.images.html('');
    this.abort();
    this._loading = 0;
    Progress.reset(true);
    Progress.hide();
  },

  abort: function() {
    if (this.voila) {
      this.voila.abort();
      this.voila = null;
    }
  },

  renderChange: function() {
    this.setOptions({
      render: $('#render').prop('checked')
    });
  }
};

var Images = {
  getFragment: function(amount) {
    var fragment = $(),
        amount = amount || 1;

    for (var i=0;i<amount;i++) fragment = fragment.add(this._getItem());

    return fragment;
  },

  _getItem: function() {
    var item = $('<div>').addClass('is-loading')
    .append($('<i>').addClass('spinner'));

    var multiplier = Math.random() * 3 + 1,
        width = Math.round((Math.random() * 120 + 100) * multiplier),
        height = Math.round(150 * multiplier),
        broken = Math.floor((Math.random() * 10) + 1) == 1;

    item.append($('<img>').attr({
      src: broken ? '//broken-image.png' : 'http://lorempixel.com/' + width + '/' + height
    }));

    return item;
  }
};

var Progress = {
  _supported: (function() {
    return (document.createElement('progress').max !== undefined);
  })(),

  initialize: function() {
    this.element = $('#progress');
    this.progress = this.element.find('progress');

    this.options = $.extend({
      items: this._supported ? parseInt(this.progress.attr('max')) : 0
    }, arguments[0] || {});

    this._max = this.options.items;
    this._at = 0;

    this.hide();
  },

  setMax: function(max) {
    this._max = max;
  },

  reset: function(noUpdate) {
    this._at = 0;
    if (!noUpdate) this.update(0);
  },

  update: function(value) {
    if (this._supported) {
      this.progress.attr({ value: value, max: this._max });
    } else {
      this.element.html(value + ' / ' + this._max);
    }

    this[this._at < this._max && this._at > 0 ? 'show' : 'hide']();
  },

  tick: function() {
    this._at++;
    this.update(this._at);
  },

  show: function() { this.element.css({ opacity: 1 }); },
  hide: function() { this.element.css({ opacity: 0 }); }
};

// start
$(document).ready(function() {
  Demo.initialize();
});

})(jQuery);
