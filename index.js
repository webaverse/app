const path = require('path');
const http = require('http');
const url = require('url');
const fs = require('fs');
const util = require('util');
const express = require('express');
const vite = require('vite');
const wsrtc = require('wsrtc/wsrtc-server.js');

(async () => {
  const app = express();

  // Create vite server in middleware mode. This disables Vite's own HTML
  // serving logic and let the parent server take control.
  //
  // If you want to use Vite's own HTML serving logic (using Vite as
  // a development middleware), using 'html' instead.
  const port = parseInt(process.env.PORT, 10) || 3000;
  const httpServer = http.createServer(app);
  const viteServer = await vite.createServer({
    server: {
      middlewareMode: 'html',
      hmr: {
        server: httpServer,
        port,
      },
    }
  });
  // use vite's connect instance as middleware
  app.use('*', (req, res, next) => {
    console.log('HANDLE', req.url);
    const o = url.parse(req.url);
    if (/^\/@proxy\//.test(o.pathname)) {
      console.log('special', o);
      res.end('lol');
    } else {
      next();
    }
    /* console.log('HANDLE', req.url);
    if (o.pathname === '/') {
      console.log('HANDLE HTML', req.url);
      res.setHeader('Content-Type', 'text/html');
      const rs = fs.createReadStream(path.join(__dirname, 'index.html'));
      rs.pipe(res);
      rs.on('error', err => {
        console.warn(err.stack);
        res.status = err.code === 'ENOENT' ? 404 : 500;
        res.end();
      });
    } else {
      // serve index.html - we will tackle this next
      console.log('HANDLE ELSE', req.url);
    } */
  });
  app.use(viteServer.middlewares);
  
  // const httpServer = http.createServer(app);
  // const httpServer = viteServer.ws._server;
  // console.log('keys', util.inspect(viteServer.ws));
  // console.log('keys', util.inspect(viteServer.ws._server));
  // httpServer.on('request', app);
  /* httpServer.on('upgrade', function upgrade(request, socket, head) {
    viteServer.ws.handleUpgrade(request, socket, head, function done(ws) {
      viteServer.ws.emit('connection', ws, request);
    });
  }); */
  console.log(`  > Local: http://localhost:${port}/`);
  await new Promise((accept, reject) => {
    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`  > Local: http://localhost:${port}/`);
      accept();
    });
  });
  
  const wsServer = http.createServer();
  wsrtc.bindServer(wsServer);
  const port2 = port + 1;
  await new Promise((accept, reject) => {
    wsServer.listen(port2, () => {
      console.log(`  > World: ws://localhost:${port2}/`)
    });
    wsServer.on('error', err => {
      console.warn(err.stack);
      process.exit(1);
    });
  });
})();