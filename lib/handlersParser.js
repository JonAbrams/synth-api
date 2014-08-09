var fs = require('fs'),
    path = require('path'),
    methods = require('methods'),
    Promise = require('bluebird'),
    DI = require('synth-di'),
    registerServices = require('./registerServices'),
    utils = require('./utils');

var resourceDir;
var resourceStack = [];
var apiTimeout;
var prefix;
var di = new DI();

function productionMode () {
  return process.env.NODE_ENV === 'production';
}

function Handler (file, method, path, isCustom, funcName, config) {
  this.file = file;
  this.method = method;
  this.path = path;
  this.isCustom = isCustom;
  this.funcName = funcName;
  this.config = config;
  this.resources = resourceStack.slice();
}

Handler.prototype.func = function (direct) {
  var handler = this;
  var func = require(this.file)[this.funcName];

  return function (req, res, next) {
    return utils.pTimeout(
      di.exec(func, {
        req: req,
        res: res,
        next: next
      }),
      apiTimeout,
      'API Request timed out'
    )
    .then(function (result) {
      if (direct) return result;
      if (result) res.send(result);
    })
    .catch(function (err) {
      if (direct) return null;

      var msg = 'Error thrown by ' + handler.method.toUpperCase() + ' ' +
                handler.path;

      if (typeof err === 'number') {
        return res.status(err).end();
      }
      else if ('stack' in err) {
        msg += '\n' + err.stack + '\n';
      } else if (typeof err.message === 'string') {
        msg += ' : ' + err.message;
      }

      console.error(msg);

      /* Pass along the error to the client */
      var status = err.statusCode || 500;
      if (productionMode() && !err.public) {
        res.status(status).send('An error occurred');
      } else {
        res.status(status).send(err.message || err);
      }
    });
  };
};

function parsePath (file, action, method) {
  var pathArr = file.replace(resourceDir, '').split('/');
  pathArr.pop(); // Remove the script file from the path, will be replaced with the action
  pathArr.shift(); // Remove empty string at front

  var path = '';
  var isCustom = false;

  for (var i = 0; i < pathArr.length; i++) {
    path += pathArr[i];
    if (i < pathArr.length - 1) {
      path += '/:' + pathArr[i] + 'Id/';
    }
  }
  action = action.replace(method, '');
  if (method == 'post' && !action || method == 'get' && action == 'Index') {
    // Default action for post, and index action for get do not have an id
  } else if (!action) {
    // Default action for get, put, and delete
    path += '/:id';
  } else {
    isCustom = true;
    path += '/' + action[0].toLowerCase() + action.substr(1);
  }

  return {
    isCustom: isCustom,
    path: prefix + '/' + path
  };
}

function parseFile (file) {
  var method;
  var module = require(file);
  var handlers = [];
  var parsed;
  var config;

  for (var funcName in module) {
    // skip if starting with _
    if (funcName[0] !== '_') {
      func = module[funcName];

      config = {};
      if (typeof module.config === 'object') {
        for (var configKey in module.config) {
          config[configKey] = module.config[configKey];
        }
      }

      /* Get the lowercase string at the front */
      method = /^[a-z]*/.exec(funcName)[0];

      if ( methods.indexOf(method) != -1 ) {
        parsed = parsePath(file, funcName, method);
        handlers.push(
          new Handler(
            file,
            method,
            parsed.path,
            parsed.isCustom,
            funcName,
            config
          )
        );
      } else if (method === 'config') {
        /* Do nothing, not a request handler */
      } else {
        throw new Error('Unrecognized method: ' + method + ' from ' + file);
      }
    }
  }
  return handlers;
}

exports.parse = function (options) {
  registerServices(di, options);

  var handlers = [];
  resourceDir = options.resourceDir;
  apiTimeout = options.timeout;
  prefix = options.prefix;

  (function parseDir (dir) {
    var contents = fs.readdirSync(dir).sort();
    contents.forEach(function (file) {
      if ( /\.(js|coffee)$/.test(file) ) {
        handlers = handlers.concat(
          parseFile(dir + '/' + file)
        );
      } else if ( fs.lstatSync( path.join(dir, file) ).isDirectory() ) {
        resourceStack.push(file);
        parseDir(dir + '/' + file);
        resourceStack.pop();
      }
    });
  })(resourceDir);

  return handlers;
};
