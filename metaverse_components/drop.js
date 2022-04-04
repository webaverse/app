import * as THREE from 'three';
import metaversefile from 'metaversefile';
// import Avatar from './avatars/avatars.js';
import {world} from '../world.js';
import physicsManager from '../physics-manager.js';
import {glowMaterial} from '../shaders.js';
import easing from '../easing.js';
import {rarityColors} from '../constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();

const rarityColorsArray = Object.keys(rarityColors).map(k => rarityColors[k][0]);
const cubicBezier = easing(0, 1, 0, 1);
const cubicBezier2 = easing(0, 1, 1, 1);
const gracePickupTime = 1000;

export default app => {
  // console.log('call default component', new Error().stack);

  const localPlayer = metaversefile.useLocalPlayer();

  const dropComponent = app.getComponent('drop');
  if (dropComponent) {
    const glowHeight = 5;
    const glowGeometry = new THREE.CylinderBufferGeometry(0.01, 0.01, glowHeight)
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, glowHeight/2, 0));
    const colors = new Float32Array(glowGeometry.attributes.position.array.length);
    glowGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const color = new THREE.Color(rarityColorsArray[Math.floor(Math.random() * rarityColorsArray.length)]);
    for (let i = 0; i < glowGeometry.attributes.color.array.length; i += 3) {
      color.toArray(glowGeometry.attributes.color.array, i);
    }
    const material = glowMaterial.clone();
    const glowMesh = new THREE.Mesh(glowGeometry, material);
    app.add(glowMesh);

    const velocity = dropComponent.velocity ? new THREE.Vector3().fromArray(dropComponent.velocity) : new THREE.Vector3();
    const angularVelocity = dropComponent.angularVelocity ? new THREE.Vector3().fromArray(dropComponent.angularVelocity) : new THREE.Vector3();
    let grounded = false;
    const startTime = performance.now();
    let animation = null;
    const timeOffset = Math.random() * 10;
    const frame = metaversefile.useFrame(e => {
      const {timestamp, timeDiff} = e;
      const timeDiffS = timeDiff/1000;
      const dropComponent = app.getComponent('drop');
      if (!grounded) {
        app.position
          .add(
            localVector.copy(velocity)
              .multiplyScalar(timeDiffS)
          );
        velocity.add(
          localVector.copy(physicsManager.getGravity())
            .multiplyScalar(timeDiffS)
        );
        
        const groundHeight = 0.1;
        if (app.position.y <= groundHeight) {
          app.position.y = groundHeight;
          const newDrop = JSON.parse(JSON.stringify(dropComponent));
          velocity.set(0, 0, 0);
          newDrop.velocity = velocity.toArray();
          app.setComponent('drop', newDrop);
          grounded = true;
        }
      }
      // if (grounded) {
        app.rotation.y += angularVelocity.y * timeDiff;
      // }
      
      glowMesh.visible = !animation;
      if (!animation) {
        localPlayer.avatar.modelBoneOutputs.Head.getWorldPosition(localVector);
        localVector.y = 0;
        const distance = localVector.distanceTo(app.position);
        if (distance < 1) {
          // console.log('check 1');
          const timeSinceStart = timestamp - startTime;
          if (timeSinceStart > gracePickupTime) {
            // console.log('check 2');
            animation = {
              startPosition: app.position.clone(),
              startTime: timestamp,
              endTime: timestamp + 1000,
            };
          }
        }
      }
      if (animation) {
        const headOffset = 0.5;
        const bodyOffset = -0.3;
        const tailTimeFactorCutoff = 0.8;
        const timeDiff = timestamp - animation.startTime;
        const timeFactor = Math.min(Math.max(timeDiff / (animation.endTime - animation.startTime), 0), 1);
        if (timeFactor < 1) {
          if (timeFactor < tailTimeFactorCutoff) {
            const f = cubicBezier(timeFactor);
            localPlayer.avatar.modelBoneOutputs.Head.getWorldPosition(localVector)
              .add(localVector2.set(0, headOffset, 0));
            app.position.copy(animation.startPosition).lerp(localVector, f);
          } else {
            {
              const f = cubicBezier(tailTimeFactorCutoff);
              localPlayer.avatar.modelBoneOutputs.Head.getWorldPosition(localVector)
                .add(localVector2.set(0, headOffset, 0));
              app.position.copy(animation.startPosition).lerp(localVector, f);
            }
            {
              const tailTimeFactor = (timeFactor - tailTimeFactorCutoff) / (1 - tailTimeFactorCutoff);
              const f = cubicBezier2(tailTimeFactor);
              localPlayer.avatar.modelBoneOutputs.Head.getWorldPosition(localVector)
                .add(localVector2.set(0, bodyOffset, 0));
              app.position.lerp(localVector, f);
              app.scale.setScalar(1 - tailTimeFactor);
            }
          }
        } else {
          world.appManager.dispatchEvent(new MessageEvent('pickup', {
            data: {
              app,
            },
          }));
          world.appManager.removeApp(app);
          app.destroy();
        }
      }
      
      app.updateMatrixWorld();
    });
  }

  return {
    remove() {
      metaversefile.clearFrame(frame);
    },
  };
};