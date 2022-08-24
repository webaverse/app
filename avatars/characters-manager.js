import characterPackFilenames from '../characters/characters.json';

function typeContentToUrl(type, content) {
  if (typeof content === 'object') {
    content = JSON.stringify(content);
  }
  const dataUrlPrefix = 'data:' + type + ',';
  return '/@proxy/' + dataUrlPrefix + encodeURIComponent(content).replace(/\%/g, '%25')//.replace(/\\//g, '%2F');
}
    
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

    const extractPackName = (filename) => {
      return filename.replace(/\.[^/.]+$/, "")
    }

    // list npc file names
    for (const packFilename of characterPackFilenames) {
      const packName = extractPackName(packFilename);
      this.characters[packName] = await loadPack('./characters/' + packFilename);
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
