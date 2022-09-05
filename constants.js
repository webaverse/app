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

const PEEK_FACE_INDICES = [];
(function initPeekFaceIndices(){
   for (let i = 0; i < 8 * 8; i++)
    {
      PEEK_FACE_INDICES[i] = 0xFF;
    }

    let peekIndex = 0;
    for (let startFace = 0; startFace < 6; startFace++)
    {
      for (let endFace = 0; endFace < 6; endFace++)
      {
        if (startFace != endFace)
        {
          const otherEntry = PEEK_FACE_INDICES[endFace << 3 | startFace];
          PEEK_FACE_INDICES[startFace << 3 | endFace] = otherEntry != 0xFF ? otherEntry : peekIndex++;
        }
      }
    }
    // console.log("INVOKED");
})();

export {PEEK_FACE_INDICES};

const chainName = (() => {
  if (typeof globalThis !== 'undefined' && /^test\./.test(location.hostname)) {
    return 'testnet';
  } else if (typeof globalThis !== 'undefined' && /^polygon\./.test(location.hostname)) {
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

//

const origin = globalThis.location.protocol + '//' + globalThis.location.hostname;

let _inappPreviewHost = '';

switch ( origin ) {
    case 'https://local.webaverse.com': {
        _inappPreviewHost = `https://local.webaverse.online:${globalThis.location.port}`;
        break;
    }
    case 'https://dev.webaverse.com': {
        _inappPreviewHost = 'https://dev.webaverse.online';
        break;
    }
    case 'https://staging.webaverse.com': {
        _inappPreviewHost = 'https://staging.webaverse.online';
        break;
    }
    default: {
        _inappPreviewHost = 'https://app.webaverse.online';
    }
}

export const inappPreviewHost = _inappPreviewHost;

//

export const storageHost = 'https://ipfs.webaverse.com';
export const previewHost = 'https://preview.exokit.org';
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
export const playersMapName = 'players';
export const appsMapName = 'apps';

export const ceramicNodeUrl = `https://ceramic-clay.3boxlabs.com`;
export const metaverseProfileDefinition = `kjzl6cwe1jw145wm7u2sy1wpa33hglvmuy6th9lys7x4iadaizn4zqgpp3tmu34`;

export const audioTimeoutTime = 10 * 1000;

export const crouchMaxTime = 200;
export const activateMaxTime = 750;
export const useMaxTime = 750;
export const aimMaxTime = 1000;
export const throwReleaseTime = 220;
export const throwAnimationDuration = 1.4166666269302368;
export const minFov = 60;
export const maxFov = 120;
export const midFov = 90;
export const initialPosY = 1.5;
export const groundFriction = 0.28;
export const airFriction = groundFriction;
export const flyFriction = 0.5;
export const swimFriction = 0.2;
export const aimTransitionMaxTime = 150;

export const jumpHeight = 3;
export const flatGroundJumpAirTime = 666;

export const avatarInterpolationFrameRate = 60;
export const avatarInterpolationTimeDelay = 1000/(avatarInterpolationFrameRate * 0.5);
export const avatarInterpolationNumFrames = 4;

export const eatFrameIndices = [500, 800, 1100];
export const drinkFrameIndices = [400, 700, 1000];

export const defaultMaxId = 8192;

export const defaultMusicVolume = 0.35;

export const voicePacksUrl = `https://webaverse.github.io/voicepacks/all_packs.json`;

export const voiceEndpointBaseUrl = `https://voice.webaverse.com/tts`;
export const voiceEndpointsUrl = `https://raw.githubusercontent.com/webaverse/tiktalknet/main/model_lists/all_models.json`;

export const chatTextSpeed = 15;
export const shakeAnimationSpeed = 30;

export const hotbarSize = 60;
export const infoboxSize = 100;

export const startTextureAtlasSize = 512;
export const maxTextureAtlasSize = 4096;

export const numLoadoutSlots = 8;

export const defaultDioramaSize = 512;
export const defaultChunkSize = 16;
export const defaultWorldSeed = 100;

export const defaultVoiceEndpoint = `Sweetie Belle`;
export const defaultVoicePackName = `ShiShi voice pack`;

// export const defaultAvatarUrl = './avatars/ann_liskwitch_v3.1_guiltyallShapeKeys.vrm';
// export const defaultAvatarUrl = './avatars/ann.vrm';
export const defaultPlayerSpec = {
  name: 'Scillia',
  previewUrl: './images/characters/upstreet/small/scillia.png',
  avatarUrl: './avatars/meebit.vrm',
  voice: defaultVoiceEndpoint,
  voicePack: defaultVoicePackName,
  class: 'Drop Hunter',
  bio: `Her nickname is Scilly or SLY. 13/F drop hunter. She is an adventurer, swordfighter and fan of potions. She is exceptionally skilled and can go Super Saiyan.`,
  themeSongUrl: `https://webaverse.github.io/music/themes/149274046-smooth-adventure-quest.mp3`,
};