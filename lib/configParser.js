var handlers = null;

module.exports = exports = function () {
  return function (req, res, next) {
    if (handlers === null) {
      throw "Cannot use synth-api configParser middleware until it is initialized";
    }

    var matching = handlers.filter(function (handler) {
      return handler.path === req.path && req.method === handler.method.toUpperCase();
    });
    if (matching.length === 0) {
      req.config = {};
    } else {
      req.config = matching[0].config;
    }

    next();
  };
};

exports.init = function (newHandlers) {
  handlers = newHandlers;
};
