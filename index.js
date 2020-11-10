const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');

const CERT = fs.readFileSync('./certs/fullchain.pem');
const PRIVKEY = fs.readFileSync('./certs/privkey.pem');

const app = express();
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
});
const appStatic = express.static(__dirname);
app.use(appStatic);
app.get('*', (req, res, next) => {
  req.url = '404.html';
  res.set('Content-Type', 'text/html');
  next();
});
app.use(appStatic);

http.createServer(app)
  .listen(3000);
https.createServer({
  cert: CERT,
  key: PRIVKEY,
}, app)
  .listen(3001);

console.log('http://localhost:3000');
console.log('https://localhost:3001');
