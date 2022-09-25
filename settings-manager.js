import {minAvatarQuality, maxAvatarQuality} from './constants.js';
import localStorageManager from './localStorage-manager.js';
const DefaultSettings = {
  resolution:         'HIGH',
  antialias:          'NONE',
  viewRange:          'HIGH',
  shadowQuality:      'HIGH',
  postprocessing: {
    enabled:        'ON',
    depthOfField:   'ON',
    hdr:            'ON',
    bloom:          'ON'
  },
  character: {
    details:        'HIGH',
    hairPhysics:    'ON'
  }
};

class SettingsManager extends EventTarget {
  constructor() {
    super();
  }

  getSettings() {
    const settingsString = localStorageManager.getItem( 'GfxSettings' );
    let settings;

    try {
        settings = JSON.parse( settingsString );
    } catch ( err ) {
        settings = DefaultSettings;
    }

    settings = settings ?? DefaultSettings;

    return settings;
  }

  adjustCharacterQuality(delta) {
    const settings = this.getSettings();
    const quality = this.convertCharacterQualityToValue(settings.character.details);
    const newQuality = Math.min(Math.max(quality + delta, minAvatarQuality), maxAvatarQuality);
    if (newQuality !== quality) {
      settings.character.details = this.convertCharacterQualityToSetting(newQuality);
      this.saveSettings(settings);
    }
    return newQuality;
  }

  convertCharacterQualityToSetting(quality) {
    if (quality === 3) {
      return 'HIGH';
    } else if (quality === 2) {
      return 'MEDIUM';
    } else if (quality === 1) {
      return 'LOW';
    } else {
      return 'ULTRA';
    }
  }

  convertCharacterQualityToValue(characterDetails) {
    let avatarStyle = 4;
    if (characterDetails === 'HIGH') {
      avatarStyle = 3;
    } else if (characterDetails === 'MEDIUM') {
      avatarStyle = 2;
    } else if (characterDetails === 'LOW') {
      avatarStyle = 1;
    }
    return avatarStyle;
  }

  getCharacterQuality() {
    const settings = this.getSettings();

    return this.convertCharacterQualityToValue(settings.character.details);
  }

  saveSettings(settings) {
    localStorageManager.setItem( 'GfxSettings', JSON.stringify( settings ) );
    this.dispatchEvent(new MessageEvent('change', {
      data: {
        settings: settings
      }
    }));
  }
}

const settingsManager = new SettingsManager();
export default settingsManager;