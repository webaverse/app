const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
// const util = require('util');
const express = require('express');
const vite = require('vite');
const wsrtc = require('wsrtc/wsrtc-server.js');

Error.stackTraceLimit = 300;

const _isMediaType = p => /\.(?:png|jpe?g|gif|glb|mp3)$/.test(p);

const _tryReadFile = p => {
  try {
    return fs.readFileSync(p);
  } catch(err) {
    // console.warn(err);
    return null;
  }
};
const certs = {
  key: _tryReadFile('./certs/privkey.pem'),
  cert: _tryReadFile('./certs/fullchain.pem'),
};

function makeId(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

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

  const isHttps = !!certs.key && !!certs.cert;
  const port = parseInt(process.env.PORT, 10) || (isHttps ? 443 : 3000);
  const httpServer = (() => {
    if (isHttps) {
      return https.createServer(certs, app);
    } else {
      return http.createServer(app);
    }
  })();
  const viteServer = await vite.createServer({
    server: {
      middlewareMode: 'html',
      hmr: {
        server: httpServer,
        port,
        overlay: false,
      },
    }
  });
  app.use(viteServer.middlewares);
  
  await new Promise((accept, reject) => {
    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`  > Local: http${isHttps ? 's' : ''}://localhost:${port}/`);
      accept();
    });
  });
  
  const wsServer = (() => {
    if (isHttps) {
      return https.createServer(certs);
    } else {
      return http.createServer();
    }
  })();
  const initialRoomState = (() => {
    const s = fs.readFileSync('./scenes/gunroom.scn', 'utf8');
    const j = JSON.parse(s);
    const {objects} = j;
    
    const appsMapName = 'apps';
    const result = {
      [appsMapName]: [],
    };
    for (const object of objects) {
      let {start_url, type, content, position = [0, 0, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1]} = object;
      const instanceId = makeId(5);
      if (!start_url && type && content) {
        start_url = `data:${type},${encodeURI(JSON.stringify(content))}`;
      }
      const appObject = {
        instanceId,
        contentId: start_url,
        position,
        quaternion,
        scale,
        components: JSON.stringify([]),
      };
      result[appsMapName].push(appObject);
    }
    return result;
  })();
  const initialRoomNames = [
    'Erithor',
  ];
  wsrtc.bindServer(wsServer, {
    initialRoomState,
    initialRoomNames,
  });
  const port2 = port + 1;
  await new Promise((accept, reject) => {
    wsServer.listen(port2, '0.0.0.0', () => {
      console.log(`  > World: ws${isHttps ? 's' : ''}://localhost:${port2}/`)
    });
    wsServer.on('error', err => {
      console.warn(err.stack);
      process.exit(1);
    });
  });
})();