/*!
 * Voilà - v<%= pkg.version %>
 * (c) <%= grunt.template.today("yyyy") %> Nick Stakenburg
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
