var synthApi = require('../main');

var request = require('supertest-as-promised');
var express = require('express');
var bodyParser = require('body-parser');

require('should');

describe('synth-api module', function () {
  var app;
  before(function () {
    app = express();
    app.use(bodyParser());
    app.use(synthApi.configParser());
    app.use(function (req, res, next) {
      if (req.config.admin) {
        return res.send(401);
      }
      next();
    });
    synthApi.generateHandlers({
      resourceDir: __dirname + '/sample_project/resources',
      serviceDir: __dirname + '/sample_project/services',
      app: app,
      timeout: 100
    });
  });

  describe('the api', function () {
    it('fetches the list of products', function () {
      return request(app).get('/api/products')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({
        injection: "<script>alert('hi')</script>",
        products: [
          {
            name: "Fancy Shoes",
            price: 99.99
          }
        ]
      });
    });

    it('cannot call a configed endpoint', function () {
      return request(app).post('/api/products/asAdmin')
      .send({ name: "Fancy shoes" })
      .expect(401);
    });

    it('cannot create a new product without auth', function () {
      return request(app).post('/api/products')
      .send({ name: "Fancy shoes" })
      .expect(401);
    });

    it('creates a new product with auth', function () {
      return request(app).post('/api/products')
      .set('X-Username', 'jonny_eh')
      .send({ name: "Fancy shoes" })
      .expect(200)
      .expect({ success: true });
    });

    it('created a new variation', function () {
      return request(app).post('/api/products/52/variations')
      .send({ name: 'red' })
      .expect(200)
      .then(function () {
        return request(app).get('/api/products/52/variations')
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect([
          {
            name: 'red',
            productsId: '52'
          }
        ]);
      });
    });

    it('creates a custom action handler', function () {
      return request(app).get('/api/products/specials')
      .expect(200)
      .expect({
        specials: []
      });
    });

    describe('API error handling', function () {
      var consoleError;
      var errorLog;
      before(function () {
        consoleError = console.error;
        console.error = function (msg) {
          errorLog += msg.toString() + '\n';
        };
      });

      beforeEach(function () {
          errorLog = '';
      });

      after(function () {
        console.error = consoleError;
      });

      it('handles a thrown error', function () {
        return request(app).get('/api/products/oops')
        .expect(500)
        .expect('Ouch!')
        .then(function () {
          errorLog.should.contain('Error thrown by GET /api/products/oops\nError: Ouch!\n');
        });
      });

      it('handles a thrown error with custom code', function () {
        return request(app).put('/api/products/501oops')
        .expect(501)
        .expect('Ouch!')
        .then(function () {
          errorLog.should.eql('Error thrown by PUT /api/products/501Oops : Ouch!\n');
        });
      });

      it('suppresses error in production', function () {
        process.env.NODE_ENV = 'production';
        return request(app).put('/api/products/501oops')
        .expect(501)
        .expect('An error occurred')
        .then(function () {
          errorLog.should.eql('Error thrown by PUT /api/products/501Oops : Ouch!\n');
          delete process.env.NODE_ENV;
        });
      });

      it('times out if not resolved', function () {
        return request(app).get('/api/products/forever')
        .expect(500)
        .then(function () {
          errorLog.should.eql('Error thrown by GET /api/products/forever : API Request timed out\n');
        });
      });

      it('returns default express 404', function () {
        return request(app).get('/api/thing-that-doesnt-exist')
        .expect(404)
        .expect('Cannot GET /api/thing-that-doesnt-exist\n');
      });
    });
  });

  describe('custom catchAll error', function () {
    before(function () {
      app = express();
        app.use(bodyParser());
        synthApi = require('../main');
        synthApi.generateHandlers({
          resourceDir: __dirname + '/sample_project/resources',
          app: app,
          timeout: 100,
          catchAll: function (req, res) {
            res.status(404).send('this is not the data you are looking for');
          }
        });
    });

    it('returns a custom message', function () {
      return request(app).get('/api/thing-that-doesnt-exist')
      .expect(404)
      .expect('this is not the data you are looking for');
    });
  });
});
