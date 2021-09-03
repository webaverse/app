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