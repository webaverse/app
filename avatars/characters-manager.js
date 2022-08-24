import characterPackFilenames from '../characters/characters.json';

class CharactersManager extends EventTarget {
  constructor() {
    super();

    this.characters = {};
  }

  async init() {
    const loadPack = async (srcUrl) => {
      const res = await fetch(srcUrl);
      const j = await res.json();
      const {objects} = j;
      return objects;
    };

    const loadNpc = async (srcUrl) => {
      const res = await fetch(srcUrl);
      const j = await res.json();
      return j;
    };

    const extractPackName = (filename) => {
      return filename.replace(/\.[^/.]+$/, "")
    }

    // list npc file names
    for (const packFilename of characterPackFilenames) {
      const packName = extractPackName(packFilename);
      const pack = await loadPack('./characters/' + packFilename);
      
      const characters = [];
      for (const characterObj of pack) {
        const characterName = characterObj.name;
        const character = await loadNpc('./characters/' + characterName);
        characters.push(character);
      }
      this.characters[packName] = characters;
    }

    // load default spec
    if (characterPackFilenames.length > 0 && this.characters[extractPackName(characterPackFilenames[0])].length > 0) {
      this.defaultCharacterSpec = this.characters[extractPackName(characterPackFilenames[0])][0];
    } else {
      throw new Error('no default character spec');
    }
  }
}

const charactersManager = new CharactersManager();
await charactersManager.init();
export {
    charactersManager
};
