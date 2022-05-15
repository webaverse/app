import {
  defaultPlayerName,
  defaultPlayerBio,
  defaultObjectName,
  defaultObjectDescription,
  makeLorePrompt,
  makeLoreStop,
  makeCommentPrompt,
  makeCommentStop,
  parseCommentResponse,
  postProcessResponse,
  parseLoreResponses,
} from './lore-model.js'

const numGenerateTries = 5;
const temperature = 1;
const top_p = 1;

//--------------------------------- ConvAI Mods ------------------------------
// Initializing the action generation URL from ConvAI
const actionGenerationURl = `https://test.convai.com/getActions`
//----------------------------------------------------------------------------

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
    getActionsFn
  }) {
    this.settings = [];
    this.objects = [];
    this.localCharacter = new AICharacter(localPlayer.name, localPlayer.bio);
    this.characters = [
      this.localCharacter,
    ];
    this.messages = [];
    this.generateFn = generateFn;

    //------------------------------------ ConvAI Mods ------------------------------------
    // Defining the initial action list and initializing the action-generation function
    this.actions = ['follow', 'moveto', 'pickup', 'grab', 'drop', 'jumps', 'attack', 'stop']
    this.getActionsFn = getActionsFn;
    //-------------------------------------------------------------------------------------

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
    console.log('got lore', {prompt, response});

    response = postProcessResponse(response, this.characters, dstCharacter);
    
    //------------------------ ConvAI Mods ---------------------------
    // Getting corresponding actions from the API call.
    // Actions responses are console logged for now to be later parsed based on the desired format
    let parsedResponse = parseLoreResponses(response)[0]
    
    for(let i=0;i<this.characters.length;i++){
      if(this.characters[i].name === parsedResponse.name){
        parsedResponse.character = this.characters[i];
        break;
      }
    }
    this.messages.push(parsedResponse);
    let tempActions = await this.getActionsFn(
      this.actions,
      this.objects, 
      this.characters, 
      this.messages)
    console.log("Corresponding Actions: ", tempActions.split("\n"));
    //-----------------------------------------------------------------

    return response;
  }
  async generateComment(name, dstCharacter = null) {
    const prompt = makeCommentPrompt({
      settings: this.settings,
      dstCharacter,
      name,
    });
    const stop = makeCommentStop();
    let response = await this.generateFn(prompt, stop);
    response = parseCommentResponse(response);
    console.log('got comment', {prompt, response});
    return response;
  }
}

class LoreAI {
  constructor() {
    this.endpointFn = null;
  }
  async generate(prompt, {
    stop,
    max_tokens = 100,
    // temperature,
    // top_p,
  } = {}) {
    if (prompt) {    
      const query = {};
      query.prompt = prompt;
      query.max_tokens = max_tokens;
      if (stop !== undefined) {
        query.stop = stop;
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

      //--------------------------------- ConvAI Mods ------------------------------
      // Dummy hardcoded responses for testing
      // return "Hi there [emote=none,action=none,object=none,target=none]"
      //----------------------------------------------------------------------------

    } else {
      reject(new Error('prompt is required'));
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

  //------------------------------ ConvAI Mods ---------------------------------
  // Setting up an async function to call the AconvAI action generation endpoint
  async generateActions(
    actions,
    objects,
    characters,
    messages
  ){
    const query = {};
    query.actionList = actions;
    query.objectList = objects;
    query.characterList = characters;
    query.conversationLogs = messages;

    // console.log("ConvAi Request Body: ", query);
    let response = await fetch(
      actionGenerationURl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      }
    ).then((response) => 
      response.json()
    ).then((response) => {
      // console.log("ConvAI Response: ", response);
      return response['response'];
    })
    .catch((error) =>{
      console.log("ConvAI API call error: ", error)
    })
    return response;
  }
  //----------------------------------------------------------------------------------
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
          // temperature,
          // top_p,
        });
      },
      //--------------------------------- ConvAI Mods ------------------------------
      getActionsFn: (actions, objects, characters, messages) => {
        return this.generateActions(
          actions,
          objects,
          characters,
          messages
        )
      }
      //----------------------------------------------------------------------------
    });
  }
};
const loreAI = new LoreAI();
export default loreAI;