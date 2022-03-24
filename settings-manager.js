class SettingsManager extends EventTarget {
  constructor() {
    super();

    this.addEventListener('gfxSettingsChanged', e => {
      const settings = e.data;
      this.#setSettings('GfxSettings', settings);
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
