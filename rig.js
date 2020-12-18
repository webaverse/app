import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import {BufferGeometryUtils} from './BufferGeometryUtils.js';
// import {MeshLine, MeshLineMaterial} from './MeshLine.js';
import cameraManager from './camera-manager.js';
import {makeTextMesh, makeRigCapsule} from './vr-ui.js';
import {makePromise, /*WaitQueue, */downloadFile} from './util.js';
import {appManager, renderer, scene, camera, dolly} from './app-object.js';
import {loginManager} from './login.js';
import runtime from './runtime.js';
import Avatar from './avatars/avatars.js';
import physicsManager from './physics-manager.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localEuler2 = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localRaycaster = new THREE.Raycaster();

class RigManager {
  constructor(scene) {
    this.scene = scene;

    this.localRig = new Avatar(null, {
      fingers: true,
      hair: true,
      visemes: true,
      debug: true,
    });
    scene.add(this.localRig.model);

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
    }
    {
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
      const material2 = new THREE.LineBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const nametagMesh2 = new THREE.Mesh(geometry, material2);
      this.localRig.textMesh.add(nametagMesh2);
    }
    this.scene.add(this.localRig.textMesh);

    this.localRigMatrix = new THREE.Matrix4();
    this.localRigMatrixEnabled = false;
    
    this.lastPosition = new THREE.Vector3();
    this.smoothVelocity = new THREE.Vector3();

    this.peerRigs = new Map();

    const _bindLogin = async () => {
      await loginManager.waitForLoad();

      const username = loginManager.getUsername() || 'Anonymous';
      const avatarImage = loginManager.getAvatarPreview();
      rigManager.setLocalAvatarName(username);

      loginManager.addEventListener('usernamechange', e => {
        const username = e.data || 'Anonymous';
        if (username !== rigManager.localRig.textMesh.text) {
          rigManager.setLocalAvatarName(username);

          /* const {menu} = getState();
          menu.username = username;
          setState({
            menu,
          }); */
        }
      });

      const avatar = loginManager.getAvatar();
      if (avatar.url) {
        rigManager.setLocalAvatarUrl(avatar.url, avatar.filename);
      }
      if (avatar.preview) {
        rigManager.setLocalAvatarImage(avatar.preview);
      }
      loginManager.addEventListener('avatarchange', e => {
        const avatar = e.data;
        const newAvatarUrl = avatar ? avatar.url : null;
        if (newAvatarUrl !== rigManager.localRig.avatarUrl) {
          rigManager.setLocalAvatarUrl(newAvatarUrl, avatar.filename);
          rigManager.setLocalAvatarImage(avatar.preview);

          /* const {menu} = getState();
          menu.avatarUrl = avatar.url;
          menu.avatarFileName = avatar.filename;
          menu.avatarPreview = avatar.preview;
          setState({
            menu,
          }); */
        }
      });

      /* const {menu} = getState();
      menu.username = username;
      menu.avatarUrl = avatar.url;
      menu.avatarFileName = avatar.filename;
      menu.avatarPreview = avatar.preview;
      setState({
        menu,
      }); */
    };
    _bindLogin().catch(err => {
      console.warn(err);
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

    this.localRig.textMesh.avatarMesh = avatarMesh;
    this.localRig.textMesh.add(avatarMesh);
  }

  async setLocalAvatarUrl(url, filename) {
    // await this.localRigQueue.lock();

    await this.setAvatar(this.localRig, newLocalRig => {
      this.localRig = newLocalRig;
    }, url, filename);

    // await this.localRigQueue.unlock();
  }

  async setAvatar(oldRig, setRig, url, filename) {
    if (oldRig.url !== url) {
      oldRig.url = url;

      let o;
      if (url) {
        o = await runtime.loadFile({
          url,
          name: filename,
        });
        o.run && o.run();
      }

      if (oldRig.url === url) {
        oldRig.model.parent.remove(oldRig.model);

        let localRig;
        if (o) {
          if (o.raw) {
            localRig = new Avatar(o.raw, {
              fingers: true,
              hair: true,
              visemes: true,
              debug: false //!o,
            });
          } else {
            localRig = new Avatar();
            localRig.model = o;
            localRig.update = () => {
              localRig.model.position.copy(localRig.inputs.hmd.position);
              localRig.model.quaternion.copy(localRig.inputs.hmd.quaternion);
            };
          }
        } else {
          localRig = new Avatar(null, {
            fingers: true,
            hair: true,
            visemes: true,
            debug: true,
          });
        }
        scene.add(localRig.model);
        localRig.textMesh = oldRig.textMesh;
        localRig.avatarUrl = oldRig.url;
        localRig.rigCapsule = oldRig.rigCapsule;

        setRig(localRig);
      }
    }
  }
  
  isPeerRig(rig) {
    for (const peerRig of this.peerRigs.values()) {
      if (peerRig === rig) {
        return true;
      }
    }
    return false;
  }

  async addPeerRig(peerId) {
    const peerRig = new Avatar(null, {
      fingers: true,
      hair: true,
      visemes: true,
      debug: true
      // decapitate: selectedTool === 'firstperson',
    });
    this.scene.add(peerRig.model);

    peerRig.textMesh = makeTextMesh('Anonymous', undefined, 0.2, 'center', 'middle');
    this.scene.add(peerRig.textMesh);

    peerRig.avatarUrl = null;

    peerRig.rigCapsule = makeRigCapsule();
    peerRig.rigCapsule.visible = false;
    this.scene.add(peerRig.rigCapsule);

    this.peerRigs.set(peerId, peerRig);
  }

  async removePeerRig(peerId) {
    const peerRig = this.peerRigs.get(peerId);
    peerRig.model.parent.remove(peerRig.model);
    peerRig.textMesh.parent.remove(peerRig.textMesh);
    this.peerRigs.delete(peerId);
  }

  setPeerAvatarName(name, peerId) {
    const peerRig = this.peerRigs.get(peerId);
    peerRig.textMesh.text = name;
    peerRig.textMesh.sync();
  }

  async setPeerAvatarUrl(url, filename, peerId) {
    // await this.peerRigQueue.lock();

    const oldPeerRig = this.peerRigs.get(peerId);
    await this.setAvatar(oldPeerRig, newPeerRig => {
      this.peerRigs.set(peerId, newPeerRig);
    }, url, filename);

    // await this.peerRigQueue.unlock();
  }

  setPeerMicMediaStream(mediaStream, peerId) {
    const peerRig = this.peerRigs.get(peerId);
    peerRig.setMicrophoneMediaStream(mediaStream);
    this.peerRigs.set(peerId, peerRig);
  }

  getLocalAvatarPose() {
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
    const topEnabled = this.localRig.getTopEnabled();
    const bottomEnabled = this.localRig.getBottomEnabled();
    const direction = this.localRig.direction.toArray();
    const velocity = this.localRig.velocity.toArray();
    const {
      jumpState,
      jumpStartTime,
      flyState,
      flyStartTime,
    } = this.localRig;

    return [
      [hmdPosition, hmdQuaternion],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled],
      floorHeight,
      topEnabled,
      bottomEnabled,
      direction,
      velocity,
      jumpState,
      jumpStartTime,
      flyState,
      flyStartTime,
    ];
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

  setPeerAvatarPose(poseArray, peerId) {
    const [
      [hmdPosition, hmdQuaternion],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled],
      floorHeight,
      topEnabled,
      bottomEnabled,
      direction,
      velocity,
      jumpState,
      jumpStartTime,
      flyState,
      flyStartTime,
    ] = poseArray;

    const peerRig = this.peerRigs.get(peerId);

    if (peerRig) {
      peerRig.inputs.hmd.position.fromArray(hmdPosition);
      peerRig.inputs.hmd.quaternion.fromArray(hmdQuaternion);

      peerRig.inputs.leftGamepad.position.fromArray(leftGamepadPosition);
      peerRig.inputs.leftGamepad.quaternion.fromArray(leftGamepadQuaternion);
      peerRig.inputs.leftGamepad.pointer = leftGamepadPointer;
      peerRig.inputs.leftGamepad.grip = leftGamepadGrip;

      peerRig.inputs.rightGamepad.position.fromArray(rightGamepadPosition);
      peerRig.inputs.rightGamepad.quaternion.fromArray(rightGamepadQuaternion);
      peerRig.inputs.rightGamepad.pointer = rightGamepadPointer;
      peerRig.inputs.rightGamepad.grip = rightGamepadGrip;

      peerRig.setFloorHeight(floorHeight);
      peerRig.setTopEnabled(topEnabled);
      peerRig.setBottomEnabled(bottomEnabled);
      peerRig.direction.fromArray(direction);
      peerRig.velocity.fromArray(velocity);
      peerRig.jumpState = jumpState;
      peerRig.jumpStartTime = jumpStartTime;
      peerRig.flyState = flyState;
      peerRig.flyStartTime = flyStartTime;

      peerRig.textMesh.position.copy(peerRig.inputs.hmd.position);
      peerRig.textMesh.position.y += 0.5;
      peerRig.textMesh.quaternion.copy(peerRig.inputs.hmd.quaternion);
      localEuler.setFromQuaternion(peerRig.textMesh.quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.y += Math.PI;
      localEuler.z = 0;
      peerRig.textMesh.quaternion.setFromEuler(localEuler);

      peerRig.rigCapsule.position.copy(peerRig.inputs.hmd.position);
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
  }

  update() {
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
      .multiplyScalar(10);
    localEuler.setFromQuaternion(currentQuaternion, 'YXZ');
    localEuler.x = 0;
    localEuler.z = 0;
    localEuler.y += Math.PI;
    localEuler2.set(-localEuler.x, -localEuler.y, -localEuler.z, localEuler.order);
    positionDiff.applyEuler(localEuler2);
    this.smoothVelocity.lerp(positionDiff, 0.5);
    this.lastPosition.copy(currentPosition);

    this.localRig.setTopEnabled((!!session && (this.localRig.inputs.leftGamepad.enabled || this.localRig.inputs.rightGamepad.enabled)) || !!appManager.grabbedObjects[0] || physicsManager.getGlideState());
    this.localRig.setBottomEnabled(this.localRig.getTopEnabled() && this.smoothVelocity.length() < 0.001 && !physicsManager.getFlyState());
    this.localRig.direction.copy(positionDiff);
    this.localRig.velocity.copy(this.smoothVelocity);
    this.localRig.jumpState = physicsManager.getJumpState();
    this.localRig.jumpStartTime = physicsManager.getJumpStartTime();
    this.localRig.flyState = physicsManager.getFlyState();
    this.localRig.flyStartTime = physicsManager.getFlyStartTime();
    this.localRig.update();
    this.peerRigs.forEach(rig => {
      rig.update();
    });

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
const rigManager = new RigManager(scene);

export {
  // RigManager,
  rigManager,
};
