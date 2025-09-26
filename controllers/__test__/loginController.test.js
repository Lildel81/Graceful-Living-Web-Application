const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const router = require('../loginController');

// Mock mongoose
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  const mockPasswdModel = {
    findOne: jest.fn(),
  };
  return {
    ...actualMongoose,
    model: jest.fn(() => mockPasswdModel),
    models: { Passwd: mockPasswdModel },
  };
});

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

jest.mock('express-session', () => {
  const mockSession = jest.fn((options) => (req, res, next) => {
    req.session = {
      regenerate: jest.fn((cb) => cb(null)),
      save: jest.fn((cb) => cb(null)),
      isAdmin: false,
      username: null,
      returnTo: null,
    };
    next();
  });
  return mockSession;
});

describe('POST /', () => {
  let app;
  let mockRegenerate;
  let mockSave;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use(router);

    mockRegenerate = jest.fn((cb) => cb(null));
    mockSave = jest.fn((cb) => cb(null));

    session.mockImplementation(() => (req, res, next) => {
      req.session = {
        regenerate: mockRegenerate,
        save: mockSave,
        isAdmin: false,
        username: null,
        returnTo: null,
      };
      next();
    });
  });
  //302 tests
  test('should redirect to /adminportal with 302 status on valid credentials', async () => {
    mongoose.models.Passwd.findOne.mockResolvedValue({
      username: 'testuser',
      hash: 'hashedpassword',
    });
    bcrypt.compare.mockResolvedValue(true);

    const response = await request(app)
      .post('/')
      .send({ username: 'testuser', password: 'testpass' })
      .expect(302);

    expect(response.headers.location).toBe('/adminportal');
    expect(mongoose.models.Passwd.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    expect(bcrypt.compare).toHaveBeenCalledWith('testpass', 'hashedpassword');
    expect(response.status).toBe(302);
  });

  test('should redirect to /adminportal with 302 status when returnTo is not set', async () => {
    mongoose.models.Passwd.findOne.mockResolvedValue({
      username: 'testuser',
      hash: 'hashedpassword',
    });
    bcrypt.compare.mockResolvedValue(true);

    const response = await request(app)
      .post('/')
      .send({ username: 'testuser', password: 'testpass' })
      .expect(302);

    expect(response.headers.location).toBe('/adminportal');
    expect(response.status).toBe(302);
  });
  //401 tests
  test('should return 401 when user is not found', async () => {
    mongoose.models.Passwd.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/')
      .send({ username: 'nonexistentuser', password: 'testpass' })
      .expect(401);

    expect(response.body).toEqual({ ok: false, error: 'invalid credentials' });
    expect(mongoose.models.Passwd.findOne).toHaveBeenCalledWith({ username: 'nonexistentuser' });
    expect(bcrypt.compare).not.toHaveBeenCalled(); 
  });

  test('should return 401 when password does not match', async () => {
    mongoose.models.Passwd.findOne.mockResolvedValue({
      username: 'testuser',
      hash: 'hashedpassword',
    });
    bcrypt.compare.mockResolvedValue(false);

    const response = await request(app)
      .post('/')
      .send({ username: 'testuser', password: 'wrongpass' })
      .expect(401);

    expect(response.body).toEqual({ ok: false, error: 'invalid credentials' });
    expect(mongoose.models.Passwd.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongpass', 'hashedpassword');
  });

  test('should return 401 when password is incorrect even with valid user', async () => {
    mongoose.models.Passwd.findOne.mockResolvedValue({
      username: 'anotheruser',
      hash: 'differenthash',
    });
    bcrypt.compare.mockResolvedValue(false);

    const response = await request(app)
      .post('/')
      .send({ username: 'anotheruser', password: 'incorrect' })
      .expect(401);

    expect(response.body).toEqual({ ok: false, error: 'invalid credentials' });
    expect(mongoose.models.Passwd.findOne).toHaveBeenCalledWith({ username: 'anotheruser' });
    expect(bcrypt.compare).toHaveBeenCalledWith('incorrect', 'differenthash');
  });

  // 500 tests
  test('should return 500 on database error', async () => {
    mongoose.models.Passwd.findOne.mockRejectedValue(new Error('DB connection failed'));

    const response = await request(app)
      .post('/')
      .send({ username: 'testuser', password: 'testpass' })
      .expect(500);

    expect(response.text).toBe('Database error');
    expect(mongoose.models.Passwd.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  test('should return 500 on session regenerate error', async () => {
    // Mock findOne to return a user
    mongoose.models.Passwd.findOne.mockResolvedValue({
      username: 'testuser',
      hash: 'hashedpassword',
    });
    bcrypt.compare.mockResolvedValue(true);
    mockRegenerate.mockImplementation((cb) => cb(new Error('Session regenerate failed')));

    const response = await request(app)
      .post('/')
      .send({ username: 'testuser', password: 'testpass' })
      .expect(500);

    expect(response.text).toBe('session error');
    expect(mockRegenerate).toHaveBeenCalled();
  });

  test('should return 500 on session save error', async () => {
    mongoose.models.Passwd.findOne.mockResolvedValue({
      username: 'testuser',
      hash: 'hashedpassword',
    });
    bcrypt.compare.mockResolvedValue(true);
    mockSave.mockImplementation((cb) => cb(new Error('Session save failed')));

    const response = await request(app)
      .post('/')
      .send({ username: 'testuser', password: 'testpass' })
      .expect(500);

    expect(response.text).toBe('session save error');
    expect(mockSave).toHaveBeenCalled();
  });
});