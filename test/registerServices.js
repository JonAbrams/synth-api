require('should');

var path = require('path');
var _ = require('lodash');

describe('registerServices', function () {
  var DI = require('synth-di');
  var di = new DI();
  var registerServices = require('../lib/registerServices');
  var serviceDir = path.join(__dirname, 'sample_project/services');

  it('registers services', function () {
    registerServices(di, { serviceDir: serviceDir });
    _.pluck(di.services, 'name').should.eql(['user', 'db']);
    _.pluck(di.services, 'dependencyNames').should.eql([['db', 'req'], []]);
  });
});
