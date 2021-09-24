import * as THREE from 'three';

import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import {makeTextMesh, makeRigCapsule} from './vr-ui.js';
import {unFrustumCull} from './util.js';
import {appManager, getRenderer, scene, camera, dolly, avatarScene} from './app-object.js';
import {loginManager} from './login.js';
import runtime from './runtime.js';
import controlsManager from './controls-manager.js';
import Avatar from './avatars/avatars.js';
import {RigAux} from './rig-aux.js';
import physicsManager from './physics-manager.js';
import metaversefile from 'metaversefile';
const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localEuler2 = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localRaycaster = new THREE.Raycaster();

const roundedRectGeometry = (() => {
  const w = 1;
  const h = 0.15;
  const roundedRectShape = new THREE.Shape();
  ( function roundedRect( ctx, x, y, width, height, radius ) {
    ctx.moveTo( x, y + radius );
    ctx.lineTo( x, y + height - radius );
    ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
    /* ctx.lineTo( x + radius + indentWidth, y + height );
    ctx.lineTo( x + radius + indentWidth + indentHeight, y + height - indentHeight );
    ctx.lineTo( x + width - radius - indentWidth - indentHeight, y + height - indentHeight );
    ctx.lineTo( x + width - radius - indentWidth, y + height ); */
    ctx.lineTo( x + width - radius, y + height );
    ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
    ctx.lineTo( x + width, y + radius );
    ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
    ctx.lineTo( x + radius, y );
    ctx.quadraticCurveTo( x, y, x, y + radius );
  } )( roundedRectShape, 0, 0, w, h, h/2 );

  const extrudeSettings = {
    steps: 2,
    depth: 0,
    bevelEnabled: false,
    /* bevelEnabled: true,
    bevelThickness: 0,
    bevelSize: 0,
    bevelOffset: 0,
    bevelSegments: 0, */
  };
  const geometry = BufferGeometryUtils.mergeBufferGeometries([
    new THREE.CircleBufferGeometry(0.13, 32)
      .applyMatrix4(new THREE.Matrix4().makeTranslation(-w/2, -0.02, -0.01)).toNonIndexed(),
    new THREE.ExtrudeBufferGeometry( roundedRectShape, extrudeSettings )
      .applyMatrix4(new THREE.Matrix4().makeTranslation(-w/2, -h/2 - 0.02, -0.02)),
  ]);
  return geometry;
})();

class RigManager {
  constructor(scene) {
    this.scene = scene;

    this.localRig = null;
    this.localRigMatrix = new THREE.Matrix4();
    this.localRigMatrixEnabled = false;
    
    this.lastPosition = new THREE.Vector3();
    this.smoothVelocity = new THREE.Vector3();

    this.peerRigs = new Map();
    
    this.lastTimetamp = Date.now();
  }

  clearAvatar() {
    if (this.localRig) {
      this.scene.remove(this.localRig);
      this.scene.remove(this.localRig.textMesh);
      this.localRig = null;
    }
  }

  setDefault() {
    this.clearAvatar();
    
    rigManager.setLocalAvatarUrl('./avatars/citrine.vrm', 'vrm');

    /* this.localRig = new Avatar(null, {
      fingers: true,
      hair: true,
      visemes: true,
      debug: true,
    });
    this.localRig.aux = new RigAux({
      rig: this.localRig,
      scene: avatarScene,
    });
    unFrustumCull(this.localRig.model);
    this.scene.add(this.localRig.model);

    this.localRig.avatarUrl = null;

    this.localRig.textMesh = makeTextMesh('Anonymous', undefined, 0.15, 'center', 'middle');
    {
      const geometry = new THREE.CircleBufferGeometry(0.1, 32);
      const img = new Image();
      img.src = `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.jpg`;
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        texture.needsUpdate = true;
      };
      img.onerror = err => {
        console.warn(err.stack);
      };
      const texture = new THREE.Texture(img);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      const avatarMesh = new THREE.Mesh(geometry, material);
      avatarMesh.position.x = -0.5;
      avatarMesh.position.y = -0.02;
      this.localRig.textMesh.add(avatarMesh);
      this.localRig.textMesh.avatarMesh = avatarMesh;
    }
    {
      const geometry = roundedRectGeometry;
      const material2 = new THREE.LineBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const nametagMesh2 = new THREE.Mesh(geometry, material2);
      this.localRig.textMesh.add(nametagMesh2);
    }
    this.scene.add(this.localRig.textMesh); */
  }
  
  setFromLogin() {
    if (!this.localRig) {
      this.setDefault();
    }

    const avatar = loginManager.getAvatar();
    if (avatar.url) {
      rigManager.setLocalAvatarUrl(avatar.url, avatar.ext);
    }
    if (avatar.preview) {
      rigManager.setLocalAvatarImage(avatar.preview);
    }
    loginManager.addEventListener('avatarchange', e => {
      const avatar = e.data;
      const newAvatarUrl = avatar ? avatar.url : null;
      if (newAvatarUrl !== rigManager.localRig.avatarUrl) {
        rigManager.setLocalAvatarUrl(newAvatarUrl, avatar.ext);
        rigManager.setLocalAvatarImage(avatar.preview);
      }
    });
    
  }

  setLocalRigMatrix(rm) {
    if (rm) {
      this.localRigMatrix.copy(rm);
      this.localRigMatrixEnabled = true;
    } else {
      this.localRigMatrixEnabled = false;
    }
  }

  setLocalAvatarName(name) {
    this.localRig.textMesh.text = name;
    this.localRig.textMesh.sync();
  }

  setLocalAvatarImage(avatarImage) {
    if (this.localRig.textMesh.avatarMesh) {
      this.localRig.textMesh.remove(this.localRig.textMesh.avatarMesh);
      this.localRig.textMesh.avatarMesh = null;
    }
    const geometry = new THREE.CircleBufferGeometry(0.1, 32);
    const img = new Image();
    img.src = avatarImage;
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      texture.needsUpdate = true;
    };
    img.onerror = err => {
      console.warn(err.stack);
    };
    const texture = new THREE.Texture(img);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    const avatarMesh = new THREE.Mesh(geometry, material);
    avatarMesh.position.x = -0.5;
    avatarMesh.position.y = -0.02;

    this.localRig.textMesh.add(avatarMesh);
    this.localRig.textMesh.avatarMesh = avatarMesh;
  }

  async setLocalAvatarUrl(url, ext) {
    // await this.localRigQueue.lock();

    if (url) {
      // this.setDefault();
      await this.setAvatar(this.localRig, newLocalRig => {
        this.clearAvatar();
        this.localRig = newLocalRig;
      }, url);
    } else {
      this.clearAvatar();
    }

    // await this.localRigQueue.unlock();
  }

  async setAvatar(oldRig, setRig, url/*, ext*/) {
    if (!oldRig) {
      const textMesh = makeTextMesh('Anonymous', undefined, 0.15, 'center', 'middle');
      oldRig = {
        textMesh,
      };
    }
    if (oldRig.url !== url) {
      oldRig.url = url;

      let o;
      if (url) {
        const m = await metaversefile.import(url);
        const app = metaversefile.createApp();
        // app.setAttribute('avatar', true);
        await metaversefile.addModule(app, m);
        o = app;
        /* o = await runtime.loadFile({
          url,
          ext,
        }, {
          contentId: url,
        }); */
        /* if (!o.isVrm && o.run) {
          o.run();
        } */
      }

      if (oldRig.url === url) {
        if (oldRig.model) {
          oldRig.model.parent.remove(oldRig.model);
        }

        console.log('model o', o);

        if (o) {
          const {raw} = o;
          // console.log('got raw', o, o.children[0], raw);
          if (raw) {
            const localRig = new Avatar(raw, {
              fingers: true,
              hair: true,
              visemes: true,
              debug: false,
            });
            localRig.model = o;
            localRig.url = url;
            // localRig.model.isVrm = true;
            // localRig.aux = oldRig.aux;
            // localRig.aux.rig = localRig;
            
            unFrustumCull(localRig.model);
            scene.add(localRig.model);
            localRig.textMesh = oldRig.textMesh;
            // localRig.avatarUrl = oldRig.url;
            // localRig.rigCapsule = oldRig.rigCapsule;

            setRig(localRig);
          /* } else {
            localRig = new Avatar();
            // localRig.aux = oldRig.aux;
            // localRig.aux.rig = localRig;
            localRig.model = o;
            // console.log('local rig model', o, localRig.model);
            // debugger;
            localRig.update = () => {
              localRig.model.position.copy(localRig.inputs.hmd.position);
              localRig.model.quaternion.copy(localRig.inputs.hmd.quaternion);
            }; */
          }
        /* } else {
          localRig = new Avatar(null, {
            fingers: true,
            hair: true,
            visemes: true,
            debug: true,
          });
          // localRig.aux = oldRig.aux;
          // localRig.aux.rig = localRig; */
        }
      }
    }
  }
  
  /* isPeerRig(rig) {
    for (const peerRig of this.peerRigs.values()) {
      if (peerRig === rig) {
        return true;
      }
    }
    return false;
  } */

  async addPeerRig(peerId, meta) {
    const m = await metaversefile.import(meta.avatarUrl);
    const app = metaversefile.createApp();
    // app.setAttribute('avatar', true);
    await metaversefile.addModule(app, m);
    
    const {raw} = app;
    const peerRig = new Avatar(raw, {
      fingers: true,
      hair: true,
      visemes: true,
      debug: false,
    });
    peerRig.model = app;
    peerRig.url = meta.avatarUrl;
    
    unFrustumCull(peerRig.model);
    scene.add(peerRig.model);
    
    peerRig.rigCapsule = makeRigCapsule();
    peerRig.rigCapsule.visible = false;
    this.scene.add(peerRig.rigCapsule);
    
    peerRig.textMesh = makeTextMesh(meta.name, undefined, 0.2, 'center', 'middle');
    this.scene.add(peerRig.textMesh);
    
    this.peerRigs.set(peerId, peerRig);
  }

  async removePeerRig(peerId) {
    const peerRig = this.peerRigs.get(peerId);
    peerRig.model.parent.remove(peerRig.model);
    peerRig.textMesh.parent.remove(peerRig.textMesh);
    // peerRig.aux.destroy();
    this.peerRigs.delete(peerId);
  }

  setPeerAvatarName(name, peerId) {
    const peerRig = this.peerRigs.get(peerId);
    peerRig.textMesh.text = name;
    peerRig.textMesh.sync();
  }

  async setPeerAvatarUrl(peerId, url) {
    const oldPeerRig = this.peerRigs.get(peerId);
    await this.setAvatar(oldPeerRig, newPeerRig => {
      this.peerRigs.set(peerId, newPeerRig);
    }, url);
  }

  async setPeerAvatarAux(aux, peerId) {
    const oldPeerRig = this.peerRigs.get(peerId);
    oldPeerRig.aux.setPose(aux);
  }
  
  setLocalMicMediaStream(mediaStream) {
    this.localRig.setMicrophoneMediaStream(mediaStream);
  }

  setPeerMicMediaStream(mediaStream, peerId) {
    const peerRig = this.peerRigs.get(peerId);
    peerRig.setMicrophoneMediaStream(mediaStream);
    this.peerRigs.set(peerId, peerRig);
  }

  getLocalAvatarPose() {
    if (this.localRig) {
      const hmdPosition = this.localRig.inputs.hmd.position.toArray();
      const hmdQuaternion = this.localRig.inputs.hmd.quaternion.toArray();

      const leftGamepadPosition = this.localRig.inputs.leftGamepad.position.toArray();
      const leftGamepadQuaternion = this.localRig.inputs.leftGamepad.quaternion.toArray();
      const leftGamepadPointer = this.localRig.inputs.leftGamepad.pointer;
      const leftGamepadGrip = this.localRig.inputs.leftGamepad.grip;
      const leftGamepadEnabled = this.localRig.inputs.leftGamepad.enabled;

      const rightGamepadPosition = this.localRig.inputs.rightGamepad.position.toArray();
      const rightGamepadQuaternion = this.localRig.inputs.rightGamepad.quaternion.toArray();
      const rightGamepadPointer = this.localRig.inputs.rightGamepad.pointer;
      const rightGamepadGrip = this.localRig.inputs.rightGamepad.grip;
      const rightGamepadEnabled = this.localRig.inputs.rightGamepad.enabled;

      const floorHeight = this.localRig.getFloorHeight();
      const handsEnabled = [this.localRig.getHandEnabled(0), this.localRig.getHandEnabled(1)];
      const topEnabled = this.localRig.getTopEnabled();
      const bottomEnabled = this.localRig.getBottomEnabled();
      const direction = this.localRig.direction.toArray();
      const velocity = this.localRig.velocity.toArray();
      const {
        jumpState,
        jumpTime,
        flyState,
        flyTime,
        useTime,
        useAnimation,
        sitState,
        sitAnimation,
        danceState,
        danceTime,
        danceAnimation,
        throwState,
        throwTime,
        crouchState,
        crouchTime,
      } = this.localRig;

      return [
        [hmdPosition, hmdQuaternion],
        [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled],
        [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled],
        floorHeight,
        handsEnabled,
        topEnabled,
        bottomEnabled,
        direction,
        velocity,
        jumpState,
        jumpTime,
        flyState,
        flyTime,
        useTime,
        useAnimation,
        sitState,
        sitAnimation,
        danceState,
        danceTime,
        danceAnimation,
        throwState,
        throwTime,
        crouchState,
        crouchTime,
      ];
    } else {
      return null;
    }
  }

  /* getPeerAvatarPose(peerId) {
    const peerRig = this.peerRigs.get(peerId);

    const hmdPosition = peerRig.inputs.hmd.position.toArray();
    const hmdQuaternion = peerRig.inputs.hmd.quaternion.toArray();

    const leftGamepadPosition = peerRig.inputs.leftGamepad.position.toArray();
    const leftGamepadQuaternion = peerRig.inputs.leftGamepad.quaternion.toArray();
    const leftGamepadPointer = peerRig.inputs.leftGamepad.pointer;
    const leftGamepadGrip = peerRig.inputs.leftGamepad.grip;

    const rightGamepadPosition = peerRig.inputs.rightGamepad.position.toArray();
    const rightGamepadQuaternion = peerRig.inputs.rightGamepad.quaternion.toArray();
    const rightGamepadPointer = peerRig.inputs.rightGamepad.pointer;
    const rightGamepadGrip = peerRig.inputs.rightGamepad.grip;

    const floorHeight = peerRig.getFloorHeight();
    const topEnabled = peerRig.getTopEnabled();
    const bottomEnabled = peerRig.getBottomEnabled();

    return [
      [hmdPosition, hmdQuaternion],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip],
      floorHeight,
      topEnabled,
      bottomEnabled,
    ];
  } */

  setLocalAvatarPose(poseArray) {
    if (this.localRig) {
      const [
        [hmdPosition, hmdQuaternion],
        [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled],
        [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled],
      ] = poseArray;

      this.localRig.inputs.hmd.position.fromArray(hmdPosition);
      this.localRig.inputs.hmd.quaternion.fromArray(hmdQuaternion);

      this.localRig.inputs.leftGamepad.position.fromArray(leftGamepadPosition);
      this.localRig.inputs.leftGamepad.quaternion.fromArray(leftGamepadQuaternion);
      this.localRig.inputs.leftGamepad.pointer = leftGamepadPointer;
      this.localRig.inputs.leftGamepad.grip = leftGamepadGrip;
      this.localRig.inputs.leftGamepad.enabled = leftGamepadEnabled;

      this.localRig.inputs.rightGamepad.position.fromArray(rightGamepadPosition);
      this.localRig.inputs.rightGamepad.quaternion.fromArray(rightGamepadQuaternion);
      this.localRig.inputs.rightGamepad.pointer = rightGamepadPointer;
      this.localRig.inputs.rightGamepad.grip = rightGamepadGrip;
      this.localRig.inputs.rightGamepad.enabled = rightGamepadEnabled;

      this.localRig.textMesh.position.copy(this.localRig.inputs.hmd.position);
      this.localRig.textMesh.position.y += 0.5;
      this.localRig.textMesh.quaternion.copy(this.localRig.inputs.hmd.quaternion);
      localEuler.setFromQuaternion(camera.quaternion, 'YXZ');
      localEuler.z = 0;
      this.localRig.textMesh.quaternion.setFromEuler(localEuler);
    }
  }

  setPeerAvatarPose(player) {
    const peerRig = this.peerRigs.get(player.id);
    if (peerRig) { 
      const pose = player.pose;
      const {hmd, leftGamepad, rightGamepad} = peerRig.inputs;

      hmd.position.fromArray(pose.position);
      hmd.quaternion.fromArray(pose.quaternion);

      if (pose.extra.length > 0) {
        leftGamepad.position.fromArray(pose.extra[0]);
        leftGamepad.quaternion.fromArray(pose.extra[1]);
        leftGamepad.pointer = pose.extra[2][0];
        leftGamepad.grip = pose.extra[2][1];
        peerRig.setHandEnabled(0, pose.extra[2][2]);

        rightGamepad.position.fromArray(pose.extra[3]);
        rightGamepad.quaternion.fromArray(pose.extra[4]);
        rightGamepad.pointer = pose.extra[5][0];
        rightGamepad.grip = pose.extra[5][1];
        peerRig.setHandEnabled(0, pose.extra[5][2]);

        peerRig.setFloorHeight(pose.extra[6][0]);

        peerRig.setTopEnabled(pose.extra[6][1]);
        peerRig.setBottomEnabled(pose.extra[6][2]);

        peerRig.direction.fromArray(pose.extra[7]);
        peerRig.velocity.fromArray(pose.extra[8]);

        peerRig.jumpState = pose.extra[9][0];
        peerRig.jumpTime = pose.extra[9][1];
        peerRig.flyState = pose.extra[9][2];
        peerRig.flyTime = pose.extra[9][3];
        peerRig.useTime = pose.extra[9][4];
        peerRig.useAnimation = pose.extra[9][5];
        peerRig.sitState = pose.extra[9][6];
        peerRig.sitAnimation = pose.extra[9][7];
        peerRig.danceState = pose.extra[9][8];
        peerRig.danceTime = pose.extra[9][9];
        peerRig.danceAnimation = pose.extra[9][10];
        peerRig.throwState = pose.extra[9][11];
        peerRig.throwTime = pose.extra[9][12];
        peerRig.crouchState = pose.extra[9][13];
        peerRig.crouchTime = pose.extra[9][14];
      }

      /* peerRig.textMesh.position.copy(peerRig.inputs.hmd.position);
      peerRig.textMesh.position.y += 0.5;
      peerRig.textMesh.quaternion.copy(peerRig.inputs.hmd.quaternion);
      localEuler.setFromQuaternion(peerRig.textMesh.quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.y += Math.PI;
      localEuler.z = 0;
      peerRig.textMesh.quaternion.setFromEuler(localEuler); */

      peerRig.rigCapsule.position.copy(peerRig.inputs.hmd.position);
      
      peerRig.volume = player.volume;
    }
  }

  intersectPeerRigs(raycaster) {
    let closestPeerRig = null;
    let closestPeerRigDistance = Infinity;
    for (const peerRig of this.peerRigs.values()) {
      /* console.log('got peer rig', peerRig);
      if (!peerRig.rigCapsule) {
        debugger;
      } */
      localMatrix2.compose(peerRig.inputs.hmd.position, peerRig.inputs.hmd.quaternion, localVector2.set(1, 1, 1));
      localMatrix.compose(raycaster.ray.origin, localQuaternion.setFromUnitVectors(localVector2.set(0, 0, -1), raycaster.ray.direction), localVector3.set(1, 1, 1))
        .premultiply(
          localMatrix3.getInverse(
            localMatrix2
          )
        )
        .decompose(localRaycaster.ray.origin, localQuaternion, localVector2);
      localRaycaster.ray.direction.set(0, 0, -1).applyQuaternion(localQuaternion);
      const intersection = localRaycaster.ray.intersectBox(peerRig.rigCapsule.geometry.boundingBox, localVector);
      if (intersection) {
        const object = peerRig;
        const point = intersection.applyMatrix4(localMatrix2);
        return {
          object,
          point,
          uv: null,
        };
      } else {
        return null;
      }
    }
  }

  unhighlightPeerRigs() {
    for (const peerRig of this.peerRigs.values()) {
      peerRig.rigCapsule.visible = false;
    }
  }

  highlightPeerRig(peerRig) {
    peerRig.rigCapsule.visible = true;
  }
  
  getRigTransforms() {
    if (this.localRig) {
      return [
        {
          position: this.localRig.inputs.leftGamepad.position,
          quaternion: this.localRig.inputs.leftGamepad.quaternion,
        },
        {
          position: this.localRig.inputs.rightGamepad.position,
          quaternion: this.localRig.inputs.rightGamepad.quaternion,
        },
      ];
    } else {
      return [
        {
          position: localVector.set(0, 0, 0),
          quaternion: localQuaternion.set(0, 0, 0, 1),
        },
        {
          position: localVector2.set(0, 0, 0),
          quaternion: localQuaternion2.set(0, 0, 0, 1),
        },
      ];
    }
  }

  update() {
    if (this.localRig && controlsManager.isPossessed()) {
      const now = Date.now();
      const timeDiff = (now - this.lastTimetamp) / 1000;
      
      const renderer = getRenderer();
      const session = renderer.xr.getSession();
      let currentPosition, currentQuaternion;
      if (!session) {
        currentPosition = this.localRig.inputs.hmd.position;
        currentQuaternion = this.localRig.inputs.hmd.quaternion;
      } else {
        currentPosition = localVector.copy(dolly.position).multiplyScalar(4);
        currentQuaternion = this.localRig.inputs.hmd.quaternion;
      }
      const positionDiff = localVector2.copy(this.lastPosition)
        .sub(currentPosition)
        .multiplyScalar(0.1/timeDiff);
      localEuler.setFromQuaternion(currentQuaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      localEuler.y += Math.PI;
      localEuler2.set(-localEuler.x, -localEuler.y, -localEuler.z, localEuler.order);
      positionDiff.applyEuler(localEuler2);
      this.smoothVelocity.lerp(positionDiff, 0.5);
      this.lastPosition.copy(currentPosition);

      const useTime = physicsManager.getUseTime();
      for (let i = 0; i < 2; i++) {
        this.localRig.setHandEnabled(i, !!session || (useTime === -1 && !!appManager.equippedObjects[i]));
      }
      this.localRig.setTopEnabled((!!session && (this.localRig.inputs.leftGamepad.enabled || this.localRig.inputs.rightGamepad.enabled)) || this.localRig.getHandEnabled(0) || this.localRig.getHandEnabled(1) || physicsManager.getGlideState());
      this.localRig.setBottomEnabled(this.localRig.getTopEnabled() && this.smoothVelocity.length() < 0.001 && !physicsManager.getFlyState());
      this.localRig.direction.copy(positionDiff);
      this.localRig.velocity.copy(this.smoothVelocity);
      this.localRig.jumpState = physicsManager.getJumpState();
      this.localRig.jumpTime = physicsManager.getJumpTime();
      this.localRig.flyState = physicsManager.getFlyState();
      this.localRig.flyTime = physicsManager.getFlyTime();
      this.localRig.useTime = useTime;
      const useAnimation = (() => {
        if (appManager.equippedObjects[0]) {
          const components = appManager.equippedObjects[0].getComponents();
          const useComponent = components.find(c => c.type === 'use');
          if (useComponent) {
            return useComponent.useAnimation || null;
          } else {
            return null;
          }
        } else {
          return null;
        }
      })();
      this.localRig.useAnimation = useAnimation;

      this.localRig.update(now, timeDiff);
      // this.localRig.aux.update(now, timeDiff);

      let sitState = false; // this.localRig.aux.sittables.length > 0 && !!this.localRig.aux.sittables[0].model;
      let sitAnimation;
      if (sitState) {
        const sittable = this.localRig.aux.sittables[0];
        const {model, componentIndex} = sittable;
        const component = model.getComponents()[componentIndex];
        const {subtype = 'chair', sitBone = 'Spine', sitOffset = [0, 0, 0], damping} = component;
        physicsManager.setSitController(sittable.model);
        sitAnimation = subtype;
        const spineBone = sittable.model.getObjectByName(sitBone);
        if (spineBone) {
          physicsManager.setSitTarget(spineBone);
        } else {
          physicsManager.setSitTarget(sittable.model);
        }
        physicsManager.setSitOffset(sitOffset);
        if (typeof damping === 'number') {
          physicsManager.setDamping(damping);
        } else {
          physicsManager.setDamping();
        }
      } else {
        sitAnimation = null;
        physicsManager.setDamping();
      }
      const danceState = !!physicsManager.getDanceState();
      const danceTime = physicsManager.getDanceTime();
      const danceAnimation = physicsManager.getDanceState();
      const throwState = physicsManager.getThrowState();
      const throwTime = physicsManager.getThrowTime();
      const crouchState = physicsManager.getCrouchState();
      const crouchTime = physicsManager.getCrouchTime();
      rigManager.localRig.sitState = sitState;
      rigManager.localRig.sitAnimation = sitAnimation;
      rigManager.localRig.danceState = danceState;
      rigManager.localRig.danceTime = danceTime;
      rigManager.localRig.danceAnimation = danceAnimation;
      rigManager.localRig.throwState = throwState;
      rigManager.localRig.throwTime = throwTime;
      rigManager.localRig.crouchState = crouchState;
      rigManager.localRig.crouchTime = crouchTime;
      physicsManager.setSitState(sitState);

      this.peerRigs.forEach(rig => {
        rig.update(now, timeDiff);
        // rig.aux.update(now, timeDiff);
      });
      
      this.lastTimetamp = now;

      /* for (let i = 0; i < appManager.grabs.length; i++) {
        const grab = appManager.grabs[i === 0 ? 1 : 0];
        if (grab) {
          const transforms = this.getRigTransforms();
          const transform = transforms[i];
          grab.position.copy(transform.position);
          grab.quaternion.copy(transform.quaternion);
        }
      } */
    }
  }
}
const rigManager = new RigManager(scene);

export {
  // RigManager,
  rigManager,
};
