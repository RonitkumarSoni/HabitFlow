process.env.NODE_ENV = 'test';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server');

// Helper to simulate HTTP requests in memory without opening external TCP sockets
function testRequest(app, { method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const socket = {
      encrypted: false,
      readable: true,
      writable: true,
      destroy: () => {},
      on: () => {},
      once: () => {},
      emit: () => {},
      address: () => ({ address: '127.0.0.1', family: 'IPv4', port: 80 }),
      remoteAddress: '127.0.0.1',
      remotePort: 12345
    };

    const req = new http.IncomingMessage(socket);
    req.method = method.toUpperCase();
    req.url = url;
    req.headers = {
      host: 'localhost',
      'user-agent': 'test-agent',
      'content-type': 'application/json',
      ...headers
    };

    const res = new http.ServerResponse(req);
    res.assignSocket(socket);

    let resBody = '';
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (chunk, encoding, callback) {
      if (chunk) {
        resBody += Buffer.isBuffer(chunk) ? chunk.toString() : chunk;
      }
      return true;
    };

    res.end = function (chunk, encoding, callback) {
      if (chunk) {
        resBody += Buffer.isBuffer(chunk) ? chunk.toString() : chunk;
      }
      let parsed = resBody;
      try {
        parsed = JSON.parse(resBody);
      } catch {}

      resolve({
        status: res.statusCode,
        statusCode: res.statusCode,
        body: parsed,
        headers: res.getHeaders()
      });
    };

    // Run app with req, res
    app(req, res);

    // If body exists, push body to stream
    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      req.push(payload);
    }
    req.push(null);
  });
}

describe('Health Checks & Error Handling API Endpoints', () => {
  it('GET /health should return 200 with service healthy', async () => {
    const res = await testRequest(app, { method: 'GET', url: '/health' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Habit Tracker Service is healthy');
    assert.ok(res.body.uptime !== undefined);
  });

  it('GET /api/health should return 200 with API healthy', async () => {
    const res = await testRequest(app, { method: 'GET', url: '/api/health' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Habit Tracker API is up and running healthy');
    assert.ok(res.body.timestamp);
  });

  it('GET /api/nonexistent should return 404 with structured error', async () => {
    const res = await testRequest(app, { method: 'GET', url: '/api/nonexistent' });
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Resource not found/);
  });

  it('POST /api/auth/register with empty body should return 400 validation error', async () => {
    const res = await testRequest(app, { method: 'POST', url: '/api/auth/register', body: {} });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.length > 0);
  });

  it('POST /api/auth/login with invalid email format should return 400', async () => {
    const res = await testRequest(app, {
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'not-an-email', password: 'password123' }
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('GET /api/auth/me without token should return 401 unauthorized', async () => {
    const res = await testRequest(app, { method: 'GET', url: '/api/auth/me' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Not authorized, no token provided');
  });

  it('GET /api/habits without token should return 401 unauthorized', async () => {
    const res = await testRequest(app, { method: 'GET', url: '/api/habits' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('GET /api/stats/overview without token should return 401 unauthorized', async () => {
    const res = await testRequest(app, { method: 'GET', url: '/api/stats/overview' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });
});
