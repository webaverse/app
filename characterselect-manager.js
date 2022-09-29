import {packs, defaultCharacter} from './characters/characters.json';

const loadNpc = async srcUrl => {
  const res = await fetch(srcUrl);
  const j = await res.json();
  return j;
};

const charactersDir = '../characters/';

const getCharacterFullPath = filename => {
  return charactersDir + filename;
};

class CharacterSelectManager {
  constructor() {
    this.charactersMap = null;
    this.defaultCharacterSpec = null;
  }

  async getDefaultSpecAsync() {
    if (!this.defaultCharacterSpec) {
      const characterName = defaultCharacter;
      this.defaultCharacterSpec = await loadNpc(
        getCharacterFullPath(characterName),
      );
    }
    return this.defaultCharacterSpec;
  }

  async loadCharactersMap() {
    if (!this.charactersMap) {
      this.charactersMap = {};

      const loadPack = async srcUrl => {
        const res = await fetch(srcUrl);
        const j = await res.json();
        const {objects} = j;
        return objects;
      };

      const extractPackName = filename => {
        return filename.replace(/\.[^/.]+$/, '');
      };

      // list npc file names
      for (const packFilename of packs) {
        const packName = extractPackName(packFilename);
        const pack = await loadPack(getCharacterFullPath(packFilename));

        const characters = [];
        for (const characterObj of pack) {
          const characterName = characterObj.name;
          const character = await loadNpc(getCharacterFullPath(characterName));
          characters.push(character);
        }
        this.charactersMap[packName] = characters;
      }
    }
    return this.charactersMap;
  }
}

const characterSelectManager = new CharacterSelectManager();
export {characterSelectManager};
