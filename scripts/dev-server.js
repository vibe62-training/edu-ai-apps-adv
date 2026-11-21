const fs = require('fs');
const http = require('http');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = Number(process.env.PORT) || 3000;

const API_ROUTES = {
  '/api/generate': require('../api/generate.js'),
  '/api/quiz': require('../api/quiz.js'),
  '/api/activities': require('../api/activities.js'),
};

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

async function handleApi(req, res, handler) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end();
    return;
  }

  try {
    const raw = await readBody(req);
    req.body = raw ? JSON.parse(raw) : {};
  } catch (error) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: '요청 형식이 올바르지 않습니다.' }));
    return;
  }

  handler(req, res);
}

function serveFile(res, pathname) {
  const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname);
  const file = path.normalize(path.join(PUBLIC_DIR, relative));

  if (!file.startsWith(PUBLIC_DIR + path.sep)) {
    res.statusCode = 403;
    res.end();
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    res.setHeader('Content-Type', CONTENT_TYPES[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
}

http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (API_ROUTES[pathname]) {
    handleApi(req, res, API_ROUTES[pathname]);
    return;
  }
  serveFile(res, pathname);
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
