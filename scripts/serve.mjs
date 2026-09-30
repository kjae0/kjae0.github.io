import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { build, root } from './build.mjs';

const production = process.argv.includes('--production');
const portFlag = process.argv.indexOf('--port');
const port = Number(portFlag === -1 ? process.env.PORT || 4321 : process.argv[portFlag + 1]);
const out = resolve(root, 'dist');
if (!production) await build();
else await stat(resolve(out, 'index.html')).catch(() => { throw new Error('Run npm run build before npm run preview.'); });
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.ico': 'image/x-icon' };

const server = createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(out, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(`${out}${sep}`)) { response.writeHead(403).end('Forbidden'); return; }
    const body = await readFile(file);
    const headers = { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Content-Length': body.length, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' };
    // Media players request byte ranges for playback and seeking.
    if (request.headers.range && request.method === 'GET') {
      const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (!range || (!range[1] && !range[2])) {
        response.writeHead(416, { 'Content-Range': `bytes */${body.length}` }).end();
        return;
      }
      const start = range[1] ? Number(range[1]) : Math.max(0, body.length - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= body.length) {
        response.writeHead(416, { 'Content-Range': `bytes */${body.length}` }).end();
        return;
      }
      response.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${body.length}` }).end(body.subarray(start, end + 1));
      return;
    }
    response.writeHead(200, headers);
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 400, { 'Content-Type': 'text/plain' }).end('Page not found');
  }
});

server.on('error', (error) => { console.error(error.message); process.exit(1); });
server.listen(port, '127.0.0.1', () => console.log(`Homepage ready at http://localhost:${port}${production ? '' : ' (edit files, then refresh)'}`));

if (!production) {
  let pending = false;
  let running = false;
  let timer;
  const rebuild = async () => {
    pending = true;
    if (running) return;
    running = true;
    while (pending) {
      pending = false;
      try { await build(); } catch (error) { console.error(`Build failed: ${error.message}`); }
    }
    running = false;
  };
  for (const folder of ['content', 'src', 'public']) {
    watch(resolve(root, folder), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 100); });
  }
}
