const http = require('http');
const vite = require('vite');
const wsrtc = require('wsrtc/wsrtc-server.js');

vite.createServer()
  .then(server => server.listen())
  .then(() => {
    const wsServer = http.createServer();    
    wsrtc.bindServer(wsServer);
    const port = parseInt(process.env.PORT, 10) || 3000;
    const port2 = port + 1;
    wsServer.listen(port2, () => {
      console.log(`  > World: ws://localhost:${port2}/`)
    });
    wsServer.on('error', err => {
      console.warn(err.stack);
      process.exit(1);
    });
  });

/* require('dotenv').config();
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');

function getExt(fileName) {
  const match = fileName
    .replace(/^[a-z]+:\/\/[^\/]+\//, '')
    .match(/\.([^\.]+)(?:\?.*)?$/);
  return match ? match[1].toLowerCase() : '';
}

const fullchainPath = './certs/fullchain.pem';
const privkeyPath = './certs/privkey.pem';

const httpPort = process.env.HTTP_PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3001;

console.log("HTTP Port is", httpPort);
console.log("HTTPS Port is", httpsPort);

let CERT = null;
let PRIVKEY = null;
try {
  CERT = fs.readFileSync(fullchainPath);
} catch (err) {
  console.warn(`failed to load ${fullchainPath}`);
}
try {
  PRIVKEY = fs.readFileSync(privkeyPath);
} catch (err) {
  console.warn(`failed to load ${privkeyPath}`);
}

const app = express();
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
});
app.use((req, res, next) => {
  if (req.url === '/config.json') {
		res.status(404);
		res.end();
  } else {
	  next();
	}
});
const appStatic = express.static(__dirname);
app.get('*', (req, res, next) => {
  const ext = getExt(req.url);
  if (['tjs', 'rtfjs'].includes(ext)) {
    res.set('Content-Type', 'application/javascript');
  }
  next();
});
app.use(appStatic);
app.get('*', (req, res, next) => {
  req.url = '404.html';
  res.set('Content-Type', 'text/html');
  next();
});
app.use(appStatic);

http.createServer(app)
  .listen(httpPort);
console.log('http://localhost:'+httpPort);
if (CERT && PRIVKEY) {
  https.createServer({
    cert: CERT,
    key: PRIVKEY,
  }, app)
    .listen(httpsPort);
  console.log('https://localhost:'+httpsPort);
} */