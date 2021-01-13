import * as THREE from './three.module.js';
import {rigManager} from './rig.js';
import {renderer, scene, camera, dolly} from './app-object.js';
import {world} from './world.js';
import weaponsManager from './weapons-manager.js';
import physicsManager from './physics-manager.js';
import minimap from './minimap.js';
import cameraManager from './camera-manager.js';
import {makeTextMesh} from './vr-ui.js';
import {parseQuery} from './util.js';
import {homeScnUrl} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localBox = new THREE.Box3();
const localBox2 = new THREE.Box3();
const localObject = new THREE.Object3D();

const warpMesh = (() => {
  const boxGeometry = new THREE.BoxBufferGeometry(0.1, 0.1, 1);
  const numBoxes = 3000;
  const scale = 50;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(boxGeometry.attributes.position.array.length * numBoxes), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(boxGeometry.attributes.uv.array.length * numBoxes), 2));
  geometry.setAttribute('offset', new THREE.BufferAttribute(new Float32Array(boxGeometry.attributes.position.array.length * numBoxes), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(boxGeometry.index.array.length * numBoxes), 1));
  for (let i = 0; i < numBoxes; i++) {
    geometry.attributes.position.array.set(boxGeometry.attributes.position.array, i * boxGeometry.attributes.position.array.length);
    geometry.attributes.uv.array.set(boxGeometry.attributes.uv.array, i * boxGeometry.attributes.uv.array.length);
    
    for (let j = 0; j < boxGeometry.index.array.length; j++) {
      geometry.index.array[i * boxGeometry.index.array.length + j] = boxGeometry.index.array[j] + i * boxGeometry.attributes.position.array.length/3;
    }

    const offset = new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2)
      .multiplyScalar(scale);
    for (let j = 0; j < boxGeometry.attributes.position.array.length; j += 3) {
      offset.toArray(geometry.attributes.offset.array, i * boxGeometry.attributes.position.array.length + j);
    }
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.uv.needsUpdate = true;
  geometry.attributes.offset.needsUpdate = true;
  geometry.index.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      attribute vec3 offset;
      // varying vec2 vUv;
      uniform float uTime;

      void main() {
        // vUv = uv;
        vec3 p = offset;
        p.z = mod(p.z + uTime * ${(scale*2).toFixed(8)}, ${(scale*2).toFixed(8)}) - ${scale.toFixed(8)};
        p += position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `\
      // uniform vec3 color1;
      // uniform vec3 color2;
      // uniform float numPoints;

      // varying vec2 vUv;

      void main() {
        // vec3 c = mix(color1, color2, vUv.y/numPoints);
        gl_FragColor = vec4(${new THREE.Color(0x111111).toArray().join(', ')}, 0.2);
      }
    `,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  window.mesh = mesh;
  mesh.frustumCulled = false;
  return mesh;
})();
warpMesh.visible = false;
scene.add(warpMesh);

let currentWorld = null;
const _getCurrentCoord = (p, v) => v.set(
  Math.floor(p.x),
  Math.floor(p.y),
  Math.floor(p.z),
);
const clearWorld = () => {
  const staticObjects = world.getStaticObjects();
  for (const object of staticObjects) {
    world.removeStaticObject(object.instanceId);
  }
  const objects = world.getObjects();
  for (const object of objects) {
    world.removeObject(object.instanceId);
  }
};
const update = () => {
  if (warpMesh.visible) {
    warpMesh.material.uniforms.uTime.value = (Date.now() % 2000) / 2000;
    warpMesh.material.uniforms.uTime.needsUpdate = true;
  }
};
/* const _invertGeometry = geometry => {
  for (let i = 0; i < geometry.index.array.length; i += 3) {
    const tmp = geometry.index.array[i];
    geometry.index.array[i] = geometry.index.array[i+1];
    geometry.index.array[i+1] = tmp;
  }
  return geometry;
}; */
const enterWorld = async worldSpec => {
  let warpPhysicsId;
  const _pre = () => {
    if (currentWorld) {
      warpMesh.visible = true;

      if (worldSpec.extents) {
        localBox.set(
          localVector.fromArray(worldSpec.extents[0]),
          localVector2.fromArray(worldSpec.extents[1]),
        );
      } else {
        localBox.set(
          localVector.set(-2, 0, -2),
          localVector2.set(2, 4, 2),
        );
      }
      const parcelAABB = localBox;
      // const center = parcelAABB.getCenter(localVector);
      // const size = parcelAABB.getSize(localVector2);
      // console.log('got center size', center.toArray(), size.toArray());

      /* const geometry = _invertGeometry(
        new THREE.BoxBufferGeometry(size.x, size.y, size.z)
          .applyMatrix4(new THREE.Matrix4().makeTranslation(center.x, center.y, center.z))
      ); */
      const geometry = new THREE.BoxBufferGeometry(1000, 1, 1000);
      const mesh = new THREE.Mesh(geometry, new THREE.Material({
        color: 0x1111111,
      }));
      mesh.position.set(0, -1/2, 0);
      warpPhysicsId = physicsManager.addGeometry(mesh);

      /* const _containAvatar = () => {
        physicsManager.getAvatarWorldObject(localObject);
        physicsManager.getAvatarCapsule(localVector);
        localVector.add(localObject.position);
        const avatarAABB = localBox2.set(
          localVector2.copy(localVector)
            .add(localVector4.set(-localVector.radius, -localVector.radius - localVector.halfHeight, -localVector.radius)),
          localVector3.copy(localVector)
            .add(localVector4.set(localVector.radius, localVector.radius + localVector.halfHeight, localVector.radius)),
        );
        localVector.setScalar(0);
        let changed = false;
        if (avatarAABB.min.x < parcelAABB.min.x) {
          const dx = parcelAABB.min.x - avatarAABB.min.x;
          localVector.x += dx;
          avatarAABB.min.x += dx;
          avatarAABB.max.x += dx;
          changed = true;
        }
        if (avatarAABB.max.x > parcelAABB.max.x) {
          const dx = avatarAABB.max.x - parcelAABB.max.x;
          localVector.x -= dx;
          avatarAABB.min.x -= dx;
          avatarAABB.max.x -= dx;
          changed = true;
        }
        if (avatarAABB.min.y < parcelAABB.min.y) {
          const dy = parcelAABB.min.y - avatarAABB.min.y;
          localVector.y += dy;
          avatarAABB.min.y += dy;
          avatarAABB.max.y += dy;
          changed = true;
        }
        if (avatarAABB.max.y > parcelAABB.max.y) {
          const dy = avatarAABB.max.y - parcelAABB.max.y;
          localVector.y -= dy;
          avatarAABB.min.y -= dy;
          avatarAABB.max.y -= dy;
          changed = true;
        }
        if (avatarAABB.min.z < parcelAABB.min.z) {
          const dz = parcelAABB.min.z - avatarAABB.min.z;
          localVector.z += dz;
          avatarAABB.min.z += dz;
          avatarAABB.max.z += dz;
          changed = true;
        }
        if (avatarAABB.max.z > parcelAABB.max.z) {
          const dz = avatarAABB.max.z - parcelAABB.max.z;
          localVector.z -= dz;
          avatarAABB.min.z -= dz;
          avatarAABB.max.z -= dz;
          changed = true;
        }
        if (changed) {
          if (renderer.xr.getSession()) {
            dolly.position.add(localVector);
          } else {
            camera.position.add(localVector);
            localVector.copy(physicsManager.getAvatarCameraOffset());

            localVector.applyQuaternion(camera.quaternion);

            camera.position.sub(localVector);
            camera.updateMatrixWorld();
          }
        }
      };
      _containAvatar(); */
    };
  };
  _pre();

  world.disconnectRoom();

  const _doLoad = async () => {
    clearWorld();

    let {objects, room} = worldSpec;
    const promises = [];
    if (worldSpec.default) {
      const res = await fetch(homeScnUrl);
      const homeScn = await res.json();
      objects = homeScn.objects;
    }
    {
      const dynamic = !room;
      for (const object of objects) {
        if (object.dynamic) {
          object.dynamic = dynamic;
        }
      }
    }
    {
      const ps = objects.map(async object => {
        let {start_url, position, quaternion, physics, physics_url, dynamic} = object;
        if (position) {
          position = new THREE.Vector3().fromArray(position);
        }
        if (quaternion) {
          quaternion = new THREE.Quaternion().fromArray(quaternion);
        }
        await world[dynamic ? 'addObject' : 'addStaticObject'](start_url, null, position, quaternion, {
          physics,
          physics_url,
        });
      });
      promises.push.apply(promises, ps);
    }
    if (room) {
      const p = (async () => {
        const u = `https://worlds.exokit.org/${room}`;
        const res = await fetch(u);
        let j;
        if (res.status === 404) {
          const res2 = await fetch(u, {
            method: 'POST',
          });
          j = await res2.json();
          j = j.result;
        } else if (res.ok) {
          j = await res.json();
          j = j.result;
        } else {
          throw new Error('failed to connect to server: ' + res.status);
        }
        const {publicIp, privateIp, port} = j;
        await world.connectRoom(room, `worlds.exokit.org:${port}`);
      })();
      promises.push(p);
    }
    
    await Promise.all(promises);

    // world.initializeIfEmpty(universeSpecs.initialScene);
  };
  _doLoad().catch(console.warn);

  const _post = () => {
    if (currentWorld) {
      setTimeout(() => {
        warpMesh.visible = false;

        physicsManager.removeGeometry(warpPhysicsId);
      }, 3000);
    }
  };
  _post();

  currentWorld = worldSpec;
};
const pushUrl = async u => {
  history.pushState({}, '', u);
  await handleUrlUpdate();
};
const handleUrlUpdate = async () => {
  const q = parseQuery(location.search);
  const worldJson = await world.getWorldJson(q.u);
  if (q.r) {
    worldJson.room = q.r;
  }

  await enterWorld(worldJson);
};
window.addEventListener('popstate', e => {
  handleUrlUpdate().catch(console.warn);
});

export {
  update,
  enterWorld,
  pushUrl,
  handleUrlUpdate,
};
