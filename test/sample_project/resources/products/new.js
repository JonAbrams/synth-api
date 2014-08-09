exports.post = function (user) {
  if (!user) throw 401;

  return { success: true };
};
