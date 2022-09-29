import {makeId, makePromise} from './util.js';
import metaversefileApi from 'metaversefile';

const _getEmotion = text => {
  let match;
  if ((match = text.match(/(😃|😊|😁|😄|😆|(?:^|\s)lol(?:$|\s))/))) {
    match.emotion = 'joy';
    return match;
  } else if ((match = text.match(/(😉|😜|😂|😍|😎|😏|😇|❤️|💗|💕|💞|💖|👽)/))) {
    match.emotion = 'fun';
    return match;
  } else if ((match = text.match(/(😞|😖|😒|😱|😨|😰|😫)/))) {
    match.emotion = 'sorrow';
    return match;
  } else if ((match = text.match(/(😠|😡|👿|💥|💢)/))) {
    match.emotion = 'angry';
    return match;
  } else if ((match = text.match(/(😐|😲|😶)/))) {
    match.emotion = 'neutral';
    return match;
  } else {
    return null;
  }
};

class ChatManager extends EventTarget {
  constructor() {
    super();

    this.voiceRunning = false;
    this.voiceQueue = [];
  }

  addPlayerMessage(player, m, {timeout = 3000} = {}) {
    const match = _getEmotion(m.message);
    const emotion = match ? match.emotion : null;
    const value = emotion ? 1 : 0;
    player.addAction(m);

    const _addFacePose = () => {
      if (emotion) {
        player.addAction({
          type: 'facepose',
          emotion,
          value: 1,
        });
      }
    };
    _addFacePose();
    const _removeFacePose = () => {
      if (emotion) {
        const facePoseActionIndex = player.findActionIndex(
          action => action.type === 'facepose' && action.value === value,
        );
        if (facePoseActionIndex !== -1) {
          player.removeActionIndex(facePoseActionIndex);
        }
      }
    };

    this.dispatchEvent(
      new MessageEvent('messageadd', {
        data: {
          player,
          message: m,
        },
      }),
    );

    const localTimeout = setTimeout(() => {
      this.removePlayerMessage(player, m);

      _removeFacePose();
    }, timeout);
    m.cleanup = () => {
      clearTimeout(localTimeout);
    };

    return m;
  }

  addMessage(message, opts) {
    const chatId = makeId(5);
    const localPlayer = metaversefileApi.useLocalPlayer();
    const m = {
      type: 'chat',
      chatId,
      playerId: localPlayer.playerId,
      playerName: localPlayer.name,
      message,
    };

    return this.addPlayerMessage(localPlayer, m, opts);
  }

  removePlayerMessage(player, m) {
    m.cleanup();

    const actionIndex = player.findActionIndex(
      action => action.chatId === m.chatId,
    );
    if (actionIndex !== -1) {
      player.removeActionIndex(actionIndex);
    } else {
      console.warn('remove unknown message action 2', m);
    }

    this.dispatchEvent(
      new MessageEvent('messageremove', {
        data: {
          player,
          message: m,
        },
      }),
    );
  }

  removeMessage(m) {
    const localPlayer = metaversefileApi.useLocalPlayer();
    this.removePlayerMessage(localPlayer, m);
  }

  async waitForVoiceTurn(fn) {
    // console.log('wait for voice queue', this.voiceRunning, this.voiceQueue.length);

    if (!this.voiceRunning) {
      this.voiceRunning = true;
      // console.log('wait 0');
      const p = fn();
      // console.log('wait 1');
      const result = await p;
      // console.log('wait 2');

      this.voiceRunning = false;
      if (this.voiceQueue.length > 0) {
        const fn2 = this.voiceQueue.shift();
        this.waitForVoiceTurn(fn2);
      }

      return result;
    } else {
      const p = makePromise();
      this.voiceQueue.push(async () => {
        const p2 = fn();
        // console.log('wait 3');
        const result = await p2;
        // console.log('wait 4');
        p.accept(result);
        return result;
      });
      const result = await p;
      return result;
    }
  }
}
const chatManager = new ChatManager();

export {chatManager};
