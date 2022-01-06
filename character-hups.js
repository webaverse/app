/* this is the character heads up player implementation.
it controls the animated dioramas that happen when players perform actions. */

import * as THREE from 'three';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

// const localOffset = new THREE.Vector3();
const localOffset2 = new THREE.Vector3();

// const localArray = [];
const localVelocity = new THREE.Vector3();

// const zeroVector = new THREE.Vector3();
// const upVector = new THREE.Vector3(0, 1, 0);

const _makeHupFromAction = (action) => {
  switch (action.type) {
    case 'chat': {
      return {
        type: 'chat',
        actionId: action.actionId,
        value: action.value,
      };
    }
    case 'script': {
      return {
        type: 'chat',
        actionId: action.actionId,
        value: action.value,
      };
    }
    case 'emote': {
      return {
        type: 'chat',
        actionId: action.actionId,
        value: action.value,
      };
    }
    default: 
  }
};

class CharacterHups extends EventTarget {
  constructor(player) {
    super();
    
    this.player = player;

    this.hups = [];
    this.updateHups();
  }
  updateHups() {
    let hups = [];
    const player = this.player;
    const actions = player.getActions();
    for (const action of actions) {
      const oldHup = this.hups.find(hup => hup.actionId === action.actionId);
      if (!oldHup) {
        const newHup = _makeHupFromAction(action);
        if (newHup) { // successfully created
          this.hups.push(newHup);
          this.dispatchEvent(new MessageEvent('hupadd', {data: {newHup}}));
        } else {
          // not a hup action
        }
      }
    }
    hups = hups.filter(hup => {
      if (actions.find(action => action.actionId === hup.actionId)) { // action still there
        return true;
      } else { // action gone, was removed
        this.dispatchEvent(new MessageEvent('hupremove', {data: {hup}}));
        return false;
      }
    });
    this.hups = hups;
  }
  addScriptHupAction(script) {
    this.player.addAction({
      type: 'script',
      script,
    });
  }
  addChatHupAction(text) {
    this.player.addAction({
      type: 'chat',
      text,
    });
  }
  addEmoteHupAction(emote) {
    this.player.addAction({
      type: 'emote',
      emote,
    });
  }
}

export {
  CharacterHups,
};
