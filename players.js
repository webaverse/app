import * as Z from 'zjs';
import {LocalPlayer} from './character-controller.js';
import {makeId, getRandomString, getPlayerPrefix, memoize} from './util.js';
import {initialPosY} from './constants.js';

export const localPlayer = new LocalPlayer({
// const localPlayerReal = new LocalPlayer({
  prefix: getPlayerPrefix(makeId(5)),
  state: new Z.Doc(),
});
// export const localPlayer = new Proxy(localPlayerReal, {
//   set: (obj, prop, newVal) => {
//     if (prop === 'avatar') debugger;
//     obj[prop] = newVal;
//     return true;
//   },
// });
localPlayer.position.y = initialPosY;
localPlayer.updateMatrixWorld();

export const remotePlayers = new Map();
