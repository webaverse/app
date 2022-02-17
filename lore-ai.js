// import metaversefile from 'metaversefile';
// import {chatManager} from './chat-manager.js';
import murmurhash3js from 'murmurhash3js';
import {loreAiEndpoint, defaultPlayerName, defaultPlayerBio, defaultSetting} from './constants.js';

const numGenerateTries = 3;
const temperature = 1;
const top_p = 1;

const hash = s => murmurhash3js.x86.hash32(s).toString(16);
const characterHash = (character, index) => `${hash(character.name)}/${character.name}#${index+1}`;
const characterLore = `\
# Overview

AI anime avatars in a virtual world. They have human-level intelligence, but they have interesting personalities and conversations. The script is throught provoking.
`;
const _makeChatPrompt = (setting, characters, messages, dstCharacter) => `\
${characterLore}

# Script Format

Each line starts with the plus sign (+) followed by the character's Id, followed by a chat message. Chat messages can have actions in them.

If the character's chat mentions a logical action performed by the character, it should be included in the metadata.

\`\`\`
+${characterHash({name:'Character1'}, 0)}: <text> [emote={normal,happy,sorrow,angry,joy,surprised},action={moveto,follow,use,give,pickup,drop,fetch},object=(none|<characterId>|<objectId>),target=(none|<characterId>|<objectId>)]
\`\`\`

Chat examples:

\`\`\`
+${characterHash({name:'Character1'}, 0)}: What is this? [emote=none,action=none,object=none,target=none]
+${characterHash({name:'Character1'}, 0)}: Hi! [emote=happy,action=none,object=none,target=none]
+${characterHash({name:'Npc1'}, 1)}: I will beat you! [emote=angry,action=none,object=none,target=none]
+${characterHash({name:'Npc1'}, 1)}: I wasn't expecting that! [emote=surprised,action=none,object=none,target=none]
\`\`\`

Action examples:

\`\`\`
+${characterHash({name:'Npc1'}, 1)}: I'm coming to you, Character1. [emote=none,action=moveto,object=none,target=${characterHash({name:'Character1'}, 0)}]
+${characterHash({name:'Npc1'}, 1)}: What does this button do? [emote=surprised,action=use,object=${'BUTTON#1'},target=none]
+${characterHash({name:'Npc1'}, 1)}: I'm gonna follow you, Character1. [emote=happy,action=follow,object=none,target=${characterHash({name:'Character1'}, 0)}]
+${characterHash({name:'Npc1'}, 1)}: Here, Character1, take my sword. [emote=happy,action=give,object=${'SWORD#1'},target=${characterHash({name:'Character1'}, 0)}]
+${characterHash({name:'Npc1'}, 1)}: Hey, I picked up a sword. [emote=joy,action=pickup,object=${'SWORD#1'},target=none]
+${characterHash({name:'Npc1'}, 1)}: I'm dropping this potion. [emote=none,action=drop,object=${'POTION#2'},target=none]
+${characterHash({name:'Npc1'}, 1)}: Ok Character1 I'll go get the bow. [emote=none,action=fetch,object=${'BOW#2'},target=${characterHash({name:'Character1'}, 0)}]
\`\`\`

# Scene 1

# Setting

${setting}

## Characters

${
  characters.map((c, i) => {
    return `Id: ${characterHash(c, i)}
Name: ${c.name}
Bio: ${c.bio}
`;
  }).join('\n')
}

# Props

Id: SILSWORD#1
Name: The Sil Sword
Bio: The Sil Sword is a sword that is made of the sil of the Silph Co. Just kidding, it stands for Scillia's Sword.

## Script (raw format)

${
  messages.map(m => {
    const characterIndex = characters.indexOf(m.character);
    const suffix = `[emote=${m.emote},action=${m.action},object=${m.object},target=${m.target}]`;
    return `+${characterHash(m.character, characterIndex)}: ${m.message} ${suffix}`;
  }).join('\n')
}
+${
  dstCharacter ? `${characterHash(dstCharacter, characters.indexOf(dstCharacter))}:` : ''
}`;

const parseLoreResponse = response => {
  let match;
  // console.log('parse lore', response, match);
  /* if (match = response?.match(/^\+([^\/]+?)\/([^#]+?)#([0-9]+?):([\s\S]*)\[emote=([\s\S]*?)\]$/)) {
    const hash = match[1];
    const name = match[2];
    const nonce = parseInt(match[3], 10);
    const message = match[4].trim();
    const emote = match[5];
    const action = 'none';
    const object = 'none';
    const target = 'none';
    return {
      hash,
      name,
      nonce,
      message,
      emote,
      action,
      object,
      target,
    };
  } else */if (match = response?.match(/^\+([^\/]+?)\/([^#]+?)#([0-9]+?):([\s\S]*)\[emote=([\s\S]*?),action=([\s\S]*?),object=([\s\S]*?),target=([\s\S]*?)\]$/)) {
    const hash = match[1];
    const name = match[2];
    const nonce = parseInt(match[3], 10);
    const message = match[4].trim();
    const emote = match[5];
    const action = match[6];
    const object = match[7];
    const target = match[8];
    return {
      hash,
      name,
      nonce,
      message,
      emote,
      action,
      object,
      target,
    };
  } else if (match = response?.match(/^\+([^\/]+?)\/([^#]+?)#([0-9]+?):([\s\S]*)$/)) {
    const hash = match[1];
    const name = match[2];
    const nonce = parseInt(match[3], 10);
    const message = match[4].trim();
    const emote = 'normal';
    const action = 'none';
    const object = 'none';
    const target = 'none';
    return {
      hash,
      name,
      nonce,
      message,
      emote,
      action,
      object,
      target,
    };
  } else {
    return null;
  }
};
const parseLoreResponses = responses => responses
  .split('\n')
  .map(s => parseLoreResponse(s))
  .filter(o => o !== null);
class AICharacter extends EventTarget {
  constructor({
    name = defaultPlayerName,
    bio = defaultPlayerBio,
  } = {}) {
    super();

    this.name = name;
    this.bio = bio;
  }
}
class AIScene {
  constructor(localPlayer, {
    setting = defaultSetting,
  } = {}) {
    this.setting = setting;
    this.localCharacter = new AICharacter(localPlayer.name, localPlayer.bio);
    this.characters = [
      this.localCharacter,
    ];
    this.messages = [];

    const _waitForFrame = () => new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
    const _pushRequestMessage = async message => {
      const emote = 'none';
      const action = 'none';
      const object = 'none';
      const target = 'none';
      this.messages.push({
        character: this.localCharacter,
        message,
        emote,
        action,
        object,
        target,
      });
      await _waitForFrame();
    };
    const _pushResponseMessage = async o => {
      const {name, message, emote, action, object, target} = o;
      const character = this.characters.find(c => c.name === name);
      this.messages.push({
        character,
        message,
        emote,
        action,
        object,
        target,
      });
      character.dispatchEvent(new MessageEvent('say', {
        data: {
          message,
        },
      }));
      await _waitForFrame();
    };
    localPlayer.characterHups.addEventListener('hupadd', e => {
      const {hup} = e.data;
      hup.addEventListener('voicestart', async e => {
        const {message} = e.data;
        const messageLowerCase = message.toLowerCase();

        if (this.messages.length === 0) { // start of conversation
          const mentionedCharacterIndex = this.characters.findIndex(c => {
            return c !== this.localCharacter && messageLowerCase.includes(c.name.toLowerCase());
          });
          if (mentionedCharacterIndex !== -1) {
            const mentionedCharacter = this.characters[mentionedCharacterIndex];
            await _pushRequestMessage(message);
            for (let i = 0; i < numGenerateTries; i++) {
              let response = await this.generate(mentionedCharacter);
              if (response) {
                response = `+${characterHash(mentionedCharacter, mentionedCharacterIndex)}: ${response}`;
                const a = parseLoreResponses(response);
                for (const o of a) {
                  const {name, message} = o;
                  const character = this.characters.find(c => c.name === name);
                  if (message && character && character !== this.localCharacter) {
                    await _pushResponseMessage(o);
                  } else {
                    break;
                  }
                }
                break;
              }
            }
          }
        } else { // middle of conversation
          await _pushRequestMessage(message);
          
          for (let i = 0; i < numGenerateTries; i++) {
            // const nextCharacterIndex = 1 + Math.floor(Math.random() * (this.characters.length - 1)); // skip over local character
            // const nextCharacter = this.characters[nextCharacterIndex];
            let response = await this.generate();
            response = `+${response}`;
            const a = parseLoreResponses(response);
            for (const o of a) {
              const {
                name,
                message,
              } = o;
              const character = this.characters.find(c => c.name === name);
              // console.log('character name', this.characters.map(c => c.name), characterNameLowerCase, !!character);
              if (message && character && character !== this.localCharacter) {
                await _pushResponseMessage(o);
              }
              break;
            }
          }
        }
      });
    });
  }
  setSetting(setting) {
    this.setting = setting;
  }
  addCharacter(opts) {
    const character = new AICharacter(opts);
    this.characters.push(character);
    return character;
  }
  removeCharacter(character) {
    this.characters.splice(this.characters.indexOf(character), 1);
  }
  async generate(dstCharacter = null) {
    const prompt = _makeChatPrompt(
      this.setting,
      this.characters,
      this.messages,
      dstCharacter
    );
    /* console.log('generate prompt', prompt, [
      this.setting,
      this.characters,
      this.messages,
      dstCharacter,
    ]); */
    let response = await loreAI.generate(prompt, {
      end: `\n+${characterHash(this.localCharacter, 0)}`,
      maxTokens: 100,
      temperature,
      top_p,
    });
    // if (/[a-z]/i.test(response)) {
      console.log('got response', {prompt, response});
      response = response.trim();
    /* } else {
      response = '';
    } */
    return response;
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
        const openAiKey = localStorage.getItem('openAiKey');
        if (openAiKey) {
          url.searchParams.set('k', openAiKey);
        }
        // console.log('got url', url);
      
        const es = new EventSource(url);
        let fullS = '';
        es.addEventListener('message', e => {
          const s = e.data;
          // console.log('got s', s);

          const _finish = () => {
            // console.log('close');
            es.close();
            resolve(fullS);
          };
          if (s !== '[DONE]') {
            const j = JSON.parse(s);
            // console.log(j.choices);
            const {choices} = j;
            if (choices) {
              const {text} = choices[0];
              fullS += text;
        
              const endIndex = fullS.indexOf(end);
              // console.log('got end index', {fullS, end, endIndex});
              if (endIndex !== -1) {
                es.close();
                resolve(fullS.substring(0, endIndex));
              }
            } else {
              _finish();
            }
          } else {
            _finish();
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