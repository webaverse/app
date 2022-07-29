import {makePromise} from './util.js';

class ResourceManager {
  constructor() {
    this.loadPromise = makePromise();

    this.pendingLoads = 0;
    this.postLoads = [];
  }
  add(promise) {
    (async () => {
      try {
        await promise;
      } catch(err) {
        console.warn('resource load error', err);
        // debugger;
        this.loadPromise.reject(err);
      }
      
      if (--this.pendingLoads === 0) {
        this.loadPromise.accept();
        for (const fn of this.postLoads) {
          fn();
        }

        this.loadPromise = makePromise();
        this.postLoads.length = 0;
      }
    })();
    this.pendingLoads++;
  }
  addAll(promises) {
    for (const promise of promises) {
      this.add(promise);
    }
  }
  addPost(promise) {
    this.postLoads.push(promise);
  }
  addPostAll(promises) {
    for (const promise of promises) {
      this.addPost(promise);
    }
  }
  waitForLoad() {
    return this.loadPromise;
  }
}
const resourceManager = new ResourceManager();
export default resourceManager;