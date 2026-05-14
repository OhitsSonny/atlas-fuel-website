import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.dirname(url.fileURLToPath(import.meta.url));
const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    let reqPath = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
    if (reqPath === '/') reqPath = '/index.html';
    let filePath = path.join(ROOT, reqPath);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch {
      if (!path.extname(filePath)) {
        try {
          stat = await fs.stat(filePath + '.html');
          if (stat.isFile()) filePath = filePath + '.html';
        } catch {}
      }
      if (!stat) {
        res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
        res.end('<h1>404</h1><p>Not found: ' + reqPath + '</p>');
        return;
      }
    }
    if (stat.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      try {
        await fs.stat(indexPath);
        filePath = indexPath;
      } catch {
        res.writeHead(404).end('Directory index not found');
        return;
      }
    }
    const ext = path.extname(filePath).toLowerCase();
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Server error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`atlas-fuel-website serving on http://localhost:${PORT}`);
});
