import {abortError} from './lock-manager.js';

// events

const geometryaddEvent = new MessageEvent('geometryadd', {
  data: {
    result: null,
  },
});
const geometryremoveEvent = new MessageEvent('geometryremove', {
  data: {
    result: null,
  },
});

// main

export class Generation extends EventTarget {
  constructor(key) {
    super();

    this.key = key;
    this.abortController = new AbortController();

    this.result = null;
  }
  finish(result) {
    this.result = result;

    geometryaddEvent.data.result = result;
    this.dispatchEvent(geometryaddEvent);
  }
  cancel() {
    this.abortController.abort(abortError);

    if (this.result) {
      geometryremoveEvent.data.result = this.result;
      this.dispatchEvent(geometryremoveEvent);
    }
  }
  getSignal() {
    return this.abortController.signal;
  }
}

export class GenerationTaskManager {
  constructor() {
    this.generations = new Map();
  }
  createGeneration(key) {
    const generation = new Generation(key);
    this.generations.set(key, generation);
    return generation;
  }
  deleteGeneration(key) {
    const generation = this.generations.get(key);
    generation.cancel();
    this.generations.delete(key);
  }
  getSignal() {
    return this.abortController.signal;
  }
}