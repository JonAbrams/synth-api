var path = require('path');

var handlersParser = require('./lib/handlersParser');
var registerHandlers = require('./lib/registerHandlers');

exports.generateHandlers = function (options) {
  options = options || {};

  var app = options.app;

  var handlers = handlersParser.parse({
    resourceDir: options.resourceDir || path.join( process.cwd(), 'resources'),
    timeout: options.timeout || 5000,
    prefix: options.prefix || '/api'
  });

  if (app) registerHandlers(handlers, app, options.catchAll);

  return {
    handlers: handlers
  };
};
