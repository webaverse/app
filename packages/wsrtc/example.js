import WSRTC from './wsrtc.js';

const container = document.getElementById('container');
const form = document.getElementById('form');
const input = form.querySelector('input[type=text]');
function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}
const qs = parseQuery(location.search);
input.value = qs.u || `wss://${location.host}`;
form.addEventListener('submit', e => {
  e.preventDefault();
  
  const u = input.value;
  history.pushState({}, '', location.protocol + '//' + location.host + '?u=' + encodeURIComponent(u));
  form.style.display = 'none';

  const _createPlayerDom = player => {
    const playerEl = document.createElement('div');
    playerEl.classList.add('player');
    
    const volumeEl = document.createElement('div');
    volumeEl.classList.add('volume');
    playerEl.appendChild(volumeEl);
    
    container.appendChild(playerEl);
    player.addEventListener('leave', e => {
      container.removeChild(playerEl);
      cancelAnimationFrame(frame);
    });
    
    const _updatePlayerDomPosition = () => {
      playerEl.style.transform = `translate3d(${player.pose.position[0] * window.innerWidth}px, ${player.pose.position[1] * window.innerHeight}px, 0) scale(${1 - player.pose.position[2] * 0.2 + player.volume/10})`;
      playerEl.style.backgroundColor = player.pose.position[2] ? '#333' : null;
      volumeEl.style.height = `${player.volume * 100}%`;
      volumeEl.style.filter = `hue-rotate(${player.pose.position[2] ? 180 : 0}deg)`;
    };
    _updatePlayerDomPosition();
    // player.pose.addEventListener('update', _updatePlayerDomPosition);
    
    let frame = null;
    const _recurse = () => {
      frame = requestAnimationFrame(() => {
        _recurse();
        
        _updatePlayerDomPosition();
        
        /* if (player.pose.extra.length > 0) {
          console.log('pose update', player.id, player.pose.position.join(','), player.pose.extra.slice());
        } */
      });
    };
    _recurse();
  };
  const _startWsrtc = async () => {
    await WSRTC.waitForReady();
    const wsrtc = new WSRTC(u);
    wsrtc.addEventListener('open', e => {
      wsrtc.localUser.setPose(
        Float32Array.from([1, 2, 0]),
        Float32Array.from([1, 0, 0, 0]),
        Float32Array.from([3, 3, 3]),
      );
      
      function makeid(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      }
      const name = makeid(5);
      wsrtc.localUser.setMetadata({
        name,
      });
      
      wsrtc.enableMic();
      
      const mousemove = e => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        wsrtc.localUser.setPose(
          Float32Array.from([
            x,
            y,
            wsrtc.localUser.pose.position[2],
          ]),
        );
      };
      const mousedown = e => {
        wsrtc.localUser.setPose(
          Float32Array.from([
            wsrtc.localUser.pose.position[0],
            wsrtc.localUser.pose.position[1],
            1,
          ]),
          undefined,
          undefined,
          [
            'lol',
            2,
            Float32Array.from([1, 2, 3, 4]),
          ],
        );
      };
      const mouseup = e => {
        wsrtc.localUser.setPose(
          Float32Array.from([
            wsrtc.localUser.pose.position[0],
            wsrtc.localUser.pose.position[1],
            0,
          ]),
        );
      };
      document.addEventListener('mousemove', mousemove);
      document.addEventListener('mousedown', mousedown);
      document.addEventListener('mouseup', mouseup);
      wsrtc.addEventListener('close', e => {
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mousedown', mousedown);
        document.removeEventListener('mouseup', mouseup);
      });
    });
    wsrtc.addEventListener('join', e => {
      const player = e.data;
      player.audioNode.connect(WSRTC.getAudioContext().destination);
      player.metadata.addEventListener('update', e => {
        // console.log('metadata update', player.id, player.metadata.toJSON());
      });
      player.addEventListener('leave', e => {
        // console.log('leave', player);
      });
      
      _createPlayerDom(player);
    });
  };
  _startWsrtc();
}, {
  once: true,
});