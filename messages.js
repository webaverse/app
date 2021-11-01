import * as THREE from 'three';
import {appManager, scene, camera, dolly} from './renderer.js';

const maxMessages = 8;
const chatMessagesEl = document.getElementById('chat-messages');

class Messages extends EventTarget {
  constructor({maxMessages}) {
    super();

    this.maxMessages = maxMessages;
  }
  addMessage(username, text, {/*timeout = 10000, */update = true} = {}) {
    const message = document.createElement('div');
    message.classList.add('message');
    message.innerHTML = `\
      <div class=name></div>
      <div class=text></div>
    `;
    const nameEl = message.querySelector('.name');
    nameEl.innerText = `${username}: `;
    const textEl = message.querySelector('.text');
    textEl.innerText = text;
    chatMessagesEl.appendChild(message);

    while (chatMessagesEl.childNodes.length > this.maxMessages) {
      chatMessagesEl.removeChild(chatMessagesEl.childNodes[0]);
    }

    /* message.destroy = () => {
      clearTimeout(localTimeout);
    };
    
    const localTimeout = setTimeout(() => {
      message.parentNode.removeChild(message);
    }, timeout); */

    if (update) {
      this.dispatchEvent(new MessageEvent('messageadd', {
        data: {
          username,
          text,
        },
      }));
    }
  }
  removeMessage(message) {
    message.parentNode.removeChild(message);
    // message.destroy();
  }
}
const messages = new Messages({
  maxMessages,
});

export default messages;