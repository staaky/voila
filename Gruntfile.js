module.exports = function(grunt) {

  // Config
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    dirs: {
      dest: ''
    },

    vars: { },

    concat: {
      production: {
        options: {
          process: true
        },
        src: [
        'src/umd-head.js',

        // core
        'src/voila.js',
        'src/imageready.js',

        'src/umd-tail.js'
        ],
        dest: 'voila.pkgd.js'
      }
    },

    uglify: {
      production: {
        options: {
          preserveComments: 'some'
        },
        'src': ['voila.pkgd.js'],
        'dest': 'voila.pkgd.min.js'
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Tasks
  grunt.registerTask('default', [
    'concat:production', 'uglify:production'
  ]);
};
