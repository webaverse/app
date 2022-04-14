import * as Z from 'zjs';
import {LocalPlayer} from './character-controller.js';
import {makeId, getRandomString, getPlayerPrefix, memoize} from './util.js';
import {initialPosY} from './constants.js';

export const localPlayer = new LocalPlayer({
  prefix: getPlayerPrefix(makeId(5)),
  state: new Z.Doc(),
});
localPlayer.position.y = initialPosY;
localPlayer.updateMatrixWorld();

export const remotePlayers = new Map();