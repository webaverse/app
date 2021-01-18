import * as THREE from './three.module.js';
import {appManager, renderer, scene, orthographicScene, camera, dolly} from './app-object.js';

const chatMessagesEl = document.getElementById('chat-messages');

const addMessage = (username, text, {timeout = 10000} = {}) => {
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

  message.destroy = () => {
    clearTimeout(localTimeout);
  };
  
  const localTimeout = setTimeout(() => {
    message.parentNode.removeChild(message);
  }, timeout);
};
const removeMessage = message => {
  message.parentNode.removeChild(message);
  message.destroy();
};

export {
  addMessage,
  removeMessage,
};