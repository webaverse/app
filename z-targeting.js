import * as THREE from 'three';
import metaversefile from './metaversefile-api.js';
import * as metaverseModules from './metaverse-modules.js';
import {scene, camera} from './renderer.js';
import * as sounds from './sounds.js';
import cameraManager from './camera-manager.js';
import {localPlayer} from './players.js';

const localVector = new THREE.Vector3();

class ZTargeting extends THREE.Object3D {
  constructor() {
    super();

    const targetReticleApp = metaversefile.createApp();
    (async () => {
      await metaverseModules.waitForLoad();

      const {modules} = metaverseModules;
      const m = modules['targetReticle'];
      await targetReticleApp.addModule(m);
    })();
    scene.add(targetReticleApp);
    this.targetReticleApp = targetReticleApp;

    this.reticles = [];
    this.lastFocus = false;
    this.focusTargetReticle = null;
  }
  setQueryResult(result, timestamp, focus, lastFocusChangeTime) {
    const targetReticleMesh = this.targetReticleApp.children[0];
    
    // console.log('set focus', focus);

    let reticles = result;
    if (reticles.length > 0) {
      const reticleSpecs = reticles.map(reticle => {
        localVector.copy(reticle.position)
          .project(camera);
        if (
          localVector.x >= -1 && localVector.x <= 1 &&
          localVector.y >= -1 && localVector.y <= 1 &&
          localVector.z > 0
        ) {
          return {
            reticle,
            lengthSq: localVector.lengthSq(),
          };
        } else {
          return null;
        }
      });
      for (let i = reticleSpecs.length - 1; i >= 0; i--) {
        if (reticleSpecs[i] === null) {
          reticleSpecs.splice(i, 1);
        }
      }
      reticleSpecs.sort((a, b) => a.lengthSq - b.lengthSq);
      reticles = reticleSpecs.map(reticleSpec => reticleSpec.reticle);
    }

    const timeDiff = timestamp - lastFocusChangeTime;
    const focusTime = 250;
    if (this.focusTargetReticle) {
      if (focus || timeDiff < focusTime) {
        reticles = [
          this.focusTargetReticle,
        ];
    
        let f2 = Math.min(Math.max(timeDiff / focusTime, 0), 1);
        if (focus) {
          f2 = 1 - f2;
        }
        this.focusTargetReticle.zoom = f2;
      } else {
        this.focusTargetReticle = null;
      }
    }
    
    targetReticleMesh.setReticles(reticles);
    this.reticles = reticles;

    this.lastFocus = focus;
  }
  handleDown() {
    if (!cameraManager.focus) {
      if (this.reticles.length > 0) {
        this.focusTargetReticle = this.reticles[0];
        sounds.playSoundName(this.focusTargetReticle.type == 'enemy' ? 'zTargetEnemy' : 'zTargetObject');
      
        const naviSoundNames = [
          'naviHey',
          'naviWatchout',
          'naviFriendly',
          'naviItem',
          'naviDanger',
        ];
        const naviSoundName = naviSoundNames[Math.floor(Math.random() * naviSoundNames.length)];
        sounds.playSoundName(naviSoundName);
      } else {
        sounds.playSoundName('zTargetCenter');
      }

      cameraManager.setFocus(true);
      const remoteApp = this.focusTargetReticle ? metaversefile.getAppByPhysicsId(this.focusTargetReticle.physicsId) : null;
      cameraManager.setStaticTarget(localPlayer.avatar.modelBones.Head, remoteApp);
    }
  }
  handleUp() {
    if (cameraManager.focus) {
      cameraManager.setFocus(false);
      cameraManager.setStaticTarget();

      if (this.focusTargetReticle) {
        sounds.playSoundName('zTargetCancel');
      }
    }
  }
  toggle() {
    if (cameraManager.focus) {
      this.handleUp();
    } else {
      if (this.reticles.length > 0) {
        this.handleDown();
      } else {
        this.handleDown();
        setTimeout(() => {
          this.handleUp();
        }, 200);
      }
    }
  }
}
const zTargeting = new ZTargeting();
scene.add(zTargeting);
export default zTargeting;