require('dotenv').config();
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
app.get('config.json', (req, res, next) => {
  res.status(404);
  res.end();
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
}
