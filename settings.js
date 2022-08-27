import {minAvatarQuality, maxAvatarQuality} from './constants.js';
import settingsManager from './settings-manager.js';

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

function getSettings() {
  const settingsString = localStorage.getItem( 'GfxSettings' );
  let settings;

  try {
      settings = JSON.parse( settingsString );
  } catch ( err ) {
      settings = DefaultSettings;
  }

  settings = settings ?? DefaultSettings;

  return settings;
}

function adjustCharacterQuality(delta) {
  const settings = getSettings();
  const quality = convertCharacterQualityToValue(settings.character.details);
  const newQuality = Math.min(Math.max(quality + delta, minAvatarQuality), maxAvatarQuality);
  if (newQuality !== quality) {
    settings.character.details = convertCharacterQualityToSetting(newQuality);
    saveSettings(settings);
  }
  return newQuality;
}

function convertCharacterQualityToSetting(quality) {
  if ( quality === 3 ) return 'HIGH';
  if ( quality === 2 ) return 'MEDIUM';
  if ( quality === 1 ) return 'LOW';
  return 'ULTRA';
};

function convertCharacterQualityToValue(characterDetails) {
  let avatarStyle = 4;
  if ( characterDetails === 'HIGH' ) avatarStyle = 3;
  if ( characterDetails === 'MEDIUM' ) avatarStyle = 2;
  if ( characterDetails === 'LOW' ) avatarStyle = 1;

  return avatarStyle;
}

function getCharacterQuality() {
  const settings = getSettings();

  return convertCharacterQualityToValue(settings.character.details);
}

function saveSettings(settings) {
  localStorage.setItem( 'GfxSettings', JSON.stringify( settings ) );
  settingsManager.dispatchEvent(new MessageEvent('change', {
    data: {
      settings: settings
    }
  }));
}

export {
  getSettings,
  getCharacterQuality,
  adjustCharacterQuality,
  saveSettings,
};
