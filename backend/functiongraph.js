import { createApp } from './server.js';

let serverPromise;

function normalizeHeaders(headers = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (Array.isArray(value)) normalized[key.toLowerCase()] = value.join(',');
    else if (value !== undefined && value !== null) normalized[key.toLowerCase()] = String(value);
  }
  return normalized;
}

function appendQuery(url, params = {}) {
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    } else {
      url.searchParams.set(key, value);
    }
  }
}

function decodeBody(event) {
  if (!event.body) return undefined;
  if (event.isBase64Encoded) return Buffer.from(event.body, 'base64');
  return typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
}

function eventPath(event) {
  const candidates = [
    event.path,
    event.rawPath,
    event.requestContext?.path,
    event.requestContext?.resourcePath,
    event.requestContext?.requestPath,
    event.requestContext?.apiPath,
  ].filter(Boolean);

  const path = String(candidates[0] || '/api/health');
  return path.startsWith('/') ? path : `/${path}`;
}

function shouldBlockPublicPath(path) {
  if (process.env.WA_EXPOSE_ADMIN_APIS === 'true') return false;
  return path === '/api/admin' || path.startsWith('/api/admin/') ||
    path === '/api/admin-agent' || path.startsWith('/api/admin-agent/');
}

async function ensureServer() {
  if (!serverPromise) {
    serverPromise = new Promise(resolve => {
      const app = createApp();
      const server = app.listen(0, '127.0.0.1', () => {
        server.unref();
        resolve({ server, port: server.address().port });
      });
    });
  }
  return serverPromise;
}

export async function handler(event = {}) {
  const { port } = await ensureServer();
  const method = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.method || 'GET';
  const path = eventPath(event);

  if (shouldBlockPublicPath(path)) {
    return {
      statusCode: 403,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'forbidden', message: 'admin APIs are not exposed by this public FunctionGraph entry' }),
      isBase64Encoded: false,
    };
  }

  const url = new URL(`http://127.0.0.1:${port}${path}`);

  if (event.rawQueryString) {
    url.search = event.rawQueryString.startsWith('?') ? event.rawQueryString : `?${event.rawQueryString}`;
  } else {
    appendQuery(url, event.queryStringParameters);
    appendQuery(url, event.multiValueQueryStringParameters);
  }

  const response = await fetch(url, {
    method,
    headers: normalizeHeaders(event.headers),
    body: ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : decodeBody(event),
  });

  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    statusCode: response.status,
    headers,
    body: await response.text(),
    isBase64Encoded: false,
  };
}
