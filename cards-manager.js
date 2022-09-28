import offscreenEngineManager from './offscreen-engine/offscreen-engine-manager.js';

const _generateObjectUrlCardRemote = (() => {
  return async function (args, options) {
    const result = await offscreenEngineManager.request(
      'generateObjectUrlCardRemote',
      args,
      options,
    );
    return result;
  };
})();

class CardsManager {
  async getCardsImage(start_url, {width, flipY, signal} = {}) {
    const imageBitmap = await _generateObjectUrlCardRemote(
      [
        {
          start_url,
          width,
          flipY,
        },
      ],
      {
        signal,
      },
    );
    return imageBitmap;
  }
}
const cardsManager = new CardsManager();
export default cardsManager;
