const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const util = require('util');
const express = require('express');
const vite = require('vite');
const wsrtc = require('wsrtc/wsrtc-server.js');

Error.stackTraceLimit = 300;

const _isMediaType = p => /\.(?:png|jpe?g|gif|glb|mp3)$/.test(p);

(async () => {
  const app = express();
  app.use('*', async (req, res, next) => {
    const o = url.parse(req.originalUrl, true);
    if (/^\/(?:@proxy|public)\//.test(o.pathname) && o.search !== '?import') {
      const u = o.pathname
        .replace(/^\/@proxy\//, '')
        .replace(/^\/public/, '')
        .replace(/^(https?:\/(?!\/))/, '$1/');
      if (_isMediaType(o.pathname)) {
        res.redirect(u);
      } else {
        req.originalUrl = u;
        next();
      }
    } else {
      next();
    }
  });

  const port = parseInt(process.env.PORT, 10) || 3000;
  console.log('got port', port);
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
  app.use(viteServer.middlewares);
  
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