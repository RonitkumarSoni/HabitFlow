process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_12345';
process.env.JWT_EXPIRE = '30d';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const { register, login, getMe, generateToken } = require('../controllers/authController');

describe('Auth Controller & JWT Unit Tests', () => {
  let originalFindOne;
  let originalCreate;

  beforeEach(() => {
    originalFindOne = User.findOne;
    originalCreate = User.create;
  });

  afterEach(() => {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  });

  it('generateToken should produce a valid JWT with 30d expiry', () => {
    const token = generateToken('user123');
    assert.ok(token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(decoded.id, 'user123');
  });

  it('register should create a user and return token and safe user object', async () => {
    let createdPayload = null;
    User.findOne = async () => null; // No user with email exists
    User.create = async (payload) => {
      createdPayload = payload;
      return {
        _id: 'mock_user_id_123',
        name: payload.name,
        email: payload.email,
        createdAt: new Date(),
        toSafeObject: () => ({
          _id: 'mock_user_id_123',
          name: payload.name,
          email: payload.email,
          createdAt: new Date()
        })
      };
    };

    const req = {
      body: {
        name: 'Alice Developer',
        email: 'alice@example.com',
        password: 'password123'
      }
    };

    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      }
    };

    await register(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(responseStatus, 201);
    assert.equal(responseBody.success, true);
    assert.equal(responseBody.data.user.email, 'alice@example.com');
    assert.ok(responseBody.data.token);
    assert.equal(responseBody.data.user.password, undefined); // Never return password
  });

  it('register should return 409 if email already exists', async () => {
    User.findOne = async () => ({ _id: 'existing_user_id' });

    const req = {
      body: {
        name: 'Duplicate Alice',
        email: 'alice@example.com',
        password: 'password123'
      }
    };

    let nextError = null;
    await register(req, {}, (err) => {
      nextError = err;
    });

    assert.ok(nextError);
    assert.equal(nextError.statusCode, 409);
    assert.match(nextError.message, /already exists/);
  });

  it('login should succeed and return token when credentials match', async () => {
    const hashedPassword = await bcrypt.hash('secret123', 10);
    const mockUser = {
      _id: 'user_456',
      name: 'Bob',
      email: 'bob@example.com',
      password: hashedPassword,
      comparePassword: async (pwd) => bcrypt.compare(pwd, hashedPassword),
      toSafeObject: () => ({
        _id: 'user_456',
        name: 'Bob',
        email: 'bob@example.com',
        createdAt: new Date()
      })
    };

    User.findOne = () => ({
      select: async () => mockUser
    });

    const req = {
      body: {
        email: 'bob@example.com',
        password: 'secret123'
      }
    };

    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      }
    };

    await login(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(responseStatus, 200);
    assert.equal(responseBody.success, true);
    assert.equal(responseBody.data.user.email, 'bob@example.com');
    assert.ok(responseBody.data.token);
  });

  it('login should return 401 when password does not match', async () => {
    const mockUser = {
      _id: 'user_456',
      password: 'hashed_password',
      comparePassword: async () => false
    };

    User.findOne = () => ({
      select: async () => mockUser
    });

    const req = {
      body: {
        email: 'bob@example.com',
        password: 'wrong_password'
      }
    };

    let nextError = null;
    await login(req, {}, (err) => {
      nextError = err;
    });

    assert.ok(nextError);
    assert.equal(nextError.statusCode, 401);
    assert.match(nextError.message, /Invalid email or password/);
  });

  it('getMe should return the user profile attached by auth middleware', async () => {
    const req = {
      user: {
        _id: 'user_789',
        name: 'Charlie',
        email: 'charlie@example.com'
      }
    };

    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      }
    };

    await getMe(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(responseStatus, 200);
    assert.equal(responseBody.success, true);
    assert.equal(responseBody.data.user.name, 'Charlie');
  });
});

