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

    this.messages = [];
  }
  getMessages() {
    return this.messages;
  }
  addMessage(object = null, message = '', {timeout = 3000} = {}) {
    const match = _getEmotion(message);
    const emotion = match && match.emotion;
    const fakeSpeech = match ? (match[1] !== message) : true;
    const m = {
      object,
      message,
      emotion,
      fakeSpeech,
    };
    this.messages.push(m);
    
    this.dispatchEvent(new MessageEvent('messageadd', {
      data: m,
    }));
    
    const localTimeout = setTimeout(() => {
      this.removeMessage(m);
    }, timeout);
  
    const messageremove = e => {
      if (e.data === m) {
        clearTimeout(localTimeout);
        this.removeEventListener('messageremove', messageremove);
      }
    };
    this.addEventListener('messageremove', messageremove);
  }
  removeMessage(m) {
    const index = this.messages.indexOf(m);
    if (index !== -1) {
      const m = this.messages[index];
      this.messages.splice(index, 1);
      
      this.dispatchEvent(new MessageEvent('messageremove', {
        data: m,
      }));
    }
  }
}
const chatManager = new ChatManager();

export {
  chatManager,
};