const path = require('path');
const http = require('http');
const url = require('url');
const fs = require('fs');
const util = require('util');
const express = require('express');
const vite = require('vite');
const wsrtc = require('wsrtc/wsrtc-server.js');

Error.stackTraceLimit = 300;

(async () => {
  const app = express();  
  app.use('*', (req, res, next) => {
    const o = url.parse(req.originalUrl);
    /^\/@proxy\//.test(o.pathname) && console.log('HANDLE', req.originalUrl);
    if (/^\/@proxy\//.test(o.pathname) && o.search !== '?import') {
      const u = o.pathname
        .replace(/^\/@proxy\//, '')
        .replace(/^(https?:\/(?!\/))/, '$1/');
      res.redirect(u);
    } else {
      next();
    }
  });

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