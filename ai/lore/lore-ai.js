import {
  defaultPlayerName,
  defaultPlayerBio,
  defaultObjectName,
  defaultObjectDescription,

  makeLorePrompt,
  makeLoreStop,
  postProcessResponse,
  parseLoreResponses,

  makeCommentPrompt,
  makeCommentStop,
  parseCommentResponse,

  makeSelectTargetPrompt,
  makeSelectTargetStop,
  parseSelectTargetResponse,

  makeSelectCharacterPrompt,
  makeSelectCharacterStop,
  parseSelectCharacterResponse,

  makeChatPrompt,
  makeChatStop,
  parseChatResponse,

  makeOptionsPrompt,
  makeOptionsStop,
  parseOptionsResponse,

  makeCharacterIntroPrompt,
  makeCharacterIntroStop,
  parseCharacterIntroResponse,
  makeQuestCheckerPrompt,
  makeQuestCheckerStop,
  makeQuestPrompt,
  makeQuestStop,
  parseQuestResponse,
} from './lore-model.js';

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
              const response = await this.generate(mentionedCharacter);
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
            const response = await this.generate();
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
    const prompt = makeLorePrompt({
      settings: this.settings,
      characters: this.characters,
      messages: this.messages,
      objects: this.objects,
      dstCharacter,
    });
    const stop = makeLoreStop(this.localCharacter, 0);
    let response = await this.generateFn(prompt, stop);
    // console.log('got lore', {prompt, response});
    response = postProcessResponse(response, this.characters, dstCharacter);
    return response;
  }

  async generateLocationComment(name, dstCharacter = null) {
    const prompt = makeCommentPrompt({
      settings: this.settings,
      dstCharacter,
      name,
    });
    const stop = makeCommentStop();
    let response = await this.generateFn(prompt, stop);
    response = parseCommentResponse(response);
    // console.log('got comment', {prompt, response});
    return response;
  }

  // XXX needs better API
  async generateSelectTargetComment(name, description) {
    const prompt = makeSelectTargetPrompt({
      name,
      description,
    });
    console.log('select target prompt', {prompt});
    const stop = makeSelectTargetStop();
    let response = await this.generateFn(prompt, stop);
    console.log('select target response', {prompt, response});
    if (response?.length === 0) {
      return this.generateSelectTargetComment(name, description);
    }
    response = parseSelectTargetResponse(response);
    if (response?.value?.length === 0) {
      return this.generateSelectTargetComment(name, description);
    }
    // console.log('got comment', {prompt, response});
    return response;
  }

  async generateSelectCharacterComment(name, description) {
    const prompt = makeSelectCharacterPrompt({
      name,
      description,
    });
    console.log('select character prompt', {prompt});
    const stop = makeSelectCharacterStop();
    const response = await this.generateFn(prompt, stop);
    console.log('select character response', {prompt, response});
    if (response?.length === 0) {
      return this.generateSelectCharacterComment(name, description);
    }
    const response2 = parseSelectCharacterResponse(response);
    console.log('select character parsed', {response2});
    return response2;
  }

  async generateChatMessage(messages, nextCharacter) {
    const prompt = makeChatPrompt({
      messages,
      nextCharacter,
    });
    console.log('chat prompt', {prompt});
    const stop = makeChatStop();
    const response = await this.generateFn(prompt, stop);
    console.log('chat response', {prompt, response});
    const response2 = parseChatResponse(response);
    if (!response2) {
      return this.generateChatMessage(messages, nextCharacter);
    }
    console.log('chat parsed', {response2});
    return response2;
  }

  async generateDialogueOptions(messages, nextCharacter) {
    const prompt = makeOptionsPrompt({
      messages,
      nextCharacter,
    });
    console.log('dialogue options prompt', {prompt});
    const stop = makeOptionsStop();
    const response = await this.generateFn(prompt, stop);
    console.log('dialogue options response', {prompt, response});
    const response2 = parseOptionsResponse(response);
    console.log('dialogue options parsed', {response2});
    return response2;
  }

  async generateCharacterIntroPrompt(name, bio) {
    const prompt = makeCharacterIntroPrompt({
      name,
      bio,
    });
    console.log('dialogue options prompt', {prompt});
    const stop = makeCharacterIntroStop();
    const response = await this.generateFn(prompt, stop);
    console.log('dialogue options response', {prompt, response});
    const response2 = parseCharacterIntroResponse(response);
    console.log('dialogue options parsed', {response2});
    return response2;
  }

  async checkIfQuestIsApplicable(location, conversation, user1, user2, tries = 0) {
    const prompt = makeQuestCheckerPrompt(location, conversation, user1, user2);
    const stop = makeQuestCheckerStop();
    const response = (await this.generateFn(prompt, stop))?.trim();
    if (response?.length <= 0) {
      if (tries >= 5) {
        return 'no';
      } else {
        return this.checkIfQuestIsApplicable(location, conversation, user1, user2, tries++);
      }
    }
    console.log('response:', response);
    return response?.trim();
  }

  async generateQuest({conversation, location, user1, user2}) {
    const prompt = makeQuestPrompt({conversation, location, user1, user2});
    const stop = makeQuestStop();
    const response = await this.generateFn(prompt, stop);
    const response2 = parseQuestResponse(response);
    return response2;
  }
}

class LoreAI {
  constructor() {
    this.endpointFn = null;
  }

  async generate(prompt, {
    stop,
    max_tokens = 100,
    temperature,
    frequency_penalty,
    presence_penalty,
    // top_p,
  } = {}) {
    if (prompt) {
      const query = {};
      query.prompt = prompt;
      query.max_tokens = max_tokens;
      if (stop !== undefined) {
        query.stop = stop;
      }
      if (temperature !== undefined) {
        query.temperature = temperature;
      }
      if (frequency_penalty !== undefined) {
        query.frequency_penalty = frequency_penalty;
      }
      if (presence_penalty !== undefined) {
        query.presence_penalty = presence_penalty;
      }

      query.temperature = temperature;
      query.top_p = top_p;

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
      return new Error('prompt is required');
    }
  }

  async endpoint(query) {
    if (this.endpointFn) {
      return await this.endpointFn(query);
    } else {
      return {
        choices: [{
          text: '',
        }],
      };
    }
  }

  setEndpoint(endpointFn) {
    this.endpointFn = endpointFn;
  }

  async setEndpointUrl(url) {
    if (url) {
      const endpointFn = async query => {
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
      this.setEndpoint(endpointFn);
    } else {
      this.setEndpoint(null);
    }
  }

  createScene(localPlayer) {
    return new AIScene({
      localPlayer,
      generateFn: (prompt, stop) => {
        return this.generate(prompt, {
          stop,
          temperature: 0.85,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
          // top_p,
        });
      },
    });
  }
}
const loreAI = new LoreAI();
export default loreAI;
