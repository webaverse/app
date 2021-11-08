import {makeId} from './util.js';
import metaversefileApi from 'metaversefile';
const {useLocalPlayer} = metaversefileApi;

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

    this.messageActions = [];
  }
  /* getMessageActions() {
    return this.messageActions;
  } */
  addMessage(message = '', {timeout = 3000} = {}) {
    const localPlayer = useLocalPlayer();
    const chatId = makeId(5);
    const match = _getEmotion(message);
    const emotion = match && match.emotion;
    const fakeSpeech = match ? (match[1] !== message) : true;
    const m = {
      type: 'chat',
      chatId,
      message,
      emotion,
      fakeSpeech,
    };
    localPlayer.addAction(m);
    this.messageActions.push(m);
    
    /* this.dispatchEvent(new MessageEvent('messageadd', {
      data: m,
    })); */
    
    const localTimeout = setTimeout(() => {
      this.removeMessage(m);
    }, timeout);
    m.cleanup = () => {
      clearTimeout(localTimeout);
    };
    
    return m;
  }
  removeMessage(m) {
    const localPlayer = useLocalPlayer();
    const index = this.messageActions.indexOf(m);
    if (index !== -1) {
      const m = this.messageActions[index];
      m.cleanup();
      this.messageActions.splice(index, 1);
      
      const actionIndex = localPlayer.findActionIndex(action => action.chatId === m.chatId);
      if (actionIndex !== -1) {
        localPlayer.removeActionIndex(actionIndex);
      } else {
        console.warn('remove unknown message action 2', m);
      }
      
      /* this.dispatchEvent(new MessageEvent('messageremove', {
        data: m,
      })); */
    } else {
      console.warn('remove unknown message action 1', m);
    }
  }
}
const chatManager = new ChatManager();

export {
  chatManager,
};