import {
  makeLorePrompt,
  makeLoreStop,
  postProcessResponse,
  parseLoreResponses,
} from './lore-model.js'
import {
  defaultPlayerName,
  defaultPlayerBio,
  defaultObjectName,
  defaultObjectDescription,
} from './constants.js';

const numGenerateTries = 5;
const temperature = 1;
const top_p = 1;

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
class AIObject extends EventTarget {
  constructor({
    name = defaultObjectName,
    description = defaultObjectDescription,
  } = {}) {
    super();

    this.name = name;
    this.description = description;
  }
}
class AIScene {
  constructor({
    localPlayer,
    generateFn,
  }) {
    this.settings = [];
    this.objects = [];
    this.localCharacter = new AICharacter(localPlayer.name, localPlayer.bio);
    this.characters = [
      this.localCharacter,
    ];
    this.messages = [];
    this.generateFn = generateFn;

    const _waitForFrame = () => new Promise(resolve => {
      requestAnimationFrame(() => {
        resolve();
      });
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
      while (this.messages.length > 8) {
        this.messages.shift();
      }
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
      while (this.messages.length > 8) {
        this.messages.shift();
      }
      character.dispatchEvent(new MessageEvent('say', {
        data: {
          message,
          emote,
          action,
          object,
          target,
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
                const a = parseLoreResponses(response);
                if (a.length > 0) {
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
          }
        } else { // middle of conversation
          await _pushRequestMessage(message);
          
          for (let i = 0; i < numGenerateTries; i++) {
            // const nextCharacterIndex = 1 + Math.floor(Math.random() * (this.characters.length - 1)); // skip over local character
            // const nextCharacter = this.characters[nextCharacterIndex];
            let response = await this.generate();
            response = `+${response}`;
            const a = parseLoreResponses(response);
            if (a.length > 0) {
              for (const o of a) {
                const {
                  name,
                  message,
                } = o;
                const character = this.characters.find(c => c.name === name);
                // console.log('character name', this.characters.map(c => c.name), characterNameLowerCase, !!character);
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
      });
    });
  }
  addSetting(setting) {
    this.settings.push(setting);
  }
  removeSetting(setting) {
    this.settings.splice(this.settings.indexOf(setting), 1);
  }
  addCharacter(opts) {
    const character = new AICharacter(opts);
    this.characters.push(character);
    return character;
  }
  removeCharacter(character) {
    this.characters.splice(this.characters.indexOf(character), 1);
  }
  addObject(opts) {
    const object = new AIObject(opts);
    this.objects.push(object);
    return object;
  }
  removeObject(object) {
    this.objects.splice(this.objects.indexOf(object), 1);
  }
  async generate(dstCharacter = null) {
    const prompt = makeLorePrompt(
      this.settings,
      this.characters,
      this.messages,
      this.objects,
      dstCharacter
    );
    const stop = makeLoreStop(this.localCharacter, 0);
    let response = await this.generateFn(prompt, stop);
    console.log('got response', {prompt, response});
    response = postProcessResponse(response, this.characters, dstCharacter);
    return response;
  }
}

class LoreAI {
  constructor() {
    this.endpoint = null;
  }
  async generate(prompt, {
    stop = '\n',
    max_tokens = 100,
    // temperature,
    // top_p,
  } = {}) {
    if (prompt) {    
      const query = {};
      query.prompt = prompt;
      query.max_tokens = max_tokens;
      query.stop = stop;
      /* if (typeof temperature === 'number') {
        query.temperature = temperature;
      }
      if (typeof top_p === 'number') {
        query.top_p = top_p;
      } */

      const result = await this.endpoint(query);

      const {choices} = result;
      const {text} = choices[0];
      return text;
    } else {
      reject(new Error('prompt is required'));
    }
  }
  async setEndpointUrl(url) {
    this.endpoint = async query => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });
      const j = await res.json();
      return j;
    };
  }
  async setEndpoint(endpoint) {
    this.endpoint = endpoint;
  }
  createScene(localPlayer) {
    return new AIScene({
      localPlayer,
      generateFn: (prompt, stop) => {
        return this.generate(prompt, {
          stop,
          // temperature,
          // top_p,
        });
      },
    });
  }
};
const loreAI = new LoreAI();
export default loreAI;