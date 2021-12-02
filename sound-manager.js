/* 
this is the sound manager implementation.
*/

import * as THREE from 'three';
//import ioManager from './io-manager.js';
import gameManager from './game.js';
//import physx from './physx.js';
import {camera} from './renderer.js';
import totumApi from 'totum';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const zeroVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);

class SoundManager {
  constructor() {

    this.lastIsJumping = false;

    this.timeNextStep = 0;
    this.sounds = new Map();
    this.lastIds = new Map();

    this.listener = new THREE.AudioListener();
    camera.add( this.listener );


    this.audioLoader = new THREE.AudioLoader();

    this.loadBasicSounds();
  }
  update(timeDiffS) {

    this.localPlayer = totumApi.useLocalPlayer();
    if (this.localPlayer === undefined) {
      return;
    }
    
    const isJumping = this.localPlayer.hasAction('jump');
    //const isFlying = gameManager.isFlying();
    
    if (this.lastIsJumping && !isJumping) {
      this.play('jumpEnd');
    }

    this.lastIsJumping = isJumping;
  }
  setMasterVolume(volume){
    this.listener.setMasterVolume(volume);
  }
  getMasterVolume(){
    this.listener.getMasterVolume();
  }
  setSoundLoop(name,loop) {
    if (this.sounds.get(name)) {
      this.sounds.get(name).setLoop(loop);
    }
  }
  setSoundVolume(name,volume) {
    if (this.sounds.get(name)) {
      this.sounds.get(name).setVolume(volume);
    }
  } 
  play(name) {
    if (this.sounds.get(name)) {
      if (this.sounds.get(name).isPlaying) {
        this.sounds.get(name).stop();
      }
      this.sounds.get(name).play();
    }
  }
  playWithId(name,id) {
    const lastId = this.lastIds.get(name);
    if (lastId === undefined || lastId != id) {
      this.play(name);
      this.lastIds.set(name,id);
    }
  }
  playStepSound(id) {
    if (gameManager.isFlying() || gameManager.isSitting() || gameManager.isJumping()) {
      return;
    }
    this.playWithId('step1',id);
  }
  loadBasicSounds() {

    this.loadSound('jump','sounds/Jump1.mp3');
    this.loadSound('jumpEnd','sounds/JumpEnd.mp3');
    this.loadSound('step1','sounds/FootstepA.mp3',0.15);
    this.loadSound('step2','sounds/FootstepB.mp3',0.15);
  
  }
  loadSound(name,path,volume=1.0,shouldLoop=false,shouldReload=false) {

    if (!shouldReload && this.sounds[name]) {
      return;
    }

    const sound = new THREE.Audio( this.listener );
    sound.setLoop( shouldLoop );
    sound.setVolume( volume );

    this.sounds.set(name,sound);

    this.audioLoader.load( path, function( buffer ) {

      sound.setBuffer( buffer );

    });

  }
}

const soundManager = new SoundManager();

export default soundManager;