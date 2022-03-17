import * as THREE from 'three';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import metaversefile from 'metaversefile';
const {useApp, useLocalPlayer, useProcGen, useFrame, useActivate, useLoaders, usePhysics, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
// const localVector2D = new THREE.Vector2();
// const localBox = new THREE.Box3();
// const localLine = new THREE.Line3();
// const localMatrix = new THREE.Matrix4();

export default e => {
  const app = useApp();
  const physics = usePhysics();
  const procGen = useProcGen();
  // const {CapsuleGeometry} = useGeometries();
  // const {WebaverseShaderMaterial} = useMaterials();
  const {voxelWorldSize} = procGen;

  const baseX = -5;
  const baseY = -5;
  let x = baseX;
  let y = baseY;
  const physicsIds = [];
  let subApps = [];

  const makeComponents = (x, y) => {
    const chunk = procGen.createMapChunk(undefined, x, y);
    const {
      blocks,
      width,
      height,
    } = chunk;
    const worldWidth = width * voxelWorldSize;
    const worldHeight = width * voxelWorldSize;
    const exitBlocks = chunk.getExitBlocks();
    
    const coords = [x, y];
    const dx = x - baseX;
    const dy = y - baseY;
    const bounds = [
      [dx*worldWidth - worldWidth/2, 0, dy*worldHeight - worldHeight/2],
      [dx*worldWidth + worldWidth/2, 16, dy*worldHeight + worldHeight/2],
    ];
    const exits = exitBlocks.map(b => b.getLocalPosition(localVector).toArray());
    const components = {
      coords,
      bounds,
      exits,
    };
    return components;
  };

  e.waitUntil((async () => {
    // console.log('generate', exits);

    const components = makeComponents(x, y);
    await Promise.all([
      (async () => {
        const filter = await metaversefile.createApp({
          start_url: './metaverse_modules/filter/',
          components,
        });
        app.add(filter);
        subApps.push(filter);
      })(),
      (async () => {
        const barrier = await metaversefile.createApp({
          start_url: './metaverse_modules/barrier/',
          components,
        });
        app.add(barrier);
        subApps.push(barrier);

        barrier.addEventListener('collision', e => {
          const {direction} = e;
          x += direction.x;
          y += direction.z;
          const components = makeComponents(x, y);
          // console.log('new components', components);

          for (const subApp of subApps) {
            for (const k in components) {
              const v = components[k];
              subApp.setComponent(k, v);
            }
          }
        });
      })(),
      (async () => {
        const infinistreet = await metaversefile.createApp({
          start_url: './metaverse_modules/infinistreet/',
          components,
        });
        app.add(infinistreet);
        subApps.push(infinistreet);
      })(),
    ]);
  })());

  /* useFrame(() => {
    for (const subApp of subApps) {
      
    }
  }); */
  
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};