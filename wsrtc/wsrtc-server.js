const ws = require('ws');

class Room {
  constructor(url) {
    this.url = url;
    this.users = [];
  }
}

const wss = new ws.WebSocketServer({
  noServer: true,
});
const rooms = new Map();
wss.on('connection', (ws, req) => {
  let room = rooms.get(req.url);
  if (!room) {
    room = new Room(req.url);
    rooms.set(req.url, room);
  }
  const id = Math.floor(Math.random() * 0xFFFFFF);
  const localUser = {
    id,
    ws,
  };
  room.users.push(localUser);
  ws.addEventListener('close', () => {
    for (const user of room.users) {
      if (user !== localUser) {
        user.ws.send(JSON.stringify({
          method: 'leave',
          id,
        }));
      }
    }
    
    room.users.splice(room.users.indexOf(localUser), 1);
  });
  ws.send(JSON.stringify({
    method: 'init',
    args: {
      id,
      users: room.users.map(u => u.id),
    },
  }));
  for (const user of room.users) {
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
    for (const user of room.users) {
      if (user !== localUser) {
        user.ws.send(e.data);
      }
    }
  });
});
const bindServer = server => {
  server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => {
      wss.emit('connection', ws, req);
    });
  });
};

module.exports = {
  bindServer,
};