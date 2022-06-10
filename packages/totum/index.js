class Metaversefile extends EventTarget {
  constructor() {
    super();
  }
  setApi(o) {
    for (const k in o) {
      Object.defineProperty(this, k, {
        value: o[k],
      });
    }
    Object.freeze(this);
  }
}
const metaversefile = new Metaversefile();

export default metaversefile;
