import * as THREE from 'three';

import metaversefile from 'metaversefile';
const {useApp, useFrame, useCleanup, useLoaders, usePhysics} = metaversefile;

const flipGeomeryUvs = geometry => {
  for (let i = 0; i < geometry.attributes.uv.array.length; i += 2) {
    const j = i + 1;
    geometry.attributes.uv.array[j] = 1 - geometry.attributes.uv.array[j];
  }
};

export default e => {
  const app = useApp();
  const {gifLoader} = useLoaders();
  const physics = usePhysics();
  
  const srcUrl = ${this.srcUrl};

  app.gif = null;
  
  const geometry = new THREE.PlaneBufferGeometry(1, 1);
  /* geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-worldWidth/2, -worldHeight/2, -0.1),
    new THREE.Vector3(worldWidth/2, worldHeight/2, 0.1),
  ); */
  flipGeomeryUvs(geometry);
  const colors = new Float32Array(geometry.attributes.position.array.length);
  colors.fill(1, 0, colors.length);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.MeshBasicMaterial({
    map: new THREE.Texture(),
    side: THREE.DoubleSide,
    vertexColors: true,
    transparent: true,
    alphaTest: 0.5,
  });
  const model = new THREE.Mesh(geometry, material);
  model.frustumCulled = false;
  app.add(model);
  model.updateMatrixWorld();

  let textures;
  let physicsIds = [];
  let staticPhysicsIds = [];
  e.waitUntil((async () => {
    const gifId = await gifLoader.createGif(srcUrl);
    const frames = await gifLoader.renderFrames(gifId);
    gifLoader.destroyGif(gifId);
    textures = frames.map(frame => {
      const t = new THREE.Texture(frame);
      t.anisotropy = 16;
      t.needsUpdate = true;
      return t;
    });
    app.gif = frames;
    
    // set scale
    const frame = frames[0];
    const {width, height} = frame;
    let worldWidth = width;
    let worldHeight = height;
    if (worldWidth >= worldHeight) {
      worldHeight /= worldWidth;
      worldWidth = 1;
    }
    if (worldHeight >= worldWidth) {
      worldWidth /= worldHeight;
      worldHeight = 1;
    }
    model.scale.set(worldWidth, worldHeight, 1);
    
    // add physics mesh
    const physicsId = physics.addBoxGeometry(
      app.position,
      app.quaternion,
      new THREE.Vector3(worldWidth/2, worldHeight/2, 0.01),
      false
    );
    physicsIds.push(physicsId);
    staticPhysicsIds.push(physicsId);
  })());

  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
    staticPhysicsIds.length = 0;
  });
  useFrame(() => {
    if (textures) {
      const now = Date.now();
      const f = (now % 2000) / 2000;
      const frameIndex = Math.floor(f * textures.length);
      material.map = textures[frameIndex];
    }
  });
  
  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'gif';
export const components = ${this.components};