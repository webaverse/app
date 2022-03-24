class SettingsManager extends EventTarget {
  constructor() {
    super();

    this.addEventListener('gfxSettingsChanged', e => {
      const settings = e.data;
      this.#setSettings('GfxSettings', settings);
    });

    this.addEventListener('controlSettingsChanged', e => {
      const settings = e.data;
      this.#setSettings('ControlsSettings', settings);
    });

    this.addEventListener('aiSettingsChanged', e => {
      const settings = e.data;
      this.#setSettings('AiSettings', settings);
    });


  }

  getSettings(key) {
    return localStorage.getItem(key);
  }

  getSettingsJson(key) {
    return JSON.parse(localStorage.getItem(key));
  }

  #setSettings(key, settings) {
    localStorage.setItem(key, JSON.stringify(settings));
  }
}

const settingsManager = new SettingsManager();
export default settingsManager;
