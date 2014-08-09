var fs = require('fs');
var path = require('path');

module.exports = function (di, options) {
  var serviceDir = options.serviceDir;

  if ( !fs.existsSync(serviceDir) ) return;
    
  (function parseDir (dir) {
    var contents = fs.readdirSync(dir).sort();
    contents.forEach(function (file) {
      if ( /\.(js|coffee)$/.test(file) ) {
        parseFile(dir + '/' + file);
      } else if ( fs.lstatSync( path.join(dir, file) ).isDirectory() ) {
        parseDir(dir + '/' + file);
      }
    });
  })(serviceDir);

  function parseFile (file) {
    var module = require(file);

    for (var funcName in module) {
      // skip functions starting with _
      if (funcName[0] !== '_') {
        di.register(funcName, module[funcName]);
      }
    }
  }
};
