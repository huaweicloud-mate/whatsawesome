import test from 'node:test';
import assert from 'node:assert/strict';

test('FunctionGraph handler serves health checks from APIG-style events', async () => {
  const { handler } = await import('../functiongraph.js');

  assert.equal(handler.length, 2);

  const response = await handler({
    httpMethod: 'GET',
    path: '/api/health',
    headers: {},
    queryStringParameters: {},
  });

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).service, 'whatsawesome-api');
});

test('FunctionGraph handler strips the public APIG base path', async () => {
  const { handler } = await import('../functiongraph.js');

  const response = await handler({
    httpMethod: 'GET',
    path: '/whatsawesome/api/health',
    headers: {},
    queryStringParameters: {},
  });

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).service, 'whatsawesome-api');
});

test('FunctionGraph handler decodes base64 JSON bodies for portal APIs', async () => {
  const { handler } = await import('../functiongraph.js');
  const body = Buffer.from(JSON.stringify({
    gitcode_id: 'fg-user-1',
    gitcode_username: 'fg-runner',
  })).toString('base64');

  const response = await handler({
    isBase64Encoded: true,
    body,
    httpMethod: 'POST',
    path: '/api/portal/players',
    headers: { 'content-type': 'application/json' },
    queryStringParameters: {},
  });

  assert.equal(response.statusCode, 201);
  assert.equal(JSON.parse(response.body).player.gitcode_username, 'fg-runner');
});

test('FunctionGraph handler blocks admin APIs by default for public deployment', async () => {
  const { handler } = await import('../functiongraph.js');

  const response = await handler({
    httpMethod: 'GET',
    path: '/api/admin/skill-candidates',
    headers: { 'x-admin-id': 'admin-founder' },
    queryStringParameters: {},
  });

  assert.equal(response.statusCode, 403);
  assert.equal(JSON.parse(response.body).error, 'forbidden');
});
