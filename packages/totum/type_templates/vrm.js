import * as THREE from 'three';
import metaversefile from 'metaversefile';
import { VRMMaterialImporter } from '@pixiv/three-vrm/lib/three-vrm.module';
const { useApp, useLoaders, usePhysics, useCleanup, useActivate, useLocalPlayer } = metaversefile;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
// const q180 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

const _fetchArrayBuffer = async srcUrl => {
  const res = await fetch(srcUrl);
  if (res.ok) {
    const arrayBuffer = await res.arrayBuffer();
    return arrayBuffer;
  } else {
    throw new Error('failed to load: ' + res.status + ' ' + srcUrl);
  }
};
const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
  const { gltfLoader } = useLoaders();
  gltfLoader.parse(arrayBuffer, srcUrl, accept, reject);
});
const _toonShaderify = async o => {
  await new VRMMaterialImporter().convertGLTFMaterials(o);
};
const mapTypes = [
  'alphaMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'emissiveMap',
  'envMap',
  'lightMap',
  'map',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
];
const _addAnisotropy = (o, anisotropyLevel) => {
  o.traverse(o => {
    if (o.isMesh) {
      for (const mapType of mapTypes) {
        if (o.material[mapType]) {
          o.material[mapType].anisotropy = anisotropyLevel;
        }
      }
    }
  });
};

export default e => {
  const app = useApp();
  const physics = usePhysics();

  const srcUrl = ${this.srcUrl};

  let arrayBuffer = null;
  const _cloneVrm = async () => {
    const vrm = await parseVrm(arrayBuffer, srcUrl);
    vrm.cloneVrm = _cloneVrm;
    return vrm;
  };

  const _prepVrm = (vrm) => {
    app.add(vrm);
    vrm.updateMatrixWorld();
    _addAnisotropy(vrm, 16);
  }

  let physicsIds = [];
  let activateCb = null;
  e.waitUntil((async () => {
    arrayBuffer = await _fetchArrayBuffer(srcUrl);

    const skinnedVrmBase = await _cloneVrm();
    app.skinnedVrm = skinnedVrmBase;
    await _toonShaderify(skinnedVrmBase);
    _prepVrm(skinnedVrmBase.scene);

    const _addPhysics = () => {
      const fakeHeight = 1.5;
      localMatrix.compose(
        localVector.set(0, fakeHeight / 2, 0),
        localQuaternion.identity(),
        localVector2.set(0.3, fakeHeight / 2, 0.3)
      )
        .premultiply(app.matrixWorld)
        .decompose(localVector, localQuaternion, localVector2);

      const physicsId = physics.addBoxGeometry(
        localVector,
        localQuaternion,
        localVector2,
        false
      );
      physicsIds.push(physicsId);
    };
    if (app.getComponent('physics')) {
      _addPhysics();
    }

    // we don't want to have per-frame bone updates for unworn avatars
    // so we toggle bone updates off and let the app enable them when worn
    app.toggleBoneUpdates(false);

    const npcComponent = app.getComponent('npc');
    if (!npcComponent) {
      activateCb = async () => {
        const localPlayer = useLocalPlayer();
        localPlayer.setAvatarApp(app);
      };
    }
  })());

  useActivate(() => {
    activateCb && activateCb();
  });

  app.lookAt = (lookAt => function (p) {
    lookAt.apply(this, arguments);
    this.quaternion.premultiply(q180);
  })(app.lookAt);

  app.setSkinning = async skinning => {
    console.warn("WARNING: setSkinning FUNCTION IS DEPRICATED and will be removed. Please use toggleBoneUpdates instead.");
    app.toggleBoneUpdates(skinning);
  }

  app.toggleBoneUpdates = update => {
    const scene = app.skinnedVrm.scene;
    scene.traverse(o => {
      if (o.isBone) {
        o.matrixAutoUpdate = update;
      }
    });

    if (update) {

      for (const physicsId of physicsIds) {
        physics.disableGeometry(physicsId);
        physics.disableGeometryQueries(physicsId);
      }

      app.position.set(0, 0, 0);
      app.quaternion.identity();
      app.scale.set(1, 1, 1);
      app.updateMatrixWorld();
    } else {
      
      for (const physicsId of physicsIds) {
        physics.enableGeometry(physicsId);
        physics.enableGeometryQueries(physicsId);
      }
    }
  };

  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
  });

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'vrm';
export const components = ${this.components};