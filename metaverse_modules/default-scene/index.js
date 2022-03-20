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

const defaultApps = [
  {
    "type": "application/light",
    "content": {
      "lightType": "ambient",
      "args": [[255, 255, 255], 2]
    }
  },
  {
    "type": "application/light",
    "content": {
      "lightType": "directional",
      "args": [[255, 255, 255], 2],
      "position": [1, 2, 3]
    }
  },
  {
    "type": "application/rendersettings",
    "content": {
      "fog": {
        "fogType": "exp",
        "args": [[255, 255, 255], 0.01]
      },
      "ssao": {
        "kernelRadius": 16,
        "minDistance": 0.005,
        "maxDistance": 0.1
      },
      "dof": {
        "focus": 2.0,
        "aperture": 0.0001,
        "maxblur": 0.005
      },
      "hdr": {
        "adaptive": true,
        "resolution": 256,
        "adaptionRate": 100,
        "maxLuminance": 10,
        "minLuminance": 0,
        "middleGrey": 3
      },
      "bloom": {
        "strength": 0.1,
        "radius": 0.5,
        "threshold": 0.9
      }
    }
  },
  {
    "type": "application/spawnpoint",
    "content": {
      "position": [0, 10, 0],
      "quaternion": [0, 0, 0, 1]
    }
  },
];

export default e => {
  const app = useApp();
  const physics = usePhysics();
  const procGen = useProcGen();
  // const {CapsuleGeometry} = useGeometries();
  // const {WebaverseShaderMaterial} = useMaterials();
  const {voxelWorldSize} = procGen;

  const coords = app.getComponent('coords') ?? [0, 0];
  const [baseX, baseY] = coords;

  let x = baseX;
  let y = baseY;
  let subApps = [];

  const makeComponents = (x, y) => {
    const chunk = procGen.createMapChunk(undefined, x, y);
    const {
      // blocks,
      width,
      // height,
    } = chunk;
    const worldWidth = width * voxelWorldSize;
    const worldHeight = width * voxelWorldSize;
    const exitBlocks = chunk.getExitBlocks();
    
    const coords = [x, y];
    const dx = x - baseX;
    const dy = y - baseY;
    const delta = [dx, dy];
    const bounds = [
      [dx*worldWidth - worldWidth/2, 0, dy*worldHeight - worldHeight/2],
      [dx*worldWidth + worldWidth/2, 16, dy*worldHeight + worldHeight/2],
    ];
    const exits = exitBlocks.map(b => b.getLocalPosition(localVector).toArray());
    const components = {
      coords,
      delta,
      bounds,
      exits,
      singleUse: true,
    };
    return components;
  };

  e.waitUntil((async () => {
    // console.log('generate', exits);

    const components = makeComponents(x, y);
    await Promise.all(
      defaultApps.map(async a => {
        const {type, content} = a;
        const dataUrl = `data:${type},${JSON.stringify(content)}`;
        const subApp = await metaversefile.createApp({
          start_url: dataUrl,
          // components,
        });
        app.add(subApp);
        subApps.push(subApp);
      })
        .concat([
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
                subApp.setComponents(components);
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
        ])
    );
  })());

  return app;
};