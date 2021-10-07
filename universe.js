import * as THREE from 'three';
import {rigManager} from './rig.js';
import {getRenderer, scene, camera, dolly} from './app-object.js';
import {world} from './world.js';
import weaponsManager from './weapons-manager.js';
import physicsManager from './physics-manager.js';
import minimap from './minimap.js';
import cameraManager from './camera-manager.js';
import geometryManager from './geometry-manager.js';
import {makeTextMesh} from './vr-ui.js';
import {parseQuery, parseCoord} from './util.js';
import {arrowGeometry, arrowMaterial} from './shaders.js';
import {landHost, worldUrl} from './constants.js';
import metaversefile from './metaversefile-api.js';
import sceneNames from './scenes/scenes.json';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localBox = new THREE.Box3();
const localBox2 = new THREE.Box3();
const localObject = new THREE.Object3D();

let arrowMesh = null;
const bindInterface = () => {
  const q = parseQuery(location.search);
  const coord = parseCoord(q.c);
  if (coord) {
    arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial.clone());
    arrowMesh.position.copy(coord).add(new THREE.Vector3(0, 2, 0));
    arrowMesh.frustumCulled = false;
    scene.add(arrowMesh);
  }
};

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
const update = () => {
  if (arrowMesh) {
    arrowMesh.material.uniforms.uTime.value = (Date.now()%1500)/1500;
    arrowMesh.material.uniforms.uTime.needsUpdate = true;
  }
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
/* const getParcels = async () => {
  const res = await fetch(`${landHost}/1-100`);
  if (res.ok) {
    const j = await res.json();
    return j;
  } else {
    return [];
  }
}; */
const getWorldsHost = () => window.location.protocol + '//' + window.location.hostname + ':' +
  ((window.location.port ? parseInt(window.location.port, 10) : (window.location.protocol === 'https:' ? 443 : 80)) + 1) + '/';
const enterWorld = async worldSpec => {
  await geometryManager.waitForLoad();
  
  /* let warpPhysicsId;
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

      warpPhysicsId = physicsManager.addBoxGeometry(new THREE.Vector3(0, -1, 0), new THREE.Quaternion(), new THREE.Vector3(1000, 1, 1000), false);

      const _containAvatar = () => {
        physicsManager.getAvatarWorldObject(localObject);
        physicsManager.getAvatarCapsule(localVector);
        localVector.add(localObject.position);
        const avatarAABB = localBox2.set(
          localVector2.copy(localVector)
            .add(localVector4.set(-localVector.radius, -localVector.radius - localVector.halfHeight, -localVector.radius)),
          localVector3.copy(localVector)
            .add(localVector4.set(localVector.radius, localVector.radius + localVector.halfHeight, localVector.radius)),
        );

        avatarAABB.getCenter(localVector2);
        const offset = localVector.set(-localVector2.x, -localVector2.y, -localVector2.z);

        const renderer = getRenderer();
        if (renderer.xr.getSession()) {
          dolly.position.add(offset);
        } else {
          camera.position.add(offset);

          localVector2
            .copy(physicsManager.getAvatarCameraOffset())
            .applyQuaternion(camera.quaternion);

          camera.position.sub(localVector2);
          camera.updateMatrixWorld();
        }
      };
      _containAvatar();
    };
  };
  _pre(); */

  world.disconnectRoom();
  
  const localPlayer = metaversefile.useLocalPlayer();
  localPlayer.teleportTo(new THREE.Vector3(0, 1.5, 0), camera.quaternion, {
    relation: 'float',
  });
  physicsManager.setPhysicsEnabled(true);
  physicsManager.update(0);
  physicsManager.velocity.set(0, 0, 0);
  physicsManager.setPhysicsEnabled(false);

  const _doLoad = async () => {
    world.clear();

    const promises = [];

    let {src, room} = worldSpec;
    if (!room) {
      if (src === undefined) {
        promises.push(metaversefile.load('./scenes/' + sceneNames[0]));
      } else if (src === '') {
        // nothing
      } else {
        promises.push(metaversefile.load(src));
      }
    } else {
      const p = (async () => {
        const roomUrl = getWorldsHost() +  room;
        await world.connectRoom(roomUrl);
      })();
      promises.push(p);
    }
    
    await Promise.all(promises);

    // world.initializeIfEmpty(universeSpecs.initialScene);
  };
  await _doLoad().catch(err => {
    console.warn(err);
  });
  physicsManager.setPhysicsEnabled(true);
  physicsManager.update(0);
  physicsManager.velocity.set(0, 0, 0);

  currentWorld = worldSpec;
};
const reload = async () => {
  await enterWorld(currentWorld);
};
/* const bootstrapFromUrl = async urlSpec => {
  const q = parseQuery(urlSpec.search);
  if (q.src === undefined) {
    q.src = homeScnUrl;
  }
  await enterWorld(q);
}; */
const pushUrl = async u => {
  history.pushState({}, '', u);
  window.dispatchEvent(new MessageEvent('pushstate'));
  await handleUrlUpdate();
};
const handleUrlUpdate = async () => {
  const q = parseQuery(location.search);
  // const worldJson = await world.getWorldJson(q);
  await enterWorld(q);
};

export {
  bindInterface,
  update,
  // getParcels,
  enterWorld,
  reload,
  getWorldsHost,
  // bootstrapFromUrl,
  pushUrl,
  handleUrlUpdate,
};
