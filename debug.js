class Debug extends EventTarget {
  constructor() {
    super();
    this.enabled = false;
  }

  toggle(enabled) {
    if (enabled === undefined) {
      enabled = !this.enabled;
    }
    this.enabled = enabled;
    this.dispatchEvent(
      new MessageEvent('enabledchange', {
        data: {
          enabled,
        },
      }),
    );
  }
}
const debug = new Debug();
export default debug;
