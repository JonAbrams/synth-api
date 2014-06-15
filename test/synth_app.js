var synthApi = require('../main');

var request = require('supertest');
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
      if (req.config.auth) {
        return res.send(401);
      }
      next();
    });
    synthApi.generateHandlers({
      resourceDir: __dirname + '/sample_project/resources',
      app: app,
      timeout: 100
    });
  });

  describe('the api', function () {
    it('fetches the list of products', function (done) {
      request(app).get('/api/products')
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
      })
      .end(done);
    });

    it('cannot create a new product without auth', function (done) {
      request(app).post('/api/products')
      .send({ name: "Fancy shoes" })
      .expect(401)
      .end(done);
    });

    it('created a new variation', function (done) {
      request(app).post('/api/products/52/variations')
      .send({ name: 'red' })
      .expect(200)
      .end(function () {
        request(app).get('/api/products/52/variations')
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect([
          {
            name: 'red',
            productsId: '52'
          }
        ])
        .end(done);
      });
    });

    it('creates a custom action handler', function (done) {
      request(app).get('/api/products/specials')
      .expect(200)
      .expect({
        specials: []
      })
      .end(done);
    });

    describe('API error handling', function () {
      var consoleError;
      var errorLog = '';
      before(function () {
        consoleError = console.error;
        console.error = function (msg) {
          errorLog = msg;
        };
      });
      after(function () {
        console.error = consoleError;
      });

      it('handles a thrown error', function (done) {
        request(app).get('/api/products/oops')
        .expect(500)
        .expect({ error: 'Ouch!' })
        .end(function () {
          errorLog.should.eql('Error thrown by GET /api/products/oops : {"error":"Ouch!"}');
          done();
        });
      });

      it('handles a thrown error with custom code', function (done) {
        request(app).put('/api/products/501oops')
        .expect(501)
        .expect('Ouch!')
        .end(function () {
          errorLog.should.eql('Error thrown by PUT /api/products/501Oops : Ouch!');
          done();
        });
      });

      it('suppresses error in production', function (done) {
        process.env.NODE_ENV = 'production';
        request(app).put('/api/products/501oops')
        .expect(501)
        .expect('An error occurred')
        .end(function () {
          errorLog.should.eql('Error thrown by PUT /api/products/501Oops : Ouch!');
          delete process.env.NODE_ENV;
          done();
        });
      });

      it('times out if not resolved', function (done) {
        request(app).get('/api/products/forever')
        .expect(500)
        .end(function () {
          errorLog.should.eql('Error thrown by GET /api/products/forever : API Request timed out');
          done();
        });
      });

      it('returns default express 404', function (done) {
        request(app).get('/api/thing-that-doesnt-exist')
        .expect(404)
        .expect('Cannot GET /api/thing-that-doesnt-exist\n')
        .end(done);
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
            res.send(404, 'this is not the data you are looking for');
          }
        });
    });

    it('returns a custom message', function (done) {
      request(app).get('/api/thing-that-doesnt-exist')
      .expect(404)
      .expect('this is not the data you are looking for')
      .end(done);
    });
  });
});
