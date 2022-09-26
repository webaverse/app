/* eslint-disable node/no-deprecated-api */
/* eslint-disable camelcase */
/* eslint-disable promise/param-names */
import http from 'http';
import https from 'https';
import url from 'url';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { createServer } from 'vite';
import wsrtc from 'wsrtc/wsrtc-server.mjs';
import metaversefile from 'metaversefile/plugins/rollup.js';
import glob from 'glob';

Error.stackTraceLimit = 300;
const cwd = process.cwd();

const isProduction = process.argv[2] === '-p';
process.env.MODULE_URL = process.env.MODULE_URL || 'https://local.webaverse.com/';
process.env.NODE_ENV = isProduction ? 'production' : process.env.NODE_ENV;
const totum = metaversefile();

const _isMediaType = p => /\.(?:png|jpe?g|gif|svg|glb|mp3|wav|webm|mp4|mov)$/.test(p);

const _tryReadFile = p => {
  try {
    return fs.readFileSync(p);
  } catch (err) {
    // console.warn(err);
    return null;
  }
};
const certs = {
  key: _tryReadFile('./certs/privkey.pem') || _tryReadFile('./certs-local/privkey.pem'),
  cert: _tryReadFile('./certs/fullchain.pem') || _tryReadFile('./certs-local/fullchain.pem'),
};

function makeId(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function dynamicImporter(o, req, res, next) {
  try {
    const loadUrl = o.pathname.slice(o.pathname.lastIndexOf('/@import'), o.pathname.length).replace('/@import', '');
    const fullUrl = req.protocol + '://' + req.get('host') + loadUrl;
    const reqURL = new URL(fullUrl);

    /** Check intiator */
    if (req.headers['sec-fetch-dest'] === 'script') {
      let id = await totum.resolveId(loadUrl, reqURL.href);
      if (!id) {
        res.status(500);
        return res.end('Failed to load');
      }

      id = id.replace('/@proxy/', '');
      const { code, map } = await totum.load(id);
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(code);
    } else {
      req.originalUrl = loadUrl;
      return /^\/(?:@proxy)\//.test(req.originalUrl) ? proxyReq(loadUrl, res) : res.redirect(req.originalUrl);
    }
  } catch (e) {
    console.log(e);
    res.status(500).end(e.stack);
  }
}

function proxyReq(u, res) {
  u = u.replace(/^\/@proxy\//, '');
  const proxyReq = /https/.test(u) ? https.request(u) : http.request(u);
  proxyReq.on('response', proxyRes => {
    for (const header in proxyRes.headers) {
      res.setHeader(header, proxyRes.headers[header]);
    }
    res.statusCode = proxyRes.statusCode;
    proxyRes.pipe(res);
  });
  proxyReq.on('error', err => {
    console.error(err);
    res.statusCode = 500;
    res.end();
  });
  proxyReq.end();
}

const _proxyUrl = (req, res, u) => {
  const proxyReq = /https/.test(u) ? https.request(u) : http.request(u);
  proxyReq.on('response', proxyRes => {
    for (const header in proxyRes.headers) {
      res.setHeader(header, proxyRes.headers[header]);
    }
    res.statusCode = proxyRes.statusCode;
    proxyRes.pipe(res);
  });
  proxyReq.on('error', err => {
    console.error(err);
    res.statusCode = 500;
    res.end();
  });
  proxyReq.end();
};

(async () => {
  const app = express();
  app.use('*', async (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    const o = url.parse(req.originalUrl, true);

    /** Replace any double / caused due to both proxy & import */
    o.pathname = o.pathname.replace(/(?<!(http:|https:))\/\//g, '/');

    if (/^\/(?:@proxy|public)\//.test(o.pathname) && o.query.import === undefined) {
      const u = o.pathname
        .replace(/^\/@proxy\//, '')
        .replace(/^\/public/, '')
        .replace(/^(https?:\/(?!\/))/, '$1/');
      if (_isMediaType(o.pathname) && !/^\/(?:@proxy)\//.test(o.pathname)) {
        proxyReq(u, res);
      } else {
        req.originalUrl = u;
        isProduction ? dynamicImporter(o, req, res, next) : next();
      }
    } else if (o.query.noimport !== undefined) {
      const p = path.join(cwd, path.resolve(o.pathname));
      const rs = fs.createReadStream(p);
      rs.on('error', err => {
        if (err.code === 'ENOENT') {
          res.statusCode = 404;
          res.end('not found');
        } else {
          console.error(err);
          res.statusCode = 500;
          res.end(err.stack);
        }
      });
      rs.pipe(res);
      // _proxyUrl(req, res, req.originalUrl);
    } else if (/^\/login/.test(o.pathname)) {
      req.originalUrl = req.originalUrl.replace(/^\/(login)/, '/');
      return res.redirect(req.originalUrl);
    } else {
      isProduction && /^\/@import/.test(o.pathname)
        ? dynamicImporter(o, req, res, next) : next();
    }
  });

  const isHttps = !process.env.HTTP_ONLY && (!!certs.key && !!certs.cert);
  const port = parseInt(process.env.PORT, 10) || (isProduction ? 443 : 3000);
  const wsPort = port + 1;

  const _makeHttpServer = () => isHttps ? https.createServer(certs, app) : http.createServer(app);
  const httpServer = _makeHttpServer();

  if (!isProduction) {
    const viteServer = await createServer({
      server: {
        middlewareMode: true,
        force: true,
        hmr: {
          server: httpServer,
          port,
          overlay: false,
        },
      },
    });
    app.use(viteServer.middlewares);
  } else if (isProduction) {
    /** Setup static assets */
    if (isProduction) {
      app.use(express.static('dist'));
      app.use(express.static('dist/assets'));

      app.use('*', (req, res) => {
        const o = url.parse(req.originalUrl, true);

        const fileName = path.parse(o.pathname).base;

        glob(`dist/**/${fileName}`, (err, files) => {
          const _404 = err || files.length === 0;
          if (files.length > 0) {
            return res.sendFile(path.resolve('.', files[0]));
          } else if (_404) {
            res.status(404).end();
          }
        });
      });

      app.enable('view cache');
    }
  }

  await new Promise((accept, reject) => {
    httpServer.listen(port, '0.0.0.0', () => {
      accept();
    });
    httpServer.on('error', reject);
  });
  console.log(`  > Local: http${isHttps ? 's' : ''}://localhost:${port}/`);

  const wsServer = (() => {
    if (isHttps) {
      return https.createServer(certs);
    } else {
      return http.createServer();
    }
  })();
  const initialRoomState = (() => {
    const s = fs.readFileSync(`./${isProduction ? 'dist/' : ''}scenes/gunroom.scn`, 'utf8');
    const j = JSON.parse(s);
    const { objects } = j;

    const appsMapName = 'apps';
    const result = {
      [appsMapName]: [],
    };
    for (const object of objects) {
      let { start_url, type, content, position = [0, 0, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1] } = object;
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
  await new Promise((accept, reject) => {
    wsServer.listen(wsPort, '0.0.0.0', () => {
      accept();
    });
    wsServer.on('error', reject);
  });
  console.log(`  > World: ws${isHttps ? 's' : ''}://localhost:${wsPort}/`);
})();
