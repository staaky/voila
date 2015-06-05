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
  for (var v = 9;v>=7;v--) {
    if (Browser.IE < v) $('html').addClass('lt-ie' + v);
  }
})(Browser.IE);


var Support = {
  svg: (!!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect)
};

$('html').addClass((Support.svg ? '' : 'no-') + 'svg');


var Demo = {
  initialize: function() {
    this.element = $('#demo');
    this.images = $('#images');
    this._items = 6;
    this._loading = 0;
    this._debug = true;

    Progress.initialize({ items: this._items });

    this.reset();

    this.naturalWidthChange();

    this.startObserving();
  },

  setOptions: function(options) {
    this.options = $.extend({}, options || {});
  },

  startObserving: function() {
    $('#add').on('click', $.proxy(this.add, this));
    $('#reset').on('click', $.proxy(this.reset, this));
    $('#naturalWidth').on('change', $.proxy(this.naturalWidthChange, this));
  },

  add: function() {
    this.abort();


    this.images.prepend(Images.getFragment(this._items))
               .removeClass('is-empty');

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
    this.images.html('').addClass('is-empty');
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

  naturalWidthChange: function() {
    this.setOptions({
      method: $('#naturalWidth').prop('checked') ? 'naturalWidth' : 'onload'
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
    $(document.body).append(this.element = $('<div>')
      .attr({ id: 'progress' })
    );

    if (this._supported) {
      this.element.append(this.progress = $('<progress>'));
    }

    this.options = $.extend({
      items: this._supported ? 6 : 0
    }, arguments[0] || {});

    this._max = this.options.items;
    this._at = 0;

    this.element.hide();
  },

  setMax: function(max) {
    this._max = max;
  },

  reset: function(noUpdate) {
    this._at = 0;
    if (!noUpdate) this.update(0);
  },

  update: function(value) {
    if (this.progress) {
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

  show: function() {
    if (Browser.IE && Browser.IE < 7) return;
    this.element.stop(true).fadeTo(200, 1);
  },
  hide: function() { this.element.stop(true).fadeOut(); }
};

// start
$(document).ready(function() {
  Demo.initialize();
});

})(jQuery);
