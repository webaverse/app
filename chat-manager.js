import {makeId, makePromise} from './util.js';
import metaversefileApi from 'metaversefile';

const _getEmotion = text => {
  let match;
  if (match = text.match(/(😃|😊|😁|😄|😆|(?:^|\s)lol(?:$|\s))/)) {
    match.emotion = 'joy';
    return match;
  } else if (match = text.match(/(😉|😜|😂|😍|😎|😏|😇|❤️|💗|💕|💞|💖|👽)/)) {
    match.emotion = 'fun';
    return match;
  } else if (match = text.match(/(😞|😖|😒|😱|😨|😰|😫)/)) {
    match.emotion = 'sorrow';
    return match;
  } else if (match = text.match(/(😠|😡|👿|💥|💢)/)) {
    match.emotion = 'angry';
    return match;
  } else if (match = text.match(/(😐|😲|😶)/)) {
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
  addPlayerMessage(player, message = '', {timeout = 3000} = {}) {
    const chatId = makeId(5);
    const match = _getEmotion(message);
    const emotion = match && match.emotion;
    const fakeSpeech = match ? (match[1] !== message) : true;
    const m = {
      type: 'chat',
      chatId,
      playerName: player.name,
      message,
      emotion,
      fakeSpeech,
    };
    player.addAction(m);
    // this.messageActions.push(m);
    
    this.dispatchEvent(new MessageEvent('messageadd', {
      data: {
        player,
        message: m,
      },
    }));
    
    const localTimeout = setTimeout(() => {
      this.removePlayerMessage(player, m);
    }, timeout);
    m.cleanup = () => {
      clearTimeout(localTimeout);
    };
    
    return m;
  }
  addMessage(message, opts) {
    const localPlayer = metaversefileApi.useLocalPlayer();
    return this.addPlayerMessage(localPlayer, message, opts);
  }
  removePlayerMessage(player, m) {
    // const index = this.messageActions.indexOf(m);
    // if (index !== -1) {
      // const m = this.messageActions[index];
      m.cleanup();
      // this.messageActions.splice(index, 1);
      
      const actionIndex = player.findActionIndex(action => action.chatId === m.chatId);
      if (actionIndex !== -1) {
        player.removeActionIndex(actionIndex);
      } else {
        console.warn('remove unknown message action 2', m);
      }
      
      this.dispatchEvent(new MessageEvent('messageremove', {
        data: {
          player,
          message: m,
        },
      }));
    /* } else {
      console.warn('remove unknown message action 1', m);
    } */
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
        // Promise.resolve().then(() => {
          this.waitForVoiceTurn(fn2);
        // });
      }

      return result;
    } else {
      const p = makePromise();
      this.voiceQueue.push(async () => {
        const p2 = fn();
        // console.log('wait 3');
        const result = await p2;
        // console.log('wait 4');
        // Promise.resolve().then(() => {
          p.accept(result);
        // });
        return result;
      });
      const result = await p;
      return result;
    }
  }
}
const chatManager = new ChatManager();

export {
  chatManager,
};