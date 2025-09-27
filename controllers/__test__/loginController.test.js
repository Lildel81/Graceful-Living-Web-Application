/**
 * @file __tests__/loginController.test.js
 */
const path = require('path');
jest.mock('express-rate-limit', () => () => (req, res, next) => next()); // no-op for tests
jest.mock('bcrypt', () => ({ compare: jest.fn() })); // controllable compare

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');

const LOCK_MS = 15 * 60 * 1000;
const NOW = 1700000000000; // fixed time for deterministic tests

describe('loginController', () => {
  let app, controller, Passwd;

  const makeApp = (opts = {}) => {
    const a = express();
    a.use(express.urlencoded({ extended: true }));
    a.use(express.json());

    // fake session so controller can call regenerate/save
    a.use((req, res, next) => {
      req.session = {
        returnTo: null,
        regenerate: (cb) => (opts.sessionError ? cb(new Error('regen fail')) : cb(null)),
        save: (cb) => (opts.sessionSaveError ? cb(new Error('save fail')) : cb(null)),
      };
      next();
    });

    // hijack res.render -> send JSON so we can assert easily
    a.use((req, res, next) => {
      const origStatus = res.status.bind(res);
      res.status = (code) => (res.__status = code, origStatus(code));
      res.render = (view, data = {}) => {
        const code = res.__status || 200;
        return res.status(code).json({ view, ...data });
      };
      next();
    });

    a.use('/login', controller);
    return a;
  };

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // fresh require to ensure we get the router + exported model
    controller = require(path.join('..', '..', 'controllers', 'loginController'));
    Passwd = controller.Passwd;

    // default mocks
    jest.spyOn(Passwd, 'findOne');
    jest.spyOn(Passwd, 'updateOne').mockResolvedValue({ acknowledged: true, modifiedCount: 1 });

    app = makeApp();
  });

  const makeUser = (overrides = {}) => ({
    _id: 'u1',
    username: 'alice',
    hash: 'hashed',
    failedLoginCount: 0,
    failWindowStart: null,
    lockUntil: null,
    isLocked() { return !!(this.lockUntil && this.lockUntil > Date.now()); },
    ...overrides,
  });

  test('GET /login renders the view with defaults', async () => {
    const res = await request(app).get('/login');
    expect(res.status).toBe(200);
    expect(res.body.view).toBe('login');
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe(null);
    expect(res.body.username).toBe('');
  });

  test('POST /login with missing fields -> 400 with validation error', async () => {
    const res = await request(app).post('/login').type('form').send({}); // no fields
    expect(res.status).toBe(400);
    expect(res.body.view).toBe('login');
    expect(res.body.error).toBe('Please fill in both fields.');
  });

  test('POST /login unknown user -> 401 generic invalid credentials', async () => {
    Passwd.findOne.mockResolvedValue(null);
    const res = await request(app).post('/login').type('form').send({ username: 'alice', password: 'x' });
    expect(Passwd.findOne).toHaveBeenCalledWith({ username: 'alice' });
    expect(res.status).toBe(401);
    expect(res.body.view).toBe('login');
    expect(res.body.error).toBe('Invalid username or password.');
  });

  test('POST /login locked user -> 429 with lock message', async () => {
    Passwd.findOne.mockResolvedValue(
      makeUser({ lockUntil: new Date(NOW + 10 * 60 * 1000) }) // locked for 10 more mins
    );
    const res = await request(app).post('/login').type('form').send({ username: 'alice', password: 'x' });
    expect(res.status).toBe(429);
    expect(res.body.view).toBe('login');
    expect(res.body.error).toMatch(/Too many failed attempts/);
  });

  test('POST /login wrong password -> increments fail count within window (401)', async () => {
    const userState = makeUser({ failedLoginCount: 0, failWindowStart: null });
    Passwd.findOne.mockResolvedValue(userState);
    bcrypt.compare.mockResolvedValue(false); // wrong

    const res = await request(app).post('/login').type('form').send({ username: 'alice', password: 'bad' });
    expect(res.status).toBe(401);
    const set = Passwd.updateOne.mock.calls[0][1].$set;
    expect(set.failedLoginCount).toBe(1);
    expect(set.failWindowStart).toEqual(new Date(NOW));
  });

  test('POST /login wrong password reaching MAX_FAILS -> 429 and lockUntil set', async () => {
    const userState = makeUser({
      failedLoginCount: 4,                   // already 4 fails in window
      failWindowStart: new Date(NOW - 60e3), // inside the same 15-min window
    });
    Passwd.findOne.mockResolvedValue(userState);
    bcrypt.compare.mockResolvedValue(false); // wrong

    const res = await request(app).post('/login').type('form').send({ username: 'alice', password: 'bad' });
    expect(res.status).toBe(429);
    const set = Passwd.updateOne.mock.calls[0][1].$set;
    expect(set.failedLoginCount).toBe(0);
    expect(set.failWindowStart).toBeNull();
    expect(set.lockUntil instanceof Date).toBe(true);
    expect(set.lockUntil.getTime()).toBe(NOW + LOCK_MS);
  });

  test('POST /login correct password -> resets counters and redirects', async () => {
    Passwd.findOne.mockResolvedValue(makeUser());
    bcrypt.compare.mockResolvedValue(true); // correct

    const res = await request(app).post('/login').type('form').send({ username: 'alice', password: 'good' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/adminportal');

    const set = Passwd.updateOne.mock.calls[0][1].$set;
    expect(set).toEqual({ failedLoginCount: 0, failWindowStart: null, lockUntil: null });
  });

  test('POST /login session regenerate error -> 500 and error message', async () => {
    // rebuild app to simulate session error
    controller = require(path.join('..', '..', 'controllers', 'loginController'));
    Passwd = controller.Passwd;
    jest.spyOn(Passwd, 'findOne').mockResolvedValue(makeUser());
    jest.spyOn(Passwd, 'updateOne').mockResolvedValue({ acknowledged: true });
    bcrypt.compare.mockResolvedValue(true);

    const appWithSessErr = (() => {
      const a = express();
      a.use(express.urlencoded({ extended: true }));
      a.use(express.json());
      a.use((req, res, next) => {
        req.session = {
          regenerate: (cb) => cb(new Error('regen fail')),
          save: (cb) => cb(null),
        };
        next();
      });
      a.use((req, res, next) => {
        res.status = ((orig) => (code) => (res.__status = code, orig.call(res, code)))(res.status);
        res.render = (view, data = {}) => {
          const code = res.__status || 200;
          return res.status(code).json({ view, ...data });
        };
        next();
      });
      a.use('/login', controller);
      return a;
    })();

    const res = await request(appWithSessErr).post('/login').type('form').send({ username: 'alice', password: 'good' });
    expect(res.status).toBe(500);
    expect(res.body.view).toBe('login');
    expect(res.body.error).toBe('Session error. Please try again.');
  });
});
