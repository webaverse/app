require('dotenv').config();
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const ws = require('ws');

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

const wss = new ws.WebSocketServer({
  noServer: true,
});
const users = [];
wss.on('connection', (ws, req) => {
  const id = Math.floor(Math.random() * 0xFFFFFF);
  const localUser = {
    id,
    ws,
  };
  users.push(localUser);
  ws.addEventListener('close', () => {
    for (const user of users) {
      if (user !== localUser) {
        user.ws.send(JSON.stringify({
          method: 'leave',
          id,
        }));
      }
    }
    
    users.splice(users.indexOf(localUser), 1);
  });
  ws.send(JSON.stringify({
    method: 'init',
    args: {
      id,
      users: users.map(u => u.id),
    },
  }));
  for (const user of users) {
    if (user !== localUser) {
      user.ws.send(JSON.stringify({
        method: 'join',
        id,
      }));
    }
  }
  
  // console.log('got ws', req.url);
  ws.addEventListener('message', e => {
    // console.log('got message', e.data);
    for (const user of users) {
      if (user !== localUser) {
        user.ws.send(e.data);
      }
    }
  });
});

const servers = [];
const httpServer = http.createServer(app)
  .listen(httpPort);
servers.push(httpServer);
console.log('http://localhost:'+httpPort);
if (CERT && PRIVKEY) {
  const httpsServer = https.createServer({
    cert: CERT,
    key: PRIVKEY,
  }, app)
    .listen(httpsPort);
  servers.push(httpsServer);
  console.log('https://localhost:'+httpsPort);
}
for (const server of servers) {
  server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => {
      wss.emit('connection', ws, req);
    });
  });
}
