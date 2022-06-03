import offscreenEngineManager from './offscreen-engine-manager.js';

const _generateObjectUrlCardRemote = (() => {
  let generateObjectUrlCardRemoteFn = null;
  return async function() {
      if (!generateObjectUrlCardRemoteFn) {
          generateObjectUrlCardRemoteFn = offscreenEngineManager.createFunction([
              `\
              import {generateObjectUrlCard} from './card-renderer.js';
              `,
              async function(o) {
                  const imageBitmap = await generateObjectUrlCard(o);
                  return imageBitmap;
              }
          ]);
      }
      const result = await generateObjectUrlCardRemoteFn.apply(this, arguments);
      return result;
  };
})();

class CardsManager {
  async getCardsImage(start_url, {width, flipY, signal} = {}) {
    const imageBitmap = await _generateObjectUrlCardRemote([
      {
          start_url,
          width,
          flipY,
      }
    ], {
      signal,
    });
    return imageBitmap;
  }
}
const cardsManager = new CardsManager();
export default cardsManager;