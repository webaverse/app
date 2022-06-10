import url from 'url';
import {WebSocketServer} from 'ws';
import Z from 'zjs';
import {encodeMessage} from './ws-util-server.mjs';
import {MESSAGE} from './ws-constants-server.mjs';

const appsMapName = 'apps';
const playersMapName = 'players';

const sendMessage = (ws, parts) => {
  let encodedMessage = encodeMessage(parts);
  encodedMessage = encodedMessage.slice(); // deduplicate
  ws.send(encodedMessage);
};

const _jsonParse = s => {
  try {
    return JSON.parse(s);
  } catch (err) {
    return null;
  }
};
const _setArrayFromArray = (zArray, array) => {
  for (const e of array) {
    const map = new Z.Map();
    for (const k in e) {
      map.set(k, e[k]);
    }
    zArray.push([map]);
  }
};
const _setObjectFromObject = (yObject, object) => {
  for (const k in object) {
    const v = object[k];
    yObject.set(k, v);
  }
};
const _setDocFromObject = (state, o) => {
  for (const k in o) {
    const v = o[k];
    if (Array.isArray(v)) {
      _setArrayFromArray(state.getArray(k), v);
    } else if (typeof v === 'object') {
      _setObjectFromObject(state.getMap(k), v);
    }
  }
  state.getArray(playersMapName);
};

class Player {
  constructor(playerId, ws) {
    this.playerId = playerId;
    this.ws = ws;
  }
}

// const maxFloatingUpdates = 100;
class Room {
  constructor(name, initialState) {
    this.name = name;
    this.players = [];
    this.state = null;

    this.unbindStateFn = null;
    
    const newState = new Z.Doc();
    if (initialState) {
      _setDocFromObject(newState, initialState);
    }
    this.bindState(newState);
  }
  unbindState() {
    if (this.unbindStateFn) {
      this.unbindStateFn();
      this.unbindStateFn = null;
    }
  }
  bindState(nextState) {
    this.unbindState();
    
    this.state = nextState;
    nextState.setMirror(true);
    nextState.setResolvePriority(0);
    
    const stateUpdateFn = (encodedUpdate, transactionOrigin) => {
      let encodedMessage = encodeMessage([
        MESSAGE.STATE_UPDATE,
        encodedUpdate,
      ]);
      encodedMessage = encodedMessage.slice(); // deduplicate
      for (const player of this.players) {
        if (player.playerId !== transactionOrigin) {
          player.ws.send(encodedMessage);
        }
      }
    };
    this.state.on('update', stateUpdateFn);
    
    this.unbindStateFn = () => {
      this.state.off('update', stateUpdateFn);
    };
  }
  getPlayersState() {
    return this.state.getArray(playersMapName);
  }
  getPlayersArray() {
    return Array.from(this.getPlayersState());
  }
  removePlayer(playerId) {
    this.state.transact(() => {
      const players = this.getPlayersState();
      
      let playerIndex = -1;
      for (let i = 0; i < players.length; i++) {
        const player = players.get(i);
        if (player.get('playerId') === playerId) {
          playerIndex = i;
          break;
        }
      }
      if (playerIndex !== -1) {
        players.delete(playerIndex, 1);
      } else {
        console.warn('could not remove unknown player id', playerId, players.toJSON());
      }
    });
  }
  setApps(newApps) {
    this.state.transact(() => {
      const appsArray = this.state.getArray(appsMapName);
      while (appsArray.length > 0) {
        appsArray.delete(appsArray.length - 1);
      }
      _setArrayFromArray(appsArray, newApps);
    });
  }
  save() {
    // console.log('save room', this.name);
  }
  toJSON() {
    const j = this.state.toJSON();
    j.name = this.name;
    return j;
  }
  destroy() {
    this.unbindState();
    
    for (const player of this.players) {
      player.ws.terminate();
    }
  }
}

const bindServer = (server, {initialRoomState = null, initialRoomNames = []} = []) => {
  const rooms = new Map();
  const _getOrCreateRoom = roomId => {
    let room = rooms.get(roomId);
    if (!room) {
      room = new Room(roomId, initialRoomState);
      rooms.set(roomId, room);
    }
    return room;
  };
  
  const wss = new WebSocketServer({
    noServer: true,
  });
  wss.on('connection', (ws, req) => {
    const o = url.parse(req.url, true);
    const match = o.pathname.match(/^\/worlds\/([a-z0-9\-_]+)$/i);
    const roomId = match && match[1];
    const {playerId} = o.query;
    if (roomId && playerId) {
      const room = _getOrCreateRoom(roomId);
      
      console.log('got connection', o.query, o.queryString);
      
      // const id = Math.floor(Math.random() * 0xFFFFFF);
      const localPlayer = new Player(playerId, ws);
      room.players.push(localPlayer);

      ws.addEventListener('close', () => {
        room.removePlayer(playerId);
      });
      
      // send init
      const encodedStateData = Z.encodeStateAsUpdate(room.state);
      console.log('encoded state data', encodedStateData.byteLength);
      sendMessage(ws, [
        MESSAGE.INIT,
        encodedStateData,
      ]);
      
      ws.addEventListener('message', e => {
        const dataView = new DataView(e.data.buffer, e.data.byteOffset);
        const method = dataView.getUint32(0, true);
        switch (method) {
          case MESSAGE.STATE_UPDATE: {
            const byteLength = dataView.getUint32(Uint32Array.BYTES_PER_ELEMENT, true);
            const data = new Uint8Array(e.data.buffer, e.data.byteOffset + 2 * Uint32Array.BYTES_PER_ELEMENT, byteLength);
            Z.applyUpdate(room.state, data, playerId);
            
            // room.save();
            break;
          }
        }
      });
    } else {
      console.warn('ws url did not match', o);
      ws.close();
    }
  });

  server.on('request', (req, res) => {
    console.log('ws got req', req.method, req.url);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    if (req.method === 'HEAD' || req.method === 'OPTIONS') {
      res.end();
    } else {
      const o = url.parse(req.url, true);
      // console.log('server request', o);
      const match = o.pathname.match(/^\/worlds\/([\s\S]*)?$/);
      if (match) {
        const roomName = match[1];
        if (req.method === 'GET') {
          if (!roomName) {
            const j = Array.from(rooms.values()).map(room => room.toJSON());
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(j));
          } else {
            const room = rooms.get(roomName);
            if (room) {
              const j = room.toJSON();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(j));
            } else {
              res.status = 404;
              res.end('not found');
            }
          }
        } else if (req.method === 'POST') {
          if (roomName) {
            const bs = [];
            req.on('data', d => {
              bs.push(d);
            });
            req.on('end', () => {
              const b = Buffer.concat(bs);
              bs.length = 0;
              const s = b.toString('utf8');
              const j = _jsonParse(s);
              
              if (Array.isArray(j?.apps)) {
                const room = _getOrCreateRoom(roomName);
                room.setApps(j?.apps);
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ok: true}));
              } else {
                res.status = 400;
                res.end('bad request');
              }
            });
          } else {
            res.status = 404;
            res.end('not found');
          }
        } else if (req.method === 'DELETE') {
          const room = rooms.get(roomName);
          if (room) {
            rooms.delete(roomName);
            room.destroy();
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ok: true}));
          } else {
            res.status = 404;
            res.end('not found');
          }
        }
      } else {
        res.statusCode = 404;
        res.end('not found');
      }
    }
  });
  server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => {
      wss.emit('connection', ws, req);
    });
  });
  
  for (const name of initialRoomNames) {
    _getOrCreateRoom(name);
  }
};

const WSRTC = {
  bindServer,
};
export default WSRTC;