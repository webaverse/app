import {makePromise} from './util.js';

class ResourceManager {
  constructor() {
    this.loadPromise = makePromise();
  }
  waitForLoad() {

  }
}
const resourceManager = new ResourceManager();
export default resourceManager;