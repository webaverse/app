class SettingsManager extends EventTarget {
  constructor() {
    super();

    this.addEventListener('gfxSettingsChanged', e => {
      const settings = e.data;
      this.#setGfxSettings(settings);
    });
  }

  getGfxSettings() {
    return localStorage.getItem('GfxSettings');
  }

  getGfxSettingsJson() {
    return JSON.parse(localStorage.getItem('GfxSettings'));
  }

  #setGfxSettings(settings) {
    localStorage.setItem('GfxSettings', JSON.stringify(settings));
  }
}

const settingsManager = new SettingsManager();
export default settingsManager;
