/**Settings Manager
 * Save and get user settings
 * Currently supports:
 * GfxSettings
 * ControlsSettings
 * AiSettings
 * AudioSettings
 */
class SettingsManager extends EventTarget {
  /**Creates a settings manager which will respond to events */
  constructor() {
    super();

    this.addEventListener('settingschanged', e => {
      const {settings, category} = e.data;
      
      this.#setSettings(category, settings);
    });

  }

  /**
   * Get the settings for a specified category as a string
   * @param {string} key - the string name for the settings category you're requesting
   * @returns {string} the settings string from local storage
   */
  getSettings(key) {
    return localStorage.getItem(key);
  }

  /**
   * Get the settings for a specified category as a JSON object
   * @param {string} key - the string name for the settings category you're requesting
   * @returns {object} the settings JSON object parsed from local storage
   */
  getSettingsJson(key) {
    return JSON.parse(localStorage.getItem(key));
  }

  /**
   * save settings to local storage
   * @param {string} key the string name for the settings category you're setting
   * @param {object} settings the JSON object with the values you wish to set
   */
  #setSettings(key, settings) {
    localStorage.setItem(key, JSON.stringify(settings));
  }
}

const settingsManager = new SettingsManager();
export default settingsManager;
