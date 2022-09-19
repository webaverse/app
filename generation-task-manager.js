// errors

const abortError = new Error('aborted');
abortError.isAbortError = true;

// events

const geometryaddEvent = new MessageEvent('geometryadd', {
  data: {
    geometry: null,
  },
});
const geometryremoveEvent = new MessageEvent('geometryremove', {
  data: {
    geometry: null,
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

    geometryaddEvent.data.geometry = result;
    this.dispatchEvent(geometryaddEvent);
  }
  cancel() {
    this.abortController.abort(abortError);

    if (this.result) {
      geometryremoveEvent.data.geometry = this.result;
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