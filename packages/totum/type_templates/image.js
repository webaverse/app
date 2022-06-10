import * as THREE from 'three';

import metaversefile from 'metaversefile';
const {useApp, useFrame, useCleanup, usePhysics} = metaversefile;

/* const flipGeomeryUvs = geometry => {
  for (let i = 0; i < geometry.attributes.uv.array.length; i += 2) {
    const j = i + 1;
    geometry.attributes.uv.array[j] = 1 - geometry.attributes.uv.array[j];
  }
}; */
// console.log('got gif 0');

export default e => {
  const app = useApp();
  // const {gifLoader} = useLoaders();
  const physics = usePhysics();

  app.image = null;

  const srcUrl = ${this.srcUrl};
  // console.log('got gif 1');

  const physicsIds = [];
  // const staticPhysicsIds = [];
  e.waitUntil((async () => {
    const img = await (async() => {
      for (let i = 0; i < 10; i++) { // hack: give it a few tries, sometimes images fail for some reason
        try {
          const img = await new Promise((accept, reject) => {
            const img = new Image();
            img.onload = () => {
              accept(img);
              // startMonetization(instanceId, monetizationPointer, ownerAddress);
              // _cleanup();
            };
            img.onerror = err => {
              const err2 = new Error('failed to load image: ' + srcUrl + ': ' + err);
              reject(err2);
              // _cleanup();
            }
            /* const _cleanup = () => {
              gcFiles && URL.revokeObjectURL(u);
            }; */
            img.crossOrigin = 'Anonymous';
            img.src = srcUrl;
          });
          return img;
        } catch(err) {
          console.warn(err);
        }
      }
      throw new Error('failed to load image: ' + srcUrl);
    })();
    app.image = img;
    let {width, height} = img;
    if (width >= height) {
      height /= width;
      width = 1;
    }
    if (height >= width) {
      width /= height;
      height = 1;
    }
    const geometry = new THREE.PlaneBufferGeometry(width, height);
    geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3(-width/2, -height/2, -0.1),
      new THREE.Vector3(width/2, height/2, 0.1),
    );
    const colors = new Float32Array(geometry.attributes.position.array.length);
    colors.fill(1, 0, colors.length);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const texture = new THREE.Texture(img);
    texture.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.5,
    });
    /* const material = meshComposer.material.clone();
    material.uniforms.map.value = texture;
    material.uniforms.map.needsUpdate = true; */

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    // mesh.contentId = contentId;
    app.add(mesh);
    mesh.updateMatrixWorld();
    
    const physicsId = physics.addBoxGeometry(
      app.position,
      app.quaternion,
      new THREE.Vector3(width/2, height/2, 0.01),
      false
    );
    physicsIds.push(physicsId);
    // staticPhysicsIds.push(physicsId);
  })());
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
    // staticPhysicsIds.length = 0;
  });

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'image';
export const components = ${this.components};