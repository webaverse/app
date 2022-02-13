import metaversefile from 'metaversefile';
import {chatManager} from './chat-manager.js';
import {loreAiEndpoint} from './constants.js';

const characterLore = `\
# Setting

AI anime avatars in a virtual world. They have human-level intelligence, but they have interesting personalities and conversations. The script is throught provoking.
`;
const _makeChatPrompt = (srcCharacterName, dstCharacterName, srcBio, dstBio, messages) => `\
${characterLore}
# Characters

${srcCharacterName}: ${srcBio}
${dstCharacterName}:  ${dstBio}
# Scene 1

${
  messages.map(m => {
    return `${m.name}: ${m.message}`;
  }).join('\n')
}
${((messages.length % 2) === 1) ?
  `${dstCharacterName}:`
:
  `${srcCharacterName}:`
}`;

class AIScene {
  constructor(localPlayer, {
    setting = 'Some place.',
 } = {}) {
    this.setting = setting;
    this.characters = [];
    this.messages = [];

    const messages = [];
    localPlayer.characterHups.addEventListener('hupadd', e => {
      const {hup} = e.data;
      hup.addEventListener('voicestart', async e => {
        const {message} = e.data;
        if (messages.length > 0 || message.toLowerCase().includes(npcNameLowerCase)) { // continuation or start of conversation
          messages.push({
            name: localPlayerName,
            message: message,
          });

          const prompt = _makeChatPrompt(localPlayerName, npcName, localPlayerBio, npcBio, messages);
          let response = await loreAI.generate(prompt, {
            end: '\n',
            maxTokens: 100,
            temperature: 1,
            top_p: 0,
          });
          response = response.trimLeft();

          console.log('got response', [prompt], [response]);

          if (response) {
            chatManager.addPlayerMessage(npcPlayer, response);
            messages.push({
              name: npcName,
              message: response,
            });
          }
        }
      });
    });
  }
  setSetting(setting) {
    this.setting = setting;
  }
  addCharacter(characterSpec) {
    this.characters.push(characterSpec);
  }
}

class LoreAI {
  generate(prompt, {
    end,
    maxTokens = 25,
    temperature,
    top_p,
  } = {}) {
    return new Promise((resolve, reject) => {
      if (prompt) {    
        const url = new URL(loreAiEndpoint);
        url.searchParams.set('p', prompt);
        url.searchParams.set('l', maxTokens);
        if (typeof end !== 'undefined') {
          url.searchParams.set('e', end);
        }
        if (typeof temperature === 'number') {
          url.searchParams.set('t', temperature);
        }
        if (typeof top_p === 'number') {
          url.searchParams.set('tp', top_p);
        }
        // console.log('got url', url);
      
        // prompt = `# Scene 1\n\nThe characters are having a conversation.\n\nCharacter 1: ${prompt}\nCharacter 2:`;
        const es = new EventSource(url);
        let fullS = '';
        es.addEventListener('message', e => {
          const s = e.data;
          // console.log('got s', s);
          if (s !== '[DONE]') {
            const j = JSON.parse(s);
            // console.log(j.choices);
            const {choices} = j;
            const {text} = choices[0];
            fullS += text;
      
            const endIndex = fullS.indexOf(end);
            // console.log('got end index', {fullS, end, endIndex});
            if (endIndex !== -1) {
              es.close();
              resolve(fullS.substring(0, endIndex));
            }
          } else {
            // console.log('close');
            es.close();
            resolve(fullS);
          }
      
          // console.log(JSON.stringify(prompt + fullS));
        });
        es.addEventListener('error', err => {
          console.log('lore event source error', err);
          es.close();
          reject(err);
        });
      } else {
        reject(new Error('prompt is required'));
      }
    });
  }
  createScene(localPlayer, opts) {
    return new AIScene(localPlayer, opts);
  }
};
const loreAI = new LoreAI();
export default loreAI;