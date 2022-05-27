/*
this file contains the story beat triggers (battles, victory, game over, etc.)
*/

import * as THREE from 'three';
import {SwirlPass} from './SwirlPass.js';
import {
  getRenderer,
  getComposer,
  rootScene,
  // sceneHighPriority,
  // scene,
  // sceneLowPriority,
  camera,
} from './renderer.js';
import * as sounds from './sounds.js';
import musicManager from './music-manager.js';

const localVector2D = new THREE.Vector2();

function makeSwirlPass() {
  const renderer = getRenderer();
  const size = renderer.getSize(localVector2D)
    .multiplyScalar(renderer.getPixelRatio());
  const resolution = size;

  const swirlPass = new SwirlPass(rootScene, camera, resolution.x, resolution.y);
  // swirlPass.enabled = false;
  return swirlPass;
}
const _startSwirl = () => {
  const composer = getComposer();
  if (!composer.swirlPass) {
    composer.swirlPass = makeSwirlPass();
    composer.passes.push(composer.swirlPass);

    sounds.playSoundName('battleTransition');
    musicManager.playCurrentMusic('battle');
  }
};
const _stopSwirl = () => {
  const composer = getComposer();
  if (composer.swirlPass) {
    const swirlPassIndex = composer.passes.indexOf(composer.swirlPass);
    composer.passes.splice(swirlPassIndex, 1);
    composer.swirlPass = null;

    musicManager.stopCurrentMusic();
    return true;
  } else {
    return false;
  }
};
const fieldMusicNames = [
  'dungeon',
  'homespace',
];

let currentFieldMusic = null;
let currentFieldMusicIndex = 0;

export const handleStoryKeyControls = async (e) => {

  switch (e.which) {
    case 48: { // 0
      await musicManager.waitForLoad();
      _stopSwirl() || _startSwirl();
      return false;
    }
    case 57: { // 9
      await musicManager.waitForLoad();
      _stopSwirl();
      if (currentFieldMusic) {
        musicManager.stopCurrentMusic();
        currentFieldMusic = null;
      } else {
        const fieldMusicName = fieldMusicNames[currentFieldMusicIndex];
        currentFieldMusicIndex = (currentFieldMusicIndex + 1) % fieldMusicNames.length;
        currentFieldMusic = musicManager.playCurrentMusic(fieldMusicName, {
          repeat: true,
        });
      }
      return false;
    }
    case 189: { // -
      await musicManager.waitForLoad();
      _stopSwirl();
      musicManager.playCurrentMusic('victory', {
        repeat: true,
      });
      return false;
    }
    case 187: { // =
      await musicManager.waitForLoad();
      _stopSwirl();
      musicManager.playCurrentMusic('gameOver', {
        repeat: true,
      });
      return false;
    }
  }

  return true;
};