export const PARCEL_SIZE = 300;
export const SUBPARCEL_SIZE = 10;
export const SUBPARCEL_SIZE_P1 = SUBPARCEL_SIZE + 1;
export const SUBPARCEL_SIZE_P3 = SUBPARCEL_SIZE + 3;
export const NUM_PARCELS = PARCEL_SIZE / SUBPARCEL_SIZE;

export const chunkDistance = 3;
export const baseHeight = PARCEL_SIZE / 2 - 10;

export const numSlices = (1 + chunkDistance * 2 + 1) ** 3;
export const slabRadius = Math.sqrt((SUBPARCEL_SIZE / 2) * (SUBPARCEL_SIZE / 2) * 3);

export const thingTextureSize = 4096;
export const objectTextureSize = 512;

export const BUILD_SNAP = 2;

export const MAX_NAME_LENGTH = 32;
export const PLANET_OBJECT_SLOTS = 512;
export const PLANET_OBJECT_SIZE = (
  Uint32Array.BYTES_PER_ELEMENT + // id
  Uint32Array.BYTES_PER_ELEMENT + // type
  MAX_NAME_LENGTH * Uint8Array.BYTES_PER_ELEMENT + // build.name
  Float32Array.BYTES_PER_ELEMENT * 3 + // build.position
  Float32Array.BYTES_PER_ELEMENT * 4 // build.quaternion
);


// const localUrl = "localhost%3A8080%2Fdiscord";
// const siteUrl = "app.webaverse.com"

// export const discordOauthUrl = `https://discord.com/api/oauth2/authorize?client_id=684141574808272937&redirect_uri=https%3A%2F%2F${location.href.indexOf("localhost") !== -1 ? localUrl : siteUrl}%2Fdiscord&response_type=code&scope=identify`;


export const discordOauthUrl = `https://discord.com/api/oauth2/authorize?client_id=684141574808272937&redirect_uri=https%3A%2F%2Fapp.webaverse.com%2Fdiscordlogin.html&response_type=code&scope=identify`;

export const colors = [
  'ef5350',
  'ec407a',
  'ab47bc',
  '7e57c2',
  '5c6bc0',
  '42a5f5',
  '29b6f6',
  '26c6da',
  '26a69a',
  '66bb6a',
  '9ccc65',
  'd4e157',
  'ffee58',
  'ffca28',
  'ffa726',
  'ff7043',
  '8d6e63',
  'bdbdbd',
  '78909c',
  '333333',
];
export const previewExt = 'jpg';

export const storageHost = 'https://storage.exokit.org';
export const previewHost = 'https://preview.exokit.org'
export const worldsHost = 'https://worlds.exokit.org';
export const accountsHost = 'https://accounts.exokit.org';
export const contractsHost = 'https://contracts.webaverse.com';
export const presenceHost = 'worlds.webaverse.com';
export const localstorageHost = 'https://localstorage.webaverse.com';
export const loginEndpoint = 'https://login.exokit.org';
export const web3SidechainEndpoint = 'https://ethereums.exokit.org';