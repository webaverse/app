import * as THREE from 'three';
import metaversefile from './metaversefile-api.js';
import * as metaverseModules from './metaverse-modules.js';
import {scene, camera} from './renderer.js';
import * as sounds from './sounds.js';
import cameraManager from './camera-manager.js';
import physicsManager from './physics-manager.js';
import {localPlayer} from './players.js';

const localVector = new THREE.Vector3();

const getPyramidConvexGeometry = (() => {
  const radius = 0.5;
  const height = 0.2;
  const radialSegments = 4;
  const heightSegments = 1;

  let shapeAddress = null;

  return () => {
    if (shapeAddress === null) {
      const geometry = new THREE.ConeGeometry(
        radius,
        height,
        radialSegments,
        heightSegments,
        /* openEnded,
        thetaStart,
        thetaLength, */
      );
      geometry.rotateX(-Math.PI/2);
      geometry.rotateZ(Math.PI/4);
      geometry.scale(2, 2.75, 1);

      /* redMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0xff0000}));
      redMesh.frustumCulled = false;
      scene.add(redMesh); */

      const fakeMesh = new THREE.Mesh(geometry);
      const buffer = physicsManager.cookConvexGeometry(fakeMesh);
      shapeAddress = physicsManager.createConvexShape(buffer);
    }
    return shapeAddress;
  };
})();

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

    this.queryResults = Array();

    this.reticles = [];
    this.focusTargetReticle = null;
  }
  setQueryResult(result, timestamp) {
    const targetReticleMesh = this.targetReticleApp.children[0];

    let reticles = result;
    if (reticles.length > 0) {
      const reticleSpecs = reticles.map(reticle => {
        localVector.copy(reticle.position)
          .project(camera);
        if ( // check inside camera frustum
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
      // remove not in camera frustum
      for (let i = reticleSpecs.length - 1; i >= 0; i--) {
        if (reticleSpecs[i] === null) {
          reticleSpecs.splice(i, 1);
        }
      }
      reticleSpecs.sort((a, b) => a.lengthSq - b.lengthSq);
      reticles = reticleSpecs.map(reticleSpec => reticleSpec.reticle);
    }

    if (this.focusTargetReticle) {
      const timeDiff = timestamp - cameraManager.lerpStartTime;
      const focusTime = 250;

      if (cameraManager.focus) {
        reticles = [
          this.focusTargetReticle,
        ];
    
        let f2 = Math.min(Math.max(timeDiff / focusTime, 0), 1);
        if (cameraManager.focus) {
          f2 = 1 - f2;
        }
        this.focusTargetReticle.zoom = f2;
      } else {
        this.focusTargetReticle = null;
      }
    }
    
    targetReticleMesh.setReticles(reticles);
    this.reticles = reticles;
  }
  update(timestamp, timeDiff) {
    const {position, quaternion} = localPlayer;
    const direction = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(quaternion);
    const sweepDistance = 100;
    const maxHits = 64;

    const pyramidConvexGeometryAddress = getPyramidConvexGeometry();

    const result = physicsManager.sweepConvexShape(
      pyramidConvexGeometryAddress,
      position,
      quaternion,
      direction,
      sweepDistance,
      maxHits,
    );
    const queryResult = result.map(reticle => {
      const distance = reticle.position.distanceTo(position);
      const type = (() => {
        if (distance < 5) {
          return 'friend';
        } else if (distance < 10) {
          return 'enemy';
        } else {
          return 'object';
        }
      })();
      const zoom = 0;
      return {
        position: reticle.position,
        physicsId: reticle.objectId,
        type,
        zoom,
      }
    });
    this.setQueryResult(queryResult, timestamp, cameraManager.focus, cameraManager.lastFocusChangeTime);
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
        }, 300);
      }
    }
  }
}
const zTargeting = new ZTargeting();
scene.add(zTargeting);
export default zTargeting;