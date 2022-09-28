class Override extends EventTarget {
  constructor(value) {
    super();
    this.value = value;
  }

  get() {
    return this.value;
  }

  set(value) {
    if (value !== this.value) {
      this.value = value;
      this.dispatchEvent(
        new MessageEvent('change', {
          data: {
            value,
          },
        }),
      );
    }
  }
}
const overrides = {
  overrideVoicePack: new Override(null),
  overrideVoiceEndpoint: new Override(null),
  userVoicePack: new Override(null),
  userVoiceEndpoint: new Override(null),
};
export default overrides;
