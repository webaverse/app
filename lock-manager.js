// import {makePromise} from './util.js';

export const abortError = new Error('aborted');
abortError.isAbortError = true;

/* const unlockedEvent = new MessageEvent('unlocked');

export class Lock extends EventTarget {
  constructor() {
    super();

    this.running = false;
    this.queue = [];
  }
  async lock({signal} = {}) {
    if (this.running) {
      const p = makePromise();
      this.queue.push(p);
      
      const abort = () => {
        p.reject(abortError);
      };
      signal && signal.addEventListener('abort', abort);
      
      try {
        await p;
      } finally {
        signal && signal.removeEventListener('abort', abort);
      }
    } else {
      this.running = true;
    }
  }
  unlock() {
    this.running = false;
    const entry = this.queue.shift();
    if (entry) {
      entry.accept();
    } else {
      this.dispatchEvent(unlockedEvent);
    }
  }
}

export class LockManager {
  constructor() {
    this.locks = new Map();
  }
  async request(key, {signal} = {}, fn) {
    let lock = this.locks.get(key);
    if (!lock) {
      lock = new Lock();
      this.locks.set(key, lock);
      lock.addEventListener('unlocked', () => {
        this.locks.delete(key);
      });
    }
    await lock.lock({
      signal,
    });

    let result, error;
    try {
      result = fn !== undefined ? (await fn(lock)) : fn;
    } catch (err) {
      error = err;
    } finally {
      await Promise.resolve(); // return before unlocking
      lock.unlock();
    }

    if (!error) {
      return result;
    } else {
      throw error;
    }
  }
} */