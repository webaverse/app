/*
this file bootstraps the webaverse engine.
it uses the help of various managers and stores, and executes the render loop.
*/

import * as THREE from 'three';
import WSRTC from 'wsrtc/wsrtc.js';
import Avatar from './avatars/avatars.js';
// import * as CharacterHupsModule from './character-hups.js';
import * as CharacterSfxModule from './character-sfx.js';
import physx from './physx.js';
import ioManager from './io-manager.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import * as blockchain from './blockchain.js';
import cameraManager from './camera-manager.js';
import game from './game.js';
import hpManager from './hp-manager.js';
// import equipmentRender from './equipment-render.js';
// import * as characterController from './character-controller.js';
import {playersManager} from './players-manager.js';
import postProcessing from './post-processing.js';
import {Stats} from './stats.js';
import {loadAudioBuffer} from './util.js';
import {
  getRenderer,
  scene,
  sceneHighPriority,
  sceneLowPriority,
  rootScene,
  camera,
  dolly,
  bindCanvas,
  getComposer,
} from './renderer.js';
import transformControls from './transform-controls.js';
import * as metaverseModules from './metaverse-modules.js';
import dioramaManager from './diorama.js';
import metaversefileApi from 'metaversefile';
import WebaWallet from './src/components/wallet.js';
// const leftHandOffset = new THREE.Vector3(0.2, -0.2, -0.4);
// const rightHandOffset = new THREE.Vector3(-0.2, -0.2, -0.4);

const localPlayer = metaversefileApi.useLocalPlayer();
window.isStart = false;
window.isRising = false;
window.isRising2 = false;
window.isGeneratedVoxelMap = false;
const width = 71;
const height = 71;
// const width = 35;
// const height = 35;

const tmpVec2 = new THREE.Vector2();

// window.start = new THREE.Vector2(-7, -5)
// window.dest = new THREE.Vector2(4, 6)
// window.start = new THREE.Vector2(-12, -14)
// window.dest = new THREE.Vector2(-6, -27)
// window.start = new THREE.Vector2(24, -5)
// window.dest = new THREE.Vector2(24, 24)
window.start = new THREE.Vector2(0, 3);
window.dest = new THREE.Vector2(13, 3);
// swapStartDest();

window.frontiers = [];
window.blocks = new THREE.Group();
window.blocks.name = 'blocks';
rootScene.add(window.blocks);
window.blocks2 = new THREE.Group();
rootScene.add(window.blocks2);
window.blocks2.name = 'blocks2';

const materialIdle = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(221,213,213)')});
const materialAct = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(204,191,179)')});
const materialFrontier = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(92,133,214)')});
const materialStart = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(191,64,64)')});
const materialDest = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(191,64,170)')});
const materialPath = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(149,64,191)')});
const materialObstacle = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(134,134,121)')});

const vs = {};
vs.xy_to_serial = function(width, xy) { // :index
  return xy.y * width + xy.x;
};

window.resetStartDest = resetStartDest;
function resetStartDest(startLayer, startX, startZ, destLayer, destX, destZ) {
  window.isFound = false;
  window.frontiers.length = 0;

  window.blocks.children.forEach(block => {
    block._isStart = false;
    block._isDest = false;
    block._isAct = false;
    block._priority = 0;
    block._costSoFar = 0;
    block._prev = null;
    block._next = null;
    if (block.material !== materialObstacle) block.material = materialIdle;
  });

  window.blocks2.children.forEach(block => {
    block._isStart = false;
    block._isDest = false;
    block._isAct = false;
    block._priority = 0;
    block._costSoFar = 0;
    block._prev = null;
    block._next = null;
    if (block.material !== materialObstacle) block.material = materialIdle;
  });

  window.start.set(startX, startZ);
  window.dest.set(destX, destZ);

  if (startLayer === 1) {
    window.startBlock = getBlock(startX, startZ);
  } else if (startLayer === 2) {
    window.startBlock = getBlock2(startX, startZ);
  }
  window.startBlock._isStart = true;
  window.startBlock._isAct = true;
  // window.startBlock._priority = start.manhattanDistanceTo(dest)
  window.startBlock._priority = window.start.distanceTo(window.dest);
  window.startBlock._costSoFar = 0;
  window.frontiers.push(window.startBlock);
  window.startBlock.material = materialStart;

  if (destLayer === 1) {
    window.destBlock = getBlock(destX, destZ);
  } else if (destLayer === 2) {
    window.destBlock = getBlock2(destX, destZ);
  }
  window.destBlock._isDest = true;
  window.destBlock.material = materialDest;
}

window.rise = rise;
function rise() {
  window.isRising = true;
}

window.riseAgain = riseAgain;
function riseAgain() {
  window.blocks.children.forEach(block => {
    block._risingState = 'initial';
  });
}

window.rise2 = rise2;
function rise2() {
  // NOTE: Need rise to higher than heightCanGoThrough2.
  window.isRising = false;

  window.blocks2.children.forEach((block, i) => {
    block.position.y = window.blocks.children[i].position.y;
  });

  window.isRising2 = true;
}

window.setStart = setStart;
function setStart(x, z) {
}

window.getblock = getBlock;
function getBlock(x, y) {
  x += (width - 1) / 2;
  y += (height - 1) / 2;
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  return window.blocks.children[vs.xy_to_serial(width, {x, y})];
}

window.getblock2 = getBlock2;
function getBlock2(x, y) {
  x += (width - 1) / 2;
  y += (height - 1) / 2;
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  return window.blocks2.children[vs.xy_to_serial(width, {x, y})];
}

function swapStartDest() {
  tmpVec2.copy(window.start);
  window.start.copy(window.dest);
  window.dest.copy(tmpVec2);
}

function stepBlock(block, prevBlock) {
  function recur(block) {
    if (block) {
      if (!block._isStart && !block._isDest) block.material = materialPath;
      if (block._prev) block._prev._next = block;
      recur(block._prev);
    }
  }
  if (!block) return;
  if (block._isObstacle) return;
  const newCost = prevBlock._costSoFar + 1;
  // if (block._isAct === false || newCost < block._costSoFar) {
  if (block._isAct === false) { // Seems no need `|| newCost < block._costSoFar` ? Need? http://disq.us/p/2mgpazs
    block._isAct = true;
    block._costSoFar = newCost;

    // todo: use Vector2 instead of _x _z.
    // block._priority = tmpVec2.set(block._x, block._z).manhattanDistanceTo(dest)
    // block._priority = tmpVec2.set(block._x, block._z).distanceToSquared(dest)
    block._priority = tmpVec2.set(block._x, block._z).distanceTo(window.dest);
    block._priority += newCost;
    window.frontiers.push(block);
    window.frontiers.sort((a, b) => a._priority - b._priority);

    if (!block._isStart && !block._isDest) block.material = materialFrontier;
    block._prev = prevBlock;
  }
  if (block._isDest) {
    console.log('found');
    window.isFound = true;
    recur(block);
  }
}

window.step = step;
function step() {
  console.log('step');
  // debugger
  if (!window.isGeneratedVoxelMap) {
    console.warn('voxel map not generated.');
    return;
  }
  if (window.frontiers.length <= 0) {
    console.log('finish');
    return;
  }
  if (window.isFound) return;

  const currentBlock = window.frontiers.shift();
  if (!currentBlock._isStart) currentBlock.material = materialAct;

  if (currentBlock._leftBlock) {
    stepBlock(currentBlock._leftBlock, currentBlock);
    if (window.isFound) return;
  }

  if (currentBlock._rightBlock) {
    stepBlock(currentBlock._rightBlock, currentBlock);
    if (window.isFound) return;
  }

  if (currentBlock._btmBlock) {
    stepBlock(currentBlock._btmBlock, currentBlock);
    if (window.isFound) return;
  }

  if (currentBlock._topBlock) {
    stepBlock(currentBlock._topBlock, currentBlock);
    // if (window.isFound) return
  }
}
window.tenStep = tenStep;
function tenStep() {
  if (!window.isGeneratedVoxelMap) {
    console.warn('voxel map not generated.');
    return;
  }
  for (let i = 0; i < 10; i++) step();
}
window.untilFound = untilFound;
function untilFound() {
  if (!window.isGeneratedVoxelMap) {
    console.warn('voxel map not generated.');
    return;
  }
  while (window.frontiers.length > 0 && !window.isFound) step();
}
window.foxFollowAvatar = foxFollowAvatar;
function foxFollowAvatar() { // run after: rise(), generateVoxelMap(), and "E" activated the fox.
  const foxX = Math.round(window.fox.position.x);
  const foxZ = Math.round(window.fox.position.z);
  const localPlayerX = Math.round(localPlayer.position.x);
  const localPlayerZ = Math.round(localPlayer.position.z);

  let startLayer, destLayer;
  const startBlock = getBlock(foxX, foxZ);
  const startBlock2 = getBlock2(foxX, foxZ);
  const destBlock = getBlock(localPlayerX, localPlayerZ);
  const destBlock2 = getBlock2(localPlayerX, localPlayerZ);
  if (Math.abs(startBlock.position.y - window.fox.position.y) < Math.abs(startBlock2.position.y - window.fox.position.y)) {
    startLayer = 1;
  } else {
    startLayer = 2;
  }
  if (Math.abs(destBlock.position.y - localPlayer.position.y) < Math.abs(destBlock2.position.y - localPlayer.position.y)) {
    destLayer = 1;
  } else {
    destLayer = 2;
  }

  resetStartDest(
    startLayer,
    foxX,
    foxZ,
    destLayer,
    localPlayerX,
    localPlayerZ,
  );
  untilFound();
  window.petDestBlock = window.startBlock;
}

const heightTolerance = 0.6;
const heightCanGoThrough = 1.5;
const heightCanGoThrough2 = 30;
window.generateVoxelMap = generateVoxelMap;
function generateVoxelMap() {
  window.isRising = false;
  window.isRising2 = false;

  for (let z = -(height - 1) / 2; z < height / 2; z++) {
    for (let x = -(width - 1) / 2; x < width / 2; x++) {
      const currentBlock = getBlock(x, z);

      const leftBlock2 = getBlock2(x - 1, z);
      if (leftBlock2) {
        const biasToLayer2 = leftBlock2.position.y - currentBlock.position.y;
        if (biasToLayer2 < heightTolerance) {
          currentBlock._leftBlock = leftBlock2;
        } else if (biasToLayer2 > heightCanGoThrough) {
          const leftBlock = getBlock(x - 1, z);
          if (leftBlock && leftBlock.position.y - currentBlock.position.y < heightTolerance) {
            currentBlock._leftBlock = leftBlock;
          }
        }
      }

      const rightBlock2 = getBlock2(x + 1, z);
      if (rightBlock2) {
        const biasToLayer2 = rightBlock2.position.y - currentBlock.position.y;
        if (biasToLayer2 < heightTolerance) {
          currentBlock._rightBlock = rightBlock2;
        } else if (biasToLayer2 > heightCanGoThrough) {
          const rightBlock = getBlock(x + 1, z);
          if (rightBlock && rightBlock.position.y - currentBlock.position.y < heightTolerance) {
            currentBlock._rightBlock = rightBlock;
          }
        }
      }

      const btmBlock2 = getBlock2(x, z - 1);
      if (btmBlock2) {
        const biasToLayer2 = btmBlock2.position.y - currentBlock.position.y;
        if (biasToLayer2 < heightTolerance) {
          currentBlock._btmBlock = btmBlock2;
        } else if (biasToLayer2 > heightCanGoThrough) {
          const btmBlock = getBlock(x, z - 1);
          if (btmBlock && btmBlock.position.y - currentBlock.position.y < heightTolerance) {
            currentBlock._btmBlock = btmBlock;
          }
        }
      }

      const topBlock2 = getBlock2(x, z + 1);
      if (topBlock2) {
        const biasToLayer2 = topBlock2.position.y - currentBlock.position.y;
        if (biasToLayer2 < heightTolerance) {
          currentBlock._topBlock = topBlock2;
        } else if (biasToLayer2 > heightCanGoThrough) {
          const topBlock = getBlock(x, z + 1);
          if (topBlock && topBlock.position.y - currentBlock.position.y < heightTolerance) {
            currentBlock._topBlock = topBlock;
          }
        }
      }
    }
  }
  for (let z = -(height - 1) / 2; z < height / 2; z++) {
    for (let x = -(width - 1) / 2; x < width / 2; x++) {
      const currentBlock = getBlock2(x, z);

      const leftBlock2 = getBlock2(x - 1, z);
      if (leftBlock2) {
        const biasToLayer2 = leftBlock2.position.y - currentBlock.position.y;
        if (biasToLayer2 < heightTolerance) {
          currentBlock._leftBlock = leftBlock2;
        } else if (biasToLayer2 > heightCanGoThrough2) {
          const leftBlock = getBlock(x - 1, z);
          if (leftBlock && leftBlock.position.y - currentBlock.position.y < heightTolerance) {
            currentBlock._leftBlock = leftBlock;
          }
        }
      }

      const rightBlock2 = getBlock2(x + 1, z);
      if (rightBlock2) {
        const biasToLayer2 = rightBlock2.position.y - currentBlock.position.y;
        if (biasToLayer2 < heightTolerance) {
          currentBlock._rightBlock = rightBlock2;
        } else if (biasToLayer2 > heightCanGoThrough2) {
          const rightBlock = getBlock(x + 1, z);
          if (rightBlock && rightBlock.position.y - currentBlock.position.y < heightTolerance) {
            currentBlock._rightBlock = rightBlock;
          }
        }
      }

      const btmBlock2 = getBlock2(x, z - 1);
      if (btmBlock2) {
        const biasToLayer2 = btmBlock2.position.y - currentBlock.position.y;
        if (biasToLayer2 < heightTolerance) {
          currentBlock._btmBlock = btmBlock2;
        } else if (biasToLayer2 > heightCanGoThrough2) {
          const btmBlock = getBlock(x, z - 1);
          if (btmBlock && btmBlock.position.y - currentBlock.position.y < heightTolerance) {
            currentBlock._btmBlock = btmBlock;
          }
        }
      }

      const topBlock2 = getBlock2(x, z + 1);
      if (topBlock2) {
        const biasToLayer2 = topBlock2.position.y - currentBlock.position.y;
        if (biasToLayer2 < heightTolerance) {
          currentBlock._topBlock = topBlock2;
        } else if (biasToLayer2 > heightCanGoThrough2) {
          const topBlock = getBlock(x, z + 1);
          if (topBlock && topBlock.position.y - currentBlock.position.y < heightTolerance) {
            currentBlock._topBlock = topBlock;
          }
        }
      }
    }
  }

  // window.blocks.children.forEach((block, i) => {
  //   if (block.position.y > 3) {
  //     block._isObstacle = true
  //     block.material = materialObstacle
  //   }
  // })

  window.isGeneratedVoxelMap = true;
  console.log('generated voxel map');
}

window.domBtns.addEventListener('click', e => e.stopPropagation());

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
// const localVector4 = new THREE.Vector3();
// const localVector2D = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
// const localQuaternion2 = new THREE.Quaternion();
// const localQuaternion3 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
// const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
// const localArray = Array(4);
// const localArray2 = Array(4);
// const localArray3 = Array(4);
// const localArray4 = Array(4);

const sessionMode = 'immersive-vr';
const sessionOpts = {
  requiredFeatures: [
    'local-floor',
    // 'bounded-floor',
  ],
  optionalFeatures: [
    'hand-tracking',
  ],
};

const frameEvent = new MessageEvent('frame', {
  data: {
    now: 0,
    timeDiff: 0,
    // lastTimestamp: 0,
  },
});
const rendererStats = Stats();

const _loadAudioContext = async () => {
  const audioContext = WSRTC.getAudioContext();
  Avatar.setAudioContext(audioContext);
  await audioContext.audioWorklet.addModule('avatars/microphone-worklet.js');
};

/* const voiceFiles = `\
B6_somnium_65_01 - Part_1.wav
B6_somnium_66_01 - Part_1.wav
D5-begin20_10_09_03 - Part_1.wav
D5-begin20_10_09_03 - Part_2.wav
D5-begin20_10_09_09 - Part_1.wav
D5-begin20_10_09_10 - Part_1.wav
D5-begin20_10_09_10 - Part_2.wav
D5-begin20_10_09_10 - Part_3.wav
D5-begin20_10_09_11 - Part_1.wav
D5-begin20_10_09_14 - Part_1.wav
E5-begin40_10_04_05 - Part_1.wav
E5-begin40_10_04_06 - Part_1.wav
E5-begin40_10_04_07 - Part_1.wav
E5-begin40_10_04_07 - Part_2.wav
E5-begin40_10_04_09 - Part_1.wav
E5-begin40_10_05_01 - Part_1.wav
E5-begin40_10_06_02 - Part_1.wav
E5-begin40_10_06_05 - Part_1.wav
E5-begin40_10_06_07 - Part_1.wav
E5-begin40_10_07_24 - Part_1.wav
E5-begin40_10_08_01 - Part_1.wav
E5-begin40_10_08_01 - Part_2.wav
E5-begin40_10_08_02 - Part_1.wav
E5-begin40_10_08_03 - Part_1.wav
E5-begin40_10_08_03 - Part_2.wav
E5-begin40_10_08_04 - Part_1.wav
E5-begin40_10_08_04 - Part_2.wav
E5-begin40_10_08_05 - Part_1.wav
E5-begin40_10_08_06 - Part_1.wav
E5-begin40_10_08_07 - Part_1.wav
E5-begin40_10_08_07 - Part_2.wav
E5-begin40_10_08_10 - Part_1.wav
E5-begin40_10_08_10 - Part_2.wav
E5-begin40_10_08_10 - Part_3.wav
E5-begin40_10_08_10 - Part_4.wav
E5-begin40_10_08_12 - Part_1.wav
E5-begin40_10_08_13 - Part_1.wav
E5-begin40_10_10_02 - Part_1.wav
E5-begin40_10_12_02 - Part_1.wav
E5-begin40_10_14_11 - Part_1.wav
E5-begin40_10_14_15 - Part_1.wav
E5-begin40_10_14_15 - Part_2.wav
E6-wrap_74_10_05_02 - Part_1.wav
E6-wrap_74_10_19_03 - Part_1.wav
E6-wrap_74_10_19_21 - Part_1.wav
E6-wrap_74_10_19_29 - Part_1.wav`
  .split('\n')
  .map(voiceFile => `/@proxy/https://webaverse.github.io/shishi-voicepack/vocalizations/${voiceFile}`); */
/* const numFiles = 361;
const voiceFiles = Array(numFiles).fill(0).map((_, i) => `${i + 1}.wav`)
  .map(voiceFile => `/@proxy/https://webaverse.github.io/shishi-voicepack/syllables/${voiceFile}`); */
const _loadVoicePack = async () => {
  const audioContext = Avatar.getAudioContext();

  const [
    syllableFiles,
    audioBuffer,
  ] = await Promise.all([
    (async () => {
      const res = await fetch('https://webaverse.github.io/shishi-voicepack/syllables/syllable-files.json');
      const j = await res.json();
      return j;
    })(),
    loadAudioBuffer(audioContext, 'https://webaverse.github.io/shishi-voicepack/syllables/syllables.mp3'),
  ]);

  const localPlayer = metaversefileApi.useLocalPlayer();
  localPlayer.characterHups.setVoicePack(syllableFiles, audioBuffer);
};

export default class Webaverse extends EventTarget {
  constructor() {
    super();

    rendererStats.domElement.style.position = 'absolute';
    rendererStats.domElement.style.left = '0px';
    rendererStats.domElement.style.bottom = '0px';
    rendererStats.domElement.style.display = 'none';
    document.body.appendChild(rendererStats.domElement);

    this.loadPromise = (async () => {
      await Promise.all([
        physx.waitForLoad(),
        Avatar.waitForLoad(),
        _loadAudioContext(),
        CharacterSfxModule.waitForLoad(),
        transformControls.waitForLoad(),
        metaverseModules.waitForLoad(),
        WebaWallet.waitForLoad(),
        _loadVoicePack(),
      ]);
    })();
    this.contentLoaded = false;
  }
  
  waitForLoad() {
    return this.loadPromise;
  }

  getRenderer() {
    return getRenderer();
  }
  getScene() {
    return scene;
  }
  getSceneHighPriority() {
    return sceneHighPriority;
  }
  getSceneLowPriority() {
    return sceneLowPriority;
  }
  getCamera() {
    return camera;
  }
  
  setContentLoaded() {
    this.contentLoaded = true;
  }
  bindInput() {
    ioManager.bindInput();
  }
  bindInterface() {
    ioManager.bindInterface();
    blockchain.bindInterface();
  }
  bindCanvas(c) {
    bindCanvas(c);
    
    postProcessing.bindCanvas();
  }
  bindPreviewCanvas(canvas) {
    game.bindPreviewCanvas(canvas);
  }
  async isXrSupported() {
    if (navigator.xr) {
      let ok = false;
      try {
        ok = await navigator.xr.isSessionSupported(sessionMode);
      } catch (err) {
        console.warn(err);
      }
      return ok;
    } else {
      return false;
    }
  }
  /* toggleMic() {
    return world.toggleMic();
  } */
  async enterXr() {
    const renderer = getRenderer();
    const session = renderer.xr.getSession();
    if (session === null) {
      let session = null;
      try {
        session = await navigator.xr.requestSession(sessionMode, sessionOpts);
      } catch(err) {
        try {
          session = await navigator.xr.requestSession(sessionMode);
        } catch(err) {
          console.warn(err);
        }
      }
      if (session) {
        function onSessionEnded(e) {
          session.removeEventListener('end', onSessionEnded);
          renderer.xr.setSession(null);
        }
        session.addEventListener('end', onSessionEnded);
        renderer.xr.setSession(session);
        // renderer.xr.setReferenceSpaceType('local-floor');
      }
    } else {
      await session.end();
    }
  }
  
  /* injectRigInput() {
    let leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled;
    let rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled;

    const localPlayer = metaversefileApi.useLocalPlayer();
    const renderer = getRenderer();
    const session = renderer.xr.getSession();
    if (session) {
      let inputSources = Array.from(session.inputSources);
      inputSources = ['right', 'left']
        .map(handedness => inputSources.find(inputSource => inputSource.handedness === handedness));
      let pose;
      if (inputSources[0] && (pose = frame.getPose(inputSources[0].gripSpace, renderer.xr.getReferenceSpace()))) {
        localMatrix.fromArray(pose.transform.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector2, localQuaternion2, localVector3);
        if (!inputSources[0].profiles.includes('oculus-hand')) {
          localQuaternion2.multiply(localQuaternion3.setFromAxisAngle(localVector3.set(1, 0, 0), -Math.PI*0.5));
        } else {
          localQuaternion2.multiply(localQuaternion3.setFromAxisAngle(localVector3.set(0, 0, 1), Math.PI*0.5)).multiply(localQuaternion3.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.2));
        }
        leftGamepadPosition = localVector2.toArray(localArray);
        leftGamepadQuaternion = localQuaternion2.toArray(localArray2);

        const {gamepad} = inputSources[0];
        if (gamepad && gamepad.buttons.length >= 2) {
          const {buttons} = gamepad;
          leftGamepadPointer = buttons[0].value;
          leftGamepadGrip = buttons[1].value;
        } else {
          leftGamepadPointer = 0;
          leftGamepadGrip = 0;
        }
        leftGamepadEnabled = true;
      } else {
        leftGamepadEnabled = false;
      }
      if (inputSources[1] && (pose = frame.getPose(inputSources[1].gripSpace, renderer.xr.getReferenceSpace()))) {
        localMatrix.fromArray(pose.transform.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector2, localQuaternion2, localVector3);
        if (!inputSources[1].profiles.includes('oculus-hand')) {
          localQuaternion2.multiply(localQuaternion3.setFromAxisAngle(localVector3.set(1, 0, 0), -Math.PI*0.5));
        } else {
          localQuaternion2.multiply(localQuaternion3.setFromAxisAngle(localVector3.set(0, 0, 1), -Math.PI*0.5)).multiply(localQuaternion3.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.2));
        }
        rightGamepadPosition = localVector2.toArray(localArray3);
        rightGamepadQuaternion = localQuaternion2.toArray(localArray4);

        const {gamepad} = inputSources[1];
        if (gamepad && gamepad.buttons.length >= 2) {
          const {buttons} = gamepad;
          rightGamepadPointer = buttons[0].value;
          rightGamepadGrip = buttons[1].value;
        } else {
          rightGamepadPointer = 0;
          rightGamepadGrip = 0;
        }
        rightGamepadEnabled = true;
      } else {
        rightGamepadEnabled = false;
      }
    } else {
      localMatrix.copy(localPlayer.matrixWorld)
        .decompose(localVector, localQuaternion, localVector2);
    }

    const handOffsetScale = localPlayer ? localPlayer.avatar.height / 1.5 : 1;
    if (!leftGamepadPosition) {
      leftGamepadPosition = localVector2.copy(localVector)
        .add(localVector3.copy(leftHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
        .toArray();
      leftGamepadQuaternion = localQuaternion.toArray();
      leftGamepadPointer = 0;
      leftGamepadGrip = 0;
      leftGamepadEnabled = false;
    }
    if (!rightGamepadPosition) {
      rightGamepadPosition = localVector2.copy(localVector)
        .add(localVector3.copy(rightHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
        .toArray();
      rightGamepadQuaternion = localQuaternion.toArray();
      rightGamepadPointer = 0;
      rightGamepadGrip = 0;
      rightGamepadEnabled = false;
    }

    rigManager.setLocalAvatarPose([
      [localVector.toArray(), localQuaternion.toArray()],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled],
    ]);
  } */
  
  render(timestamp, timeDiff) {
    const renderer = getRenderer();
    frameEvent.data.now = timestamp;
    frameEvent.data.timeDiff = timeDiff;
    this.dispatchEvent(frameEvent);
    // frameEvent.data.lastTimestamp = timestamp;
    
    // equipment panel render
    // equipmentRender.previewScene.add(world.lights);
    // equipmentRender.render();

    getComposer().render();
    if(ioManager.debugMode) {
      rendererStats.update(renderer);
    }
  }
  
  startLoop() {
    const renderer = getRenderer();
    if (!renderer) {
      throw new Error('must bind canvas first');
    }
    
    let lastTimestamp = performance.now();

    const animate = (timestamp, frame) => {
      if (window.isRising && window.blocks) { // mark: generate voxel map
        window.blocks.children.forEach((block, i) => {
          if (block._risingState === 'initial' || block._risingState === 'colliding') {
            block.position.y += 0.1;
            block.updateMatrixWorld();
            // const isCollide = physicsManager.collideCapsule(0.5, 1, block.position, localQuaternion.set(0, 0, 0, 1), 1);
            const isCollide = physicsManager.collideBox(0.5, 0.05, 0.5, block.position, localQuaternion.set(0, 0, 0, 1), 1);
            if (isCollide) {
              block._risingState = 'colliding';
            } else if (block._risingState === 'colliding') {
              block._risingState = 'stopped';
            }
          }
        });
      }
      if (window.isRising2 && window.blocks2) {
        window.blocks2.children.forEach((block, i) => {
          if (block._risingState === 'initial' || block._risingState === 'colliding') {
            block.position.y += 0.1;
            block.updateMatrixWorld();
            // const isCollide = physicsManager.collideCapsule(0.5, 1, block.position, localQuaternion.set(0, 0, 0, 1), 1);
            const isCollide = physicsManager.collideBox(0.5, 0.05, 0.5, block.position, localQuaternion.set(0, 0, 0, 1), 1);
            if (isCollide) {
              block._risingState = 'colliding';
            } else if (block._risingState === 'colliding') {
              block._risingState = 'stopped';
            }
          }
        });
      }
      if (window.petDestBlock) { // pet auto go along the path found by A*.
        if (Math.abs(window.fox.position.x - window.petDestBlock.position.x) < 0.5 && Math.abs(window.fox.position.z - window.petDestBlock.position.z) < 0.5) {
          // debugger
          if (window.petDestBlock._next) window.petDestBlock = window.petDestBlock._next;
        }
      }
      // fox auto follow avatar
      if (window.isGeneratedVoxelMap && localPlayer && (Math.abs(localPlayer.position.x - window.destBlock.position.x) > 3 || Math.abs(localPlayer.position.z - window.destBlock.position.z) > 3)) {
        foxFollowAvatar();
      }

      timestamp = timestamp ?? performance.now();
      const timeDiff = timestamp - lastTimestamp;
      const timeDiffCapped = Math.min(Math.max(timeDiff, 0), 100); 
      //const timeDiffCapped = timeDiff;

      ioManager.update(timeDiffCapped);
      // this.injectRigInput();
      
      cameraManager.update(timeDiffCapped);
      
      // const localPlayer = metaversefileApi.useLocalPlayer();
      if (this.contentLoaded && physicsManager.getPhysicsEnabled()) {
        //if(performance.now() - lastTimestamp < 1000/60) return; // There might be a better solution, we need to limit the simulate time otherwise there will be jitter at different FPS
        physicsManager.simulatePhysics(timeDiffCapped); 
        localPlayer.updatePhysics(timestamp, timeDiffCapped);
      }

      lastTimestamp = timestamp;

      transformControls.update();
      game.update(timestamp, timeDiffCapped);
      
      localPlayer.updateAvatar(timestamp, timeDiffCapped);
      playersManager.update(timestamp, timeDiffCapped);
      
      world.appManager.tick(timestamp, timeDiffCapped, frame);

      hpManager.update(timestamp, timeDiffCapped);

      ioManager.updatePost();
      
      game.pushAppUpdates();
      game.pushPlayerUpdates();

      dioramaManager.update(timestamp, timeDiffCapped);

      const session = renderer.xr.getSession();
      const xrCamera = session ? renderer.xr.getCamera(camera) : camera;
      localMatrix.multiplyMatrices(xrCamera.projectionMatrix, /*localMatrix2.multiplyMatrices(*/xrCamera.matrixWorldInverse/*, physx.worldContainer.matrixWorld)*/);
      localMatrix3.copy(xrCamera.matrix)
        .premultiply(dolly.matrix)
        .decompose(localVector, localQuaternion, localVector2);
        
      this.render(timestamp, timeDiffCapped);

    }
    renderer.setAnimationLoop(animate);

    _startHacks();
  }
}

// import {MMDLoader} from 'three/examples/jsm/loaders/MMDLoader.js';
const _startHacks = () => {
  // mark: generate voxel map
  const geometry = new THREE.BoxGeometry();
  geometry.scale(0.9, 0.1, 0.9);
  // geometry.translate(0, -1.2, 0); //
  for (let z = -(height - 1) / 2; z < height / 2; z++) {
    for (let x = -(width - 1) / 2; x < width / 2; x++) {
      const block = new THREE.Mesh(geometry, materialIdle);
      window.blocks.add(block);
      block.position.set(x, -0.1, z);
      block.updateMatrixWorld();
      block._risingState = 'initial'; // 'initial', 'colliding', 'stopped'
      block.position.x = x;
      block.position.z = z;
      block._x = x;
      block._z = z;
      block._isAct = false;
    }
  }
  for (let z = -(height - 1) / 2; z < height / 2; z++) {
    for (let x = -(width - 1) / 2; x < width / 2; x++) {
      const block = new THREE.Mesh(geometry, materialIdle);
      window.blocks2.add(block);
      block.position.set(x, -0.1, z);
      block.updateMatrixWorld();
      block._risingState = 'initial'; // 'initial', 'colliding', 'stopped'
      block.position.x = x;
      block.position.z = z;
      block._x = x;
      block._z = z;
      block._isAct = false;
    }
  }

  resetStartDest(1, window.start.x, window.start.y, 2, window.dest.x, window.dest.y);

  const localPlayer = metaversefileApi.useLocalPlayer();
  const vpdAnimations = Avatar.getAnimations().filter(animation => animation.name.endsWith('.vpd'));

  let playerDiorama = null;
  let appDiorama = null;
  const lastEmoteKey = {
    key: -1,
    timestamp: 0,
  };
  let emoteIndex = -1;
  let poseAnimationIndex = -1;
  const _emoteKey = key => {
    const timestamp = performance.now();
    if ((timestamp - lastEmoteKey.timestamp) < 1000) {
      const key1 = lastEmoteKey.key;
      const key2 = key;
      emoteIndex = (key1 * 10) + key2;
      
      lastEmoteKey.key = -1;
      lastEmoteKey.timestamp = 0;
    } else {
      lastEmoteKey.key = key;
      lastEmoteKey.timestamp = timestamp;
    }
  };
  const _updateEmote = () => {
    localPlayer.removeAction('emote');
    if (emoteIndex !== -1) {
      const emoteAction = {
        type: 'emote',
        index: emoteIndex,
      };
      localPlayer.addAction(emoteAction);
    }
  };
  const _updatePoseAnimation = () => {
    localPlayer.removeAction('pose');
    if (poseAnimationIndex !== -1) {
      const animation = vpdAnimations[poseAnimationIndex];
      const poseAction = {
        type: 'pose',
        animation: animation.name,
      };
      localPlayer.addAction(poseAction);
    }
  };
  /* let mikuModel = null;
  let mikuLoaded = false;
  const _ensureMikuModel = () => {
    if (!mikuLoaded) {
      mikuLoaded = true;

      const mmdLoader = new MMDLoader();
      mmdLoader.load(
        // path to PMD/PMX file
        '/avatars/Miku_Hatsune_Ver2.pmd',
        function(mesh) {
          mikuModel = mesh;
          mikuModel.position.set(0, 0, 0);
          mikuModel.scale.setScalar(0.07);
          mikuModel.updateMatrixWorld();
          scene.add(mikuModel);

          _updateMikuModel();
        },
        // called when loading is in progresses
        function (xhr) {
          // console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function(error) {
          console.warn('An error happened', error);
        }
      );
    }
  };
  const _updateMikuModel = () => {
    if (mikuModel) {
      const animation = vpdAnimations[poseAnimationIndex];

      const _getBone = name => mikuModel.skeleton.bones.find(b => b.name === name);
      const mmdBones = {
        // Root: _getBone('センター'), // deliberately excluded

        mixamorigHips: _getBone('下半身'),
        // mixamorigSpine: _makeFakeBone(), // not present in mmd
        mixamorigSpine1: _getBone('上半身'),
        // mixamorigSpine2: _makeFakeBone(), // not present in mmd
        mixamorigNeck: _getBone('首'),
        mixamorigHead: _getBone('頭'),
        // Eye_L: _getBone('左目'), // deliberately excluded
        // Eye_R: _getBone('右目'), // deliberately excluded

        mixamorigLeftShoulder: _getBone('左肩'),
        mixamorigLeftArm: _getBone('左腕'),
        mixamorigLeftForeArm: _getBone('左ひじ'),
        mixamorigLeftHand: _getBone('左手首'),
        mixamorigLeftHandThumb2: _getBone('左親指２'),
        mixamorigLeftHandThumb1: _getBone('左親指１'),
        // mixamorigLeftHandThumb0: _makeFakeBone(), // not present in mmd
        mixamorigLeftHandIndex3: _getBone('左人指３'),
        mixamorigLeftHandIndex2: _getBone('左人指２'),
        mixamorigLeftHandIndex1: _getBone('左人指１'),
        mixamorigLeftHandMiddle3: _getBone('左中指３'),
        mixamorigLeftHandMiddle2: _getBone('左中指２'),
        mixamorigLeftHandMiddle1: _getBone('左中指１'),
        mixamorigLeftHandRing3: _getBone('左薬指３'),
        mixamorigLeftHandRing2: _getBone('左薬指２'),
        mixamorigLeftHandRing1: _getBone('左薬指１'),
        mixamorigLeftHandPinky3: _getBone('左小指３'),
        mixamorigLeftHandPinky2: _getBone('左小指２'),
        mixamorigLeftHandPinky1: _getBone('左小指１'),
        mixamorigLeftUpLeg: _getBone('左足'),
        mixamorigLeftLeg: _getBone('左ひざ'),
        mixamorigLeftFoot: _getBone('左足首'),

        mixamorigRightShoulder: _getBone('右肩'),
        mixamorigRightArm: _getBone('右腕'),
        mixamorigRightForeArm: _getBone('右ひじ'),
        mixamorigRightHand: _getBone('右手首'),
        mixamorigRightHandThumb2: _getBone('右親指２'),
        mixamorigRightHandThumb1: _getBone('右親指１'),
        // mixamorigRightHandThumb0: _makeFakeBone(), // not present in mmd
        mixamorigRightHandIndex3: _getBone('右人指３'),
        mixamorigRightHandIndex2: _getBone('右人指２'),
        mixamorigRightHandIndex1: _getBone('右人指１'),
        mixamorigRightHandMiddle3: _getBone('右中指３'),
        mixamorigRightHandMiddle2: _getBone('右中指２'),
        mixamorigRightHandMiddle1: _getBone('右中指１'),
        mixamorigRightHandRing3: _getBone('右薬指３'),
        mixamorigRightHandRing2: _getBone('右薬指２'),
        mixamorigRightHandRing1: _getBone('右薬指１'),
        mixamorigRightHandPinky3: _getBone('右小指３'),
        mixamorigRightHandPinky2: _getBone('右小指２'),
        mixamorigRightHandPinky1: _getBone('右小指１'),
        mixamorigRightUpLeg: _getBone('右足'),
        mixamorigRightLeg: _getBone('右ひざ'),
        mixamorigRightFoot: _getBone('右足首'),
        mixamorigLeftToeBase: _getBone('左つま先'),
        mixamorigRightToeBase: _getBone('右つま先'),
      };

      for (const k in animation.interpolants) {
        const match = k.match(/^([\s\S]+?)\.(position|quaternion)$/);
        const boneName = match[1];
        const isPosition = match[2] === 'position';

        const bone = mmdBones[boneName];
        if (bone) {
          const src = animation.interpolants[k];
          const v = src.evaluate(0);
          if (isPosition) {
            // bone.position.fromArray(v);
          } else {
            bone.quaternion.fromArray(v);
          }
        }
      }
      mikuModel.updateMatrixWorld();
    }
  }; */
  window.addEventListener('keydown', e => {
    if (e.which === 219) { // [
      if (localPlayer.avatar) {
        (async () => {
          const audioUrl = '/sounds/pissbaby.mp3';
          // const audioUrl2 = '/sounds/music.mp3';

          const _loadAudio = u => new Promise((accept, reject) => {
            const audio = new Audio(u);
            audio.addEventListener('canplaythrough', async e => {
              accept(audio);
            }, {once: true});
            audio.addEventListener('error', e => {
              reject(e);
            });
            // audio.play();
            // audioContext.resume();
          });

          const audios = await Promise.all([
            _loadAudio(audioUrl),
            // _loadAudio(audioUrl2),
          ]);
          localPlayer.avatar.setAudioEnabled(true);

          const _createMediaStreamSource = o => {
            if (o instanceof MediaStream) {
              const audio = document.createElement('audio');
              audio.srcObject = o;
              audio.muted = true;
            }

            const audioContext = Avatar.getAudioContext();
            if (o instanceof MediaStream) {
              return audioContext.createMediaStreamSource(o);
            } else {
              return audioContext.createMediaElementSource(o);
            }
          };
          const mediaStreamSource = _createMediaStreamSource(audios[0]);
          mediaStreamSource.connect(localPlayer.avatar.getAudioInput());

          audios[0].play();
          // audios[1].play();
          audios[0].addEventListener('ended', e => {
            mediaStreamSource.disconnect();
            localPlayer.avatar.setAudioEnabled(false);
          });
        })();
      }
    } else if (e.which === 221) { // ]
      const localPlayer = metaversefileApi.useLocalPlayer();
      if (localPlayer.avatar) {
        if (!playerDiorama) {
          playerDiorama = dioramaManager.createPlayerDiorama(localPlayer, {
            label: true,
            outline: true,
            lightningBackground: true,
          });
        } else {
          playerDiorama.destroy();
          playerDiorama = null;
        }
      }
    } else if (e.which === 220) { // \\
      const targetApp = (() => {
        const worldApps = world.appManager.getApps();
        const swordApp = worldApps.find(a => /sword/i.test(a.contentId));
        if (swordApp) {
          return swordApp;
        } else {
          const wearAction = localPlayer.getAction('wear');
          if (wearAction) {
            const app = localPlayer.appManager.getAppByInstanceId(wearAction.instanceId);
            return app;
          } else {
            return null;
          }
        }
      })();

      if (!appDiorama) {
        if (targetApp) {
          appDiorama = dioramaManager.createAppDiorama(targetApp, {
            // canvas,
            // label: true,
            outline: true,
            radialBackground: true,
          });
        } else {
          console.warn('no target app');
        }
      } else {
        appDiorama.destroy();
        appDiorama = null;
      }
    } else if (e.which === 46) { // .
      emoteIndex = -1;
      _updateEmote();
    } else if (e.which === 107) { // +
      poseAnimationIndex++;
      poseAnimationIndex = Math.min(Math.max(poseAnimationIndex, -1), vpdAnimations.length - 1);
      _updatePoseAnimation();
    
      // _ensureMikuModel();
      // _updateMikuModel();
    } else if (e.which === 109) { // -
      poseAnimationIndex--;
      poseAnimationIndex = Math.min(Math.max(poseAnimationIndex, -1), vpdAnimations.length - 1);
      _updatePoseAnimation();

      // _ensureMikuModel();
      // _updateMikuModel();
    } else {
      const match = e.code.match(/^Numpad([0-9])$/);
      if (match) {
        const key = parseInt(match[1], 10);
        _emoteKey(key);
        _updateEmote();
      }
    }
  });
};