/**!
 * koa-session - test/koa-session.test.js
 * Copyright(c) 2013
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var Session = require('..');
var koa = require('koa');
var app = require('./support/server');
var request = require('supertest');
var mm = require('mm');
var EventEmitter = require('events').EventEmitter;

describe('test/koa-session.test.js', function () {
  describe('init', function () {
    afterEach(mm.restore);

    it('should error without secret', function () {
      (function () {
        Session();
      }).should.throw('`secret` option required for sessions');
    });

    it('should warn when in production', function (done) {
      mm(process.env, 'NODE_ENV', 'production');
      mm(console, 'warn', function (message) {
        message.should.equal('Warning: connect.session() MemoryStore is not\n' + 
        'designed for a production environment, as it will leak\n' + 
        'memory, and will not scale past a single process.');
        done();
      });

      Session({secret: 'secret'});
    });

    it('should listen disconnect and connect', function () {
      var store = new EventEmitter();
      Session({
        secret: 'secret',
        store: store
      });
      store._events.disconnect.should.be.Function;
      store._events.connect.should.be.Function;
    });
  });

  describe('use', function () {
    var cookie;
    var mockCookie = 'koa.sid=s:dsfdss.PjOnUyhFG5bkeHsZ1UbEY7bDerxBINnZsD5MUguEph8; path=/; httponly';
    it('should GET /session/get ok', function (done) {
      request(app)
      .get('/session/get')
      .expect(/1/)
      .end(function (err, res) {
        cookie = res.headers['set-cookie'].join(';');
        done();
      });
    });

    it('should GET /session/get second ok', function (done) {
      request(app)
      .get('/session/get')
      .set('cookie', cookie)
      .expect(/2/, done);
    });

    it('should another user GET /session/get ok', function (done) {
      request(app)
      .get('/session/get')
      .expect(/1/, done);
    });

    it('should wrong cookie GET /session/get ok', function (done) {
      request(app)
      .get('/session/get')
      .set('cookie', mockCookie)
      .expect(/1/, done);
    });

    it('should wrong cookie GET /session/get twice ok', function (done) {
      request(app)
      .get('/session/get')
      .set('cookie', mockCookie)
      .expect(/1/, done);
    });

    it('should GET /session/remove ok', function (done) {
      request(app)
      .get('/session/remove')
      .set('cookie', cookie)
      .expect(/0/, function () {
        request(app)
        .get('/session/get')
        .set('cookie', cookie)
        .expect(/1/, done);
      });
    });

    it('should GET / error by session ok', function (done) {
      request(app)
      .get('/')
      .expect(/no session/, done);
    });

    it('should GET /session ok', function (done) {
      request(app)
      .get('/session')
      .expect(/has session/, done);
    });
  });
});
