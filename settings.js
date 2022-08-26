

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

function getCharacterQuality() {
  const settings = getSettings();

  const characterDetails = settings.character.details;

  let avatarStyle = 4;
  if ( characterDetails === 'HIGH' ) avatarStyle = 3;
  if ( characterDetails === 'MEDIUM' ) avatarStyle = 2;
  if ( characterDetails === 'LOW' ) avatarStyle = 1;

  return avatarStyle;
}

export {
  getSettings,
  getCharacterQuality,
};
