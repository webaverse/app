import * as THREE from './three.module.js';
import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import {rigManager} from './rig.js';
import {renderer, scene, camera, dolly} from './app-object.js';
import {world} from './world.js';
import {GuardianMesh} from './land.js';
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

const blueColor = 0x42a5f5;
const greenColor = 0xaed581;

/* const _makeLabelMesh = text => {
  const w = 2;
  const h = 0.3;
  const textMesh = makeTextMesh(text, undefined, h, 'center', 'middle');
  textMesh.color = 0xFFFFFF;
  textMesh.sync();
  {
    const geometry = new THREE.CircleBufferGeometry(h/2, 32);
    const img = new Image();
    img.src = `assets/logo-circle.svg`;
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
    avatarMesh.position.x = -w/2;
    avatarMesh.position.y = -0.02;
    textMesh.add(avatarMesh);
  }
  {
    const roundedRectShape = new THREE.Shape();
    ( function roundedRect( ctx, x, y, width, height, radius ) {
      ctx.moveTo( x, y + radius );
      ctx.lineTo( x, y + height - radius );
      ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
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
    };
    const geometry = BufferGeometryUtils.mergeBufferGeometries([
      new THREE.CircleBufferGeometry(0.13, 32)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-w/2, -0.02, -0.01)).toNonIndexed(),
      new THREE.ExtrudeBufferGeometry( roundedRectShape, extrudeSettings )
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-w/2, -h/2 - 0.02, -0.02)),
    ]);
    const material2 = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const nametagMesh2 = new THREE.Mesh(geometry, material2);
    textMesh.add(nametagMesh2);
  }
  return textMesh;
};
const worldObjects = universeSpecs.parcels.map(spec => {
  const guardianMesh = GuardianMesh(spec.extents, blueColor);
  guardianMesh.name = spec.name;
  guardianMesh.extents = spec.extents;
  const worldObject = minimap.addWorld(spec.extents);
  guardianMesh.worldObject = worldObject;
  scene.add(guardianMesh);

  const labelMesh = _makeLabelMesh(spec.name);
  labelMesh.position.x = (spec.extents[0]+spec.extents[3])/2;
  labelMesh.position.y = spec.extents[4] + 1;
  labelMesh.position.z = (spec.extents[2]+spec.extents[5])/2;
  guardianMesh.add(labelMesh);

  return guardianMesh;
}); */

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
// let highlightedWorld = null;
// let animation = null;
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
/* const loadDefaultWorld = async () => {
  const res = await fetch(homeScnUrl);
  const homeScn = await res.json();
  await Promise.all(homeScn.objects.map(async objectSpec => {
    const position = objectSpec.position ? new THREE.Vector3().fromArray(objectSpec.position) : new THREE.Vector3();
    const quaternion = objectSpec.quaternion ? new THREE.Quaternion().fromArray(objectSpec.quaternion) : new THREE.Quaternion();
    // const scale = objectSpec.scale ? new THREE.Vector3().fromArray(objectSpec.scale) : new THREE.Vector3();
    const {physics, physics_url, dynamic} = objectSpec;
    await world[dynamic ? 'addObject' : 'addStaticObject'](objectSpec.start_url, null, position, quaternion, {
      physics,
      physics_url,
    });
  }));
}; */
const update = () => {
  /* const oldWorld = highlightedWorld;

  const _parseParcelSpec = spec => localBox.set(localVector.fromArray(spec.extents, 0), localVector2.fromArray(spec.extents, 3));
  const intersectionIndex = universeSpecs.parcels.findIndex(spec =>
  	_parseParcelSpec(spec)
  	  .containsPoint(rigManager.localRig.inputs.hmd.position)
  );
  const intersection = universeSpecs.parcels[intersectionIndex];
  if (intersection) {
    highlightedWorld = worldObjects[intersectionIndex];
  } else {
  	highlightedWorld = null;
  } */

  /* if (highlightedWorld !== oldWorld) {
    const objects = world.getObjects();
    for (const object of objects) {
      world.removeObject(object.instanceId);
    }

    if (highlightedWorld) {
      const u = `https://avaer.github.io/physicscube/index.js`;
      const center = _parseUniverseSpec(intersection).getCenter(localVector);
      world.addObject(u, null, center, new THREE.Quaternion());
    }
  } */

  /* for (const worldObject of worldObjects) {
    worldObject.material.uniforms.uColor.value.setHex(blueColor);
  }
  if (highlightedWorld) {
  	highlightedWorld.material.uniforms.uColor.value.setHex(greenColor);
  } */

  // _getCurrentCoord(rigManager.localRig.inputs.hmd.position, localVector);
  // weaponsManager.setWorld(localVector, highlightedWorld);

  /* if (animation) {
    const now = Date.now();
    let f = Math.min((now - animation.startTime) / (animation.endTime - animation.startTime), 1);
    const initialF = f;
    if (f < 0.5) {
      f *= 2;
      f = 1-f;
    } else {
      f -= 0.5;
      f *= 2;
    }
    const v = animation.startValue*(1-f) + animation.endValue*f;
    renderer.domElement.style.filter = `brightness(${v})`;
    if (initialF >= 0.5 && animation.onmid) {
      animation.onmid();
      animation.onmid = null;
    }
    if (initialF >= 1) {
      renderer.domElement.style.filter = null;
      animation = null;
    }
  } */

  if (warpMesh.visible) {
    warpMesh.material.uniforms.uTime.value = (Date.now() % 2000) / 2000;
    warpMesh.material.uniforms.uTime.needsUpdate = true;
  }
};
const _invertGeometry = geometry => {
  for (let i = 0; i < geometry.index.array.length; i += 3) {
    const tmp = geometry.index.array[i];
    geometry.index.array[i] = geometry.index.array[i+1];
    geometry.index.array[i+1] = tmp;
  }
  return geometry;
};
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
      const center = parcelAABB.getCenter(localVector);
      const size = parcelAABB.getSize(localVector2);
      // console.log('got center size', center.toArray(), size.toArray());

      const geometry = _invertGeometry(
        new THREE.BoxBufferGeometry(size.x, size.y, size.z)
          .applyMatrix4(new THREE.Matrix4().makeTranslation(center.x, center.y, center.z))
      );
      const mesh = new THREE.Mesh(geometry, new THREE.Material({
        color: 0x1111111,
      }));
      warpPhysicsId = physicsManager.addGeometry(mesh);

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

            // const selectedTool = cameraManager.getMode();
            // if (selectedTool !== 'birdseye') {
              localVector.applyQuaternion(camera.quaternion);
            // }

            camera.position.sub(localVector);
            camera.updateMatrixWorld();
          }
        }
      };
      _containAvatar();
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
  // loadDefaultWorld,
  update,
  enterWorld,
  pushUrl,
  handleUrlUpdate,
};
