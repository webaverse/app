/* eslint-disable linebreak-style */
/* eslint-disable keyword-spacing */
/* eslint-disable lines-between-class-members */
/* eslint-disable space-before-blocks */
/* eslint-disable indent */
/* eslint-disable no-trailing-spaces */
/* eslint-disable spaced-comment */
/* eslint-disable linebreak-style */
/* eslint-disable space-infix-ops */
import * as THREE from 'three';
import metaversefile from './metaversefile-api.js';
import * as metaverseModules from './metaverse-modules.js';
import {scene, camera} from './renderer.js';
import * as sounds from './sounds.js';
import cameraManager from './camera-manager.js';
import physicsManager from './physics-manager.js';
import game from './game.js';
import {getLocalPlayer} from './players.js';
import metaversefileApi from 'metaversefile';
import mobManager from './mob-manager.js';
import npcManager from './npc-manager.js';

const localVector = new THREE.Vector3();

// const maxResults = 16;

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
class QueryResults {
  constructor() {
    this.results = [];
  }
  snapshot(object) {
    const {position, quaternion} = object;
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
    let reticles = result.map(reticle => {
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
    if (object === camera) {
      reticles = reticles.filter(reticle => {
        localVector.copy(reticle.position)
          .project(camera);
        return ( // check inside camera frustum
          localVector.x >= -1 && localVector.x <= 1 &&
          localVector.y >= -1 && localVector.y <= 1 &&
          localVector.z > 0
        );
      });
    }
    const reticleSpecs = reticles.map(reticle => {
      localVector.copy(reticle.position)
        .project(camera);
      return {
        reticle,
        lengthSq: localVector.lengthSq(),
      };
    });
    reticleSpecs.sort((a, b) => a.lengthSq - b.lengthSq);
    reticles = reticleSpecs.map(reticleSpec => reticleSpec.reticle);
    this.results = reticles;
  }
}

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
    this.focusTargetReticle = null;
    this.focusTargetApp = null;
    this.focusTargetObject = null;
    this.focusTargetObjectBias = new THREE.Vector3();
    this.queryResults = new QueryResults();
    this.nearbyResults = new QueryResults();
    this.dropAngle = 145;
    this.nearbyMobs = [];
    this.nearbyNpc = [];
  }
  setQueryResult(timestamp) {
    let reticles;
    const localPlayer = getLocalPlayer();
    //select target
    if (localPlayer.hasAction('aim')) {
      this.queryResults.snapshot(camera);
      reticles = this.queryResults.results;
    } else {
      reticles = [];
    }
    //focusing on target
    if (this.focusTargetReticle) {
      const timeDiff = timestamp - cameraManager.lerpStartTime;
      const focusTime = 250;

      const f = timeDiff / focusTime;
      //if you have focus or are close? to target lock on
      if (cameraManager.focus || f < 3) {
        reticles = [
          this.focusTargetReticle,
        ];

        let f2 = Math.min(Math.max(f, 0), 1);
        if (cameraManager.focus) {
          f2 = 1 - f2;
        }
        this.focusTargetReticle.zoom = f2;
      } else {
        this.focusTargetReticle = null;
      }
    }
    
    const targetReticleMesh = this.targetReticleApp.children[0];
    targetReticleMesh.setReticles(reticles);
  }
  update(timestamp) {
    // console.log('update z-targeting');
    this.setQueryResult(timestamp);
    if (this.focusTargetReticle) {
      this.focusTargetReticle.position
        .copy(this.focusTargetObject.position)
        .add(this.focusTargetObjectBias);
    }
  }
  //now just feeds into handle target with camera object
  handleDown(object = camera) {
    if (!cameraManager.focus) {
      this.handleTarget(object);
   }
  }
  // handleDown except it accepts more parameters; will be needed for target swapping
  handleTarget(targetObject){
    // if (!cameraManager.focus) {
      this.queryResults.snapshot(targetObject);

      if (this.queryResults.results.length > 0) {
        this.focusTargetReticle = this.queryResults.results[0];
        const pair = metaversefileApi.getPairByPhysicsId(this.focusTargetReticle.physicsId);
        this.focusTargetApp = pair[0];
        this.focusTargetObject = pair[1];
        if (this.focusTargetApp?.npcPlayer?.avatar) {
          const headPosition = localVector.setFromMatrixPosition(this.focusTargetApp.npcPlayer.avatar.foundModelBones.Head.matrixWorld);
          this.focusTargetObjectBias
            .copy(headPosition)
            .sub(this.focusTargetObject.position);
        } else {
          this.focusTargetObjectBias
            .copy(this.focusTargetReticle.position)
            .sub(this.focusTargetObject.position);
        }
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
      const localPlayer = getLocalPlayer();
      cameraManager.setStaticTarget(localPlayer.avatar.modelBones.Head, remoteApp);
      // if (remoteApp) {
      // debugger
      if (this.focusTargetReticle) {
        game.menuAim();
      }
    }
  }
  handleUp() {
    if (cameraManager.focus) {
      cameraManager.setFocus(false);
      cameraManager.setStaticTarget();
      game.menuUnaim();

      if (this.focusTargetReticle) {
        sounds.playSoundName('zTargetCancel');
      }
    }
  }
  toggle() {
    if (cameraManager.focus) {
      this.handleUp();
    } else {
      const localPlayer = getLocalPlayer();
      this.handleDown(localPlayer);
      
      if (this.queryResults.results.length === 0) {
        setTimeout(() => {
          this.handleUp();
        }, 300);
      }
    }
  }
  findNearbyTarget(){
    //Make list for 'nearby mobs'                     // already exists
    //for each mob in mob manager
    //let angleVal = 0;
    for (const mob of mobManager.mobs){
      const mobPhysicsObjects = mob.getPhysicsObjects();
      console.log('mob', mobManager.mobs);
      //check distance to character                   // Maybe not both this and below
      //compareAngletoCam(wider angle than checkdrop())
        //add to list of 'nearby mobs', sorted by angle dist
      const mobAngle = cameraManager.compareAngletoCam(mobPhysicsObjects.position)
      if (camera.position.distanceTo(mobPhysicsObjects.position)< 20 /*random val rn*/ && mobAngle > 120){
        // if (mobAngle > angleVal){
        //   angleVal = mobAngle;
        // this.nearbyMobs = [mobPhysicsObjects];
        this.nearbyMobs.push(mobPhysicsObjects);
        // }
      }
    }
    //if list.length > 0
      //togle()
      //focus(list[0])
      //handletarget(list[0])
    if (this.nearbyMobs.length > 0){
      console.log('mobs', this.nearbyMobs);
      this.toggle();
      this.handleTarget(this.nearbyMobs[0]);
      this.nearbyMobs = [];
    }
  } 
  // findNearbyNpc(){
  //   console.log('npc', npcManager.npcs);
  //   const npcPhysicsOb = npcManager.npcs[0].getPhysicsObjects();
  //   if (cameraManager.compareAngletoCam(npcPhysicsOb.position < 120)){
  //     this.nearbyNpc.push(npcPhysicsOb); //gonna make this a dictionary later with mob-angle relation
  //   }
  //   if (this.nearbyNpc.length > 0){
  //     console.log('npc', this.nearbnearbyNpcMobs);
  //     this.toggle();
  //     this.handleTarget(this.nearbyNpc[0]);
  //     this.nearbyNpc = [];
  //   }
  // }
  checkDrop(){
    var camAngle;
    if (this.focusTargetReticle){
      camAngle = cameraManager.compareAngletoCam(this.focusTargetReticle.position);
      //bug angles are inverted 
      if (camAngle < this.dropAngle){
        this.handleUp();
      }else{}
    }
  }
}
const zTargeting = new ZTargeting();
window.zTargeting = zTargeting;
scene.add(zTargeting);
export default zTargeting;