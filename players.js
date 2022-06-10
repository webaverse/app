import * as Z from 'zjs';
// import metaversefile from 'metaversefile';
import {LocalPlayer} from './character-controller.js';
import {makeId} from './util.js';
import {initialPosY, playersMapName} from './constants.js';

const localPlayerId = makeId(5);
const localPlayersArray = new Z.Doc().getArray(playersMapName);
let localPlayer = new LocalPlayer({
  playerId: localPlayerId,
  playersArray: localPlayersArray,
});
localPlayer.position.y = initialPosY;
localPlayer.updateMatrixWorld();

export const getLocalPlayer = () => localPlayer;
export const setLocalPlayer = newLocalPlayer => {
  localPlayer = newLocalPlayer;
}

export const remotePlayers = new Map();