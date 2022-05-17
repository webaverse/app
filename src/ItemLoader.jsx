export class ItemLoader extends EventTarget { 
  constructor({
      loadFn,
  }) {
      super();

      this.loadFn = loadFn;
      this.loading = false;
      this.cache = new Map();
      this.promiseCache = new Map();
  }
  async loadItem(url, value, {signal = null} = {}) {
      {
          this.loading = true;
          this.dispatchEvent(new MessageEvent('loadingchange', {
              data: {
                  loading: this.loading,
              },
          }));
      }

      let promise = this.promiseCache.get(url);
      if (!promise) {
          promise = this.loadFn(url, value, {signal})
              .catch(err => {
                  // console.warn(err);
                  return null;
              })
              .then(result => {
                  signal.removeEventListener('abort', abort);
                  return result;
              });
          this.promiseCache.set(url, promise);
          const abort = () => {
              this.promiseCache.delete(url);
          };
          signal.addEventListener('abort', abort);
      }

      const result = await promise;
      {
          this.loading = false;
          this.dispatchEvent(new MessageEvent('loadingchange', {
              data: {
                  loading: this.loading,
              },
          }));
      }
      return result;
  }
  destroy() {
      for (const url of this.promiseCache.keys()) {
          URL.revokeObjectURL(url);
      }
  }
}