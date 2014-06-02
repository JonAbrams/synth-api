var path = require('path');

require('should');

describe('handlersParser module', function () {
  var handlersParser = require('../lib/handlersParser.js');

  describe('good resources dir', function () {
    var rootDir = path.join(__dirname, 'sample_project/resources');
    var handlers = handlersParser.parse({
      resourceDir: rootDir,
      prefix: '/api',
      timeout: 5000
    });

    it('returns the expected structure', function () {
      handlers.should.eql([
        {
          file: path.join(rootDir, 'orders/create.js'),
          method: 'post',
          path: '/api/orders',
          isCustom: false,
          funcName: 'post',
          resources: [
            'orders'
          ]
        },
        {
          file: path.join(rootDir, 'products/get.js'),
          method: 'get',
          path: '/api/products',
          isCustom: false,
          funcName: 'getIndex',
          resources: [
            'products'
          ]
        },
        {
          file: path.join(rootDir, 'products/get.js'),
          method: 'get',
          path: '/api/products/:id',
          isCustom: false,
          funcName: 'get',
          resources: [
            'products'
          ]
        },
        {
          file: path.join(rootDir, 'products/get.js'),
          method: 'get',
          path: '/api/products/specials',
          isCustom: true,
          funcName: 'getSpecials',
          resources: [
            'products'
          ]
        },
        {
          file: path.join(rootDir, 'products/get.js'),
          method: 'get',
          path: '/api/products/oops',
          isCustom: true,
          funcName: 'getOops',
          resources: [
            'products'
          ]
        },
        {
          file: path.join(rootDir, 'products/get.js'),
          method: 'put',
          path: '/api/products/501Oops',
          isCustom: true,
          funcName: 'put501Oops',
          resources: [
            'products'
          ]
        },
        {
          file: path.join(rootDir, 'products/new.js'),
          method: 'post',
          path: '/api/products',
          isCustom: false,
          funcName: 'post',
          resources: [
            'products'
          ]
        },
        {
          file: path.join(rootDir, 'products/variations/variations.js'),
          method: 'post',
          path: '/api/products/:productsId/variations',
          isCustom: false,
          funcName: 'post',
          resources: [
            'products',
            'variations'
          ]
        },
        {
          file: path.join(rootDir, 'products/variations/variations.js'),
          method: 'get',
          path: '/api/products/:productsId/variations',
          isCustom: false,
          funcName: 'getIndex',
          resources: [
            'products',
            'variations'
          ]
        },
        {
          file: path.join(rootDir, 'products/yuck.js'),
          method: 'get',
          path: '/api/products/forever',
          isCustom: true,
          funcName: 'getForever',
          resources: [
            'products'
          ]
        },
      ]);
    });

    it('returns functions', function () {
      handlers[0].func().should.be.type('function');
    });
  });

  describe('bad resources dir', function () {
    var rootDir = path.join(__dirname, '/sample_project/badResources');

    it('throws an error', function () {
      (function () {
        handlersParser.parse({
          resourceDir: rootDir,
          prefix: '/api',
          timeout: 5000
        });
      }).should.throw( 'Unrecognized method: not from '+ path.join(rootDir, 'broken.js') );
    });
  });
});
