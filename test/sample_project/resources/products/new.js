exports.post = function (config) {
  config.auth = true;

  return function (req, res) {
    // create new product
    return { success: true };
  };
};
