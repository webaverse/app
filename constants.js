export const baseUnit = 4;
export const previewExt = 'jpg';
export const maxGrabDistance = 1.5;
export const defaultRendererUrl = 'https://render.exokit.org/'

export const transparentPngUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const rarityColors = {
  common: [0xDCDCDC, 0x373737],
  uncommon: [0xff8400, 0x875806],
  rare: [0x00CE21, 0x00560E],
  epic: [0x00B3DB, 0x003743],
  legendary: [0xAD00EA, 0x32002D],
};

const chainName = (() => {
  if (typeof window !== 'undefined' && /^test\./.test(location.hostname)) {
    return 'testnet';
  } else if (typeof window !== 'undefined' && /^polygon\./.test(location.hostname)) {
    return 'polygon';
  } else {
    return 'mainnet';
  }
})();
const otherChainName = /sidechain/.test(chainName) ?
  chainName.replace(/sidechain/, '')
:
  chainName + 'sidechain';
export {
  chainName,
  otherChainName,
};
export const polygonVigilKey = `0937c004ab133135c86586b55ca212a6c9ecd224`;

const origin = window.location.protocol + '//' + window.location.hostname;

export const storageHost = 'https://ipfs.webaverse.com';
export const previewHost = 'https://preview.exokit.org';
export const inappPreviewHost = origin === 'https://local.webaverse.com' ?
  'https://local.webaverse.online'
:
  'https://app.webaverse.online';
export const worldsHost = 'https://worlds.exokit.org';
export const accountsHost = `https://${chainName}sidechain-accounts.webaverse.com`;
export const contractsHost = 'https://contracts.webaverse.com';
export const localstorageHost = 'https://localstorage.webaverse.com';
export const loginEndpoint = 'https://login.webaverse.com';
export const tokensHost = `https://${chainName}all-tokens.webaverse.com`;
export const landHost = `https://${chainName}sidechain-land.webaverse.com`;
export const codeAiHost = `https://ai.webaverse.com/code`;
export const web3MainnetSidechainEndpoint = 'https://mainnetsidechain.exokit.org';
export const web3TestnetSidechainEndpoint = 'https://testnetsidechain.exokit.org';
export const worldUrl = 'worlds.webaverse.com';
export const discordClientId = '684141574808272937';
export const walletHost = 'https://wallet.webaverse.com';

export const worldMapName = 'world';
export const actionsMapName = 'actions';
export const avatarMapName = 'avatar';
export const playersMapName = 'players';
export const appsMapName = 'apps';

export const ceramicNodeUrl = `https://ceramic-clay.3boxlabs.com`;
export const metaverseProfileDefinition = `kjzl6cwe1jw145wm7u2sy1wpa33hglvmuy6th9lys7x4iadaizn4zqgpp3tmu34`;

export const audioTimeoutTime = 10 * 1000;

export const crouchMaxTime = 200;
export const activateMaxTime = 750;
export const useMaxTime = 750;
export const aimMaxTime = 1000;
export const throwReleaseTime = 750;
export const minFov = 60;
export const maxFov = 120;
export const midFov = 90;
export const initialPosY = 1.5;
export const groundFriction = 0.28;
export const airFriction = groundFriction;
export const flyFriction = 0.5;

export const avatarInterpolationFrameRate = 60;
export const avatarInterpolationTimeDelay = 1000/(avatarInterpolationFrameRate * 0.5);
export const avatarInterpolationNumFrames = 4;

export const eatFrameIndices = [500, 800, 1100];
export const drinkFrameIndices = [400, 700, 1000];

export const voicePacksUrl = `https://webaverse.github.io/voicepacks/all_packs.json`;

export const voiceEndpoint = `https://voice.webaverse.com/tts`;
export const voiceEndpointsUrl = `https://raw.githubusercontent.com/webaverse/tiktalknet/main/model_lists/all_models.json`;

export const chatTextSpeed = 15;
export const shakeAnimationSpeed = 30;

export const hotbarSize = 60;
export const infoboxSize = 100;

export const numLoadoutSlots = 8;

export const defaultDioramaSize = 512;

export const defaultAvatarUrl = './avatars/scillia_drophunter_v15_vian.vrm';
// export const defaultAvatarUrl = './avatars/scillia_drophunter_v25_gloria_vian.vrm';
// export const defaultAvatarUrl = './avatars/ann.vrm';
