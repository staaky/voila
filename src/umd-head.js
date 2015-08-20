/*!
 * Voilà - v<%= pkg.version %>
 * (c) <%= grunt.template.today("yyyy") %> Nick Stakenburg
 *
 * http://voila.nickstakenburg.com
 *
 * MIT License
 */

// UMD wrapper
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser global
    root.Voila = factory(jQuery);
  }
}(this, function($) {
