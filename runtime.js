import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
// import {KTX2Loader} from './KTX2Loader.js';
import {CSS3DObject} from './CSS3DRenderer.js';
import {MeshoptDecoder} from './meshopt_decoder.module.js';
import {BasisTextureLoader} from './BasisTextureLoader.js';
import {VOXLoader} from './VOXLoader.js';
// import {GLTFExporter} from './GLTFExporter.js';
import {getExt, mergeMeshes} from './util.js';
// import {bake} from './bakeUtils.js';
// import geometryManager from './geometry-manager.js';
import {rigManager} from './rig.js';
import {makeIconMesh, makeTextMesh} from './vr-ui.js';
import {renderer, scene2, appManager} from './app-object.js';
import wbn from './wbn.js';
// import {storageHost} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

const runtime = {};

let geometryManager = null;
let physicsManager = null;
let world = null;
runtime.injectDependencies = (newGeometryManager, newPhysicsManager, newWorld) => {
  geometryManager = newGeometryManager;
  physicsManager = newPhysicsManager;
  world = newWorld;
};

let nextPhysicsId = 0;

const textDecoder = new TextDecoder();
const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);
const basisLoader = new BasisTextureLoader();
// const ktx2Loader = new KTX2Loader();
basisLoader.detectSupport(renderer);
gltfLoader.setBasisLoader(basisLoader);
basisLoader.detectSupport(renderer);

const _importMapUrl = u => new URL(u, location.protocol + '//' + location.host).href;
const importMap = {
  three: _importMapUrl('./three.module.js'),
  app: _importMapUrl('./app-object.js'),
  world: _importMapUrl('./world.js'),
  runtime: _importMapUrl('./runtime.js'),
  physicsManager: _importMapUrl('./physics-manager.js'),
  rig: _importMapUrl('./rig.js'),
  vrUi: _importMapUrl('./vr-ui.js'),
  crypto: _importMapUrl('./crypto.js'),
  BufferGeometryUtils: _importMapUrl('./BufferGeometryUtils.js'),
  GLTFLoader: _importMapUrl('./GLTFLoader.js'),
};

const _clone = o => JSON.parse(JSON.stringify(o));

// const thingFiles = {};
const _loadGltf = async (file, {optimize = false, physics = false, physics_url = false} = {}) => {
  const u = file.url || URL.createObjectURL(file);
  let o;
  try {
    o = await new Promise((accept, reject) => {
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
  } catch(err) {
    console.warn(err);
  } finally {
    URL.revokeObjectURL(u);
  }
  o = o.scene;

  const mesh = (() => {
    if (optimize) {
      const specs = [];
      o.traverse(o => {
        if (o.isMesh) {
          const mesh = o;
          const {geometry} = o;
          let texture;
          if (o.material.map) {
            texture = o.material.map;
          } else if (o.material.emissiveMap) {
            texture = o.material.emissiveMap;
          } else {
            texture = null;
          }
          specs.push({
            mesh,
            geometry,
            texture,
          });
        }
      });
      specs.sort((a, b) => +a.mesh.material.transparent - +b.mesh.material.transparent);
      const meshes = specs.map(spec => spec.mesh);
      const geometries = specs.map(spec => spec.geometry);
      const textures = specs.map(spec => spec.texture);

      const mesh = mergeMeshes(meshes, geometries, textures);
      mesh.userData.gltfExtensions = {
        EXT_aabb: mesh.geometry.boundingBox.min.toArray()
          .concat(mesh.geometry.boundingBox.max.toArray()),
        // EXT_hash: hash,
      };
      return mesh;
    } else {
      return o;
    }
  })();
  
  if (physics) {
    mesh.updateMatrixWorld();
    
    const meshes = [];
    mesh.traverse(o => {
      if (o.isMesh) {
        meshes.push(o);
      }
    });
    for (const mesh of meshes) {
      const {geometry} = mesh;
      const newGeometry = new THREE.BufferGeometry();

      if (geometry.attributes.position.isInterleavedBufferAttribute) {
        const positions = new Float32Array(geometry.attributes.position.count * 3);
        for (let i = 0, j = 0; i < positions.length; i += 3, j += geometry.attributes.position.data.stride) {
          localVector
            .fromArray(geometry.attributes.position.data.array, j)
            .applyMatrix4(mesh.matrixWorld)
            .toArray(positions, i);
        }
        newGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      } else {
        newGeometry.setAttribute('position', geometry.attribute.position);
      }
      
      if (geometry.index) {
        newGeometry.setIndex(geometry.index);
      }

      const newMesh = new THREE.Mesh(newGeometry);
      physicsManager.addGeometry(newMesh);
    }
  }
  if (physics_url) {
    const res = await fetch(physics_url);
    let physicsBuffer = await res.arrayBuffer();
    physicsBuffer = new Uint8Array(physicsBuffer);
    physicsBuffers.push(physicsBuffer);
  }
  
  return mesh;

  /* const u = URL.createObjectURL(file);
  let o;
  try {
    o = await new Promise((accept, reject) => {
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
  } finally {
    URL.revokeObjectURL(u);
  }
  o = o.scene;
  let mesh = null;
  o.traverse(o => {
    if (o.isMesh && mesh === null) {
      o.material.depthWrite = true;
      if (o.userData.gltfExtensions && o.userData.gltfExtensions.EXT_aabb) {
        o.geometry.boundingBox = new THREE.Box3();
        o.geometry.boundingBox.min.fromArray(o.userData.gltfExtensions.EXT_aabb, 0);
        o.geometry.boundingBox.max.fromArray(o.userData.gltfExtensions.EXT_aabb, 3);
      } else {
        o.geometry.computeBoundingBox();
      }
      mesh = o;
    }
  });
  return mesh; */

  // XXX bake at upload time
  /* const u = URL.createObjectURL(file);
  let o;
  let arrayBuffer;
  try {
    let xhr;
    o = await new Promise((accept, reject) => {
      gltfLoader.load(u, accept, x => {
        xhr = x;
      }, reject);
    });
    arrayBuffer = xhr.target.response;
  } finally {
    URL.revokeObjectURL(u);
  }
  o = o.scene;
  o.updateMatrixWorld();

  const meshes = [];
  const geometries = [];
  const textures = [];
  o.traverse(o => {
    if (o.isMesh) {
      meshes.push(o);
      geometries.push(o.geometry);
      if (o.material.map) {
        textures.push(o.material.map);
      } else {
        textures.push(null);
      }
    }
  });

  const mesh = _mergeMeshes(meshes, geometries, textures);
  mesh.matrix
    .compose(localVector.copy(camera.position).add(localVector3.set(0, 0, -1).applyQuaternion(camera.quaternion)), camera.quaternion, localVector2.set(1, 1, 1))
    // .premultiply(localMatrix2.getInverse(chunkMeshContainer.matrixWorld))
    .decompose(mesh.position, mesh.quaternion, mesh.scale);
  mesh.frustumCulled = false;
  return mesh; */

  /* {
    const positions = geometryWorker.alloc(Float32Array, geometry.attributes.position.array.length);
    positions.set(geometry.attributes.position.array);
    const uvs = geometryWorker.alloc(Float32Array, geometry.attributes.uv.array.length);
    uvs.set(geometry.attributes.uv.array);
    const indices = geometryWorker.alloc(Uint32Array, geometry.index.array.length);
    indices.set(geometry.index.array);

    const atlasCanvasCtx = atlasCanvas.getContext('2d');
    const imageData = atlasCanvasCtx.getImageData(0, 0, atlasCanvas.width, atlasCanvas.height);
    const texture = geometryWorker.alloc(Uint8Array, imageData.data.byteLength);
    texture.set(imageData.data);

    const name = 'thing' + (++numThings);
    geometryWorker.requestAddThingGeometry(tracker, geometrySet, name, positions.byteOffset, uvs.byteOffset, indices.byteOffset, positions.length, uvs.length, indices.length, texture.byteOffset, 0, 0)
      .then(() => geometryWorker.requestAddThing(tracker, geometrySet, name, localVector, localQuaternion, localVector2))
      .then(({objectId}) => {
        const b = new Blob([arrayBuffer], {
          type: 'application/octet-stream',
        });
        const u = URL.createObjectURL(b);
        thingFiles[objectId] = u;
      }, console.warn);
  } */
};
const _loadVrm = async file => {
  const u = file.url || URL.createObjectURL(file);
  let o;
  try {
    o = await new Promise((accept, reject) => {
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
  } catch(err) {
    console.warn(err);
  } finally {
    URL.revokeObjectURL(u);
  }
  o.scene.raw = o;
  o = o.scene;
  o.traverse(o => {
    if (o.isMesh) {
      o.frustumCulled = false;
    }
  });
  o.geometry = {
    boundingBox: new THREE.Box3().setFromObject(o),
  };
  return o;
};
const _loadVox = async file => {
  const u = URL.createObjectURL(file);
  let o;
  try {
    o = await new Promise((accept, reject) => {
      new VOXLoader({
        scale: 0.01,
      }).load(u, accept, function onprogress() {}, reject);
    });
  } catch(err) {
    console.warn(err);
  } finally {
    URL.revokeObjectURL(u);
  }
  return o;
};
const _loadImg = async file => {
  const img = new Image();
  await new Promise((accept, reject) => {
    const u = file.url || URL.createObjectURL(file);
    img.onload = () => {
      accept();
      _cleanup();
    };
    img.onerror = err => {
      reject(err);
      _cleanup();
    }
    const _cleanup = () => {
      URL.revokeObjectURL(u);
    };
    img.crossOrigin = '';
    img.src = u;
  });
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
  });
  /* const material = meshComposer.material.clone();
  material.uniforms.map.value = texture;
  material.uniforms.map.needsUpdate = true; */

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
};
const _makeAppUrl = (appId) => {
  const s = `\
    import {renderer as _renderer, scene, camera, appManager} from ${JSON.stringify(importMap.app)};
    import * as THREE from ${JSON.stringify(importMap.three)};
    import runtime from ${JSON.stringify(importMap.runtime)};
    import {world} from ${JSON.stringify(importMap.world)};
    import _physics from ${JSON.stringify(importMap.physicsManager)};
    import {rigManager} from ${JSON.stringify(importMap.rig)};
    import * as ui from ${JSON.stringify(importMap.vrUi)};
    import * as crypto from ${JSON.stringify(importMap.crypto)};

    const renderer = Object.create(_renderer);
    renderer.setAnimationLoop = function(fn) {
      appManager.setAnimationLoop(${appId}, fn);
    };

    const physics = {};
    for (const k in _physics) {
      physics[k] = _physics[k];
    }
    const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    const localQuaternion = new THREE.Quaternion();
    const localMatrix = new THREE.Matrix4();
    const localMatrix2 = new THREE.Matrix4();
    physics.addBoxGeometry = (addBoxGeometry => function(position, quaternion, size, dynamic) {
      localMatrix
        .compose(position, quaternion, localVector2.set(1, 1, 1))
        .premultiply(app.object.matrixWorld)
        .decompose(localVector, localQuaternion, localVector2);
      position = localVector;
      quaternion = localQuaternion;
      return addBoxGeometry.call(this, position, quaternion, size, dynamic);
    })(physics.addBoxGeometry);
    physics.addGeometry = (addGeometry => function(mesh) {
      return addGeometry.apply(this, arguments);
    })(physics.addGeometry);
    physics.addConvexGeometry = (addConvexGeometry => function(mesh) {
      return addConvexGeometry.apply(this, arguments);
    })(physics.addConvexGeometry);
    physics.addCookedConvexGeometry = (addCookedConvexGeometry => function(buffer, position, quaternion) {
      return addCookedConvexGeometry.apply(this, arguments);
    })(physics.addCookedConvexGeometry);
    physics.getPhysicsTransform = (getPhysicsTransform => function(physicsId) {
      const transform = getPhysicsTransform.apply(this, arguments);
      const {position, quaternion} = transform;
      localMatrix
        .compose(position, quaternion, localVector2.set(1, 1, 1))
        .premultiply(localMatrix2.copy(app.object.matrixWorld).invert())
        .decompose(position, quaternion, localVector2);
      return transform;
    })(physics.getPhysicsTransform);
    physics.setPhysicsTransform = (setPhysicsTransform => function(physicsId, position, quaternion) {
      localMatrix
        .compose(position, quaternion, localVector2.set(1, 1, 1))
        .premultiply(app.object.matrixWorld)
        .decompose(localVector, localQuaternion, localVector2);
      position = localVector;
      quaternion = localQuaternion;
      return setPhysicsTransform.call(this, physicsId, position, quaternion);
    })(physics.setPhysicsTransform);

    const app = appManager.getApp(${appId});
    let recursion = 0;
    app.onBeforeRender = () => {
      recursion++;
      if (recursion === 1) {
        rigManager.localRig.model.visible = true;
      }
    };
    app.onAfterRender = () => {
      recursion--;
      if (recursion === 0) {
        rigManager.localRig.model.visible = false;
      }
    };
    export {renderer, scene, camera, runtime, world, physics, ui, crypto, app, appManager};
  `;
  const b = new Blob([s], {
    type: 'application/javascript',
  });
  return URL.createObjectURL(b);
};
const _loadScript = async file => {
  const appId = ++appIds;
  const mesh = new THREE.Object3D(); // makeIconMesh();
  mesh.geometry = new THREE.BufferGeometry();
  mesh.geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-1, -1/2, -0.1),
    new THREE.Vector3(1, 1/2, 0.1),
  );
  mesh.frustumCulled = false;
  mesh.run = () => {
    import(u)
      .then(() => {
        // console.log('import returned');
      }, err => {
        console.warn('import failed', u, err);
      })
      .finally(() => {
        for (const u of cachedUrls) {
          URL.revokeObjectURL(u);
        }
      });
  };
  mesh.destroy = () => {
    appManager.destroyApp(appId);
  };

  const app = appManager.createApp(appId);
  app.object = mesh;
  const localImportMap = _clone(importMap);
  localImportMap.app = _makeAppUrl(appId);
  app.files = new Proxy({}, {
    get(target, p) {
      return new URL(p, srcUrl).href;
    },
  });

  const cachedUrls = [];
  const _getUrl = u => {
    const mappedUrl = URL.createObjectURL(new Blob([u], {
      type: 'text/javascript',
    }));
    cachedUrls.push(mappedUrl);
    return mappedUrl;
  };
  const urlCache = {};
  const _mapUrl = async u => {
    const importUrl = localImportMap[u];
    if (importUrl) {
      return importUrl;
    } else {
      const cachedUrl = urlCache[u];
      if (cachedUrl) {
        return cachedUrl;
      } else {
        const res = await fetch(u);
        if (res.ok) {
          let importScript = await res.text();
          importScript = await _mapScript(importScript, srcUrl);
          const cachedUrl = _getUrl(importScript);
          urlCache[u] = cachedUrl;
          return cachedUrl;
        } else {
          throw new Error('failed to load import url: ' + u);
        }
      }
    }
  };
  const _mapScript = async (script, scriptUrl) => {
    const r = /^(\s*import[^\n]+from\s*['"])(.+)(['"])/gm;
    const replacements = await Promise.all(Array.from(script.matchAll(r)).map(async match => {
      let u = match[2];
      if (/^\.+\//.test(u)) {
        u = new URL(u, scriptUrl).href;
      }
      return await _mapUrl(u);
    }));
    let index = 0;
    script = script.replace(r, function() {
      return arguments[1] + replacements[index++] + arguments[3];
    });
    return script;
  };

  let srcUrl = file.url || URL.createObjectURL(file);
  if (/^\.+\//.test(srcUrl)) {
    srcUrl = new URL(srcUrl, location.href).href;
  }
  const u = await _mapUrl(srcUrl);

  return mesh;
};
let appIds = 0;
const _loadWebBundle = async (file, opts, instanceId) => {
  let arrayBuffer;

  if (file.url) {
    const res = await fetch(file.url);
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = await new Promise((accept, reject) => {
      const fr = new FileReader();
      fr.onload = function() {
        accept(this.result);
      };
      fr.onerror = reject;
      fr.readAsArrayBuffer(file);
    });
  }

  const appId = ++appIds;
  const mesh = new THREE.Object3D(); // makeIconMesh();
  /* mesh.geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-1, -1/2, -0.1),
    new THREE.Vector3(1, 1/2, 0.1),
  );
  mesh.frustumCulled = false; */
  mesh.run = () => {
    import(u)
      .then(() => {
        console.log('import returned');
      }, err => {
        console.warn('import failed', u, err);
      })
      .finally(() => {
        for (const u of cachedUrls) {
          URL.revokeObjectURL(u);
        }
      });
  };
  mesh.destroy = () => {
    appManager.destroyApp(appId);
  };

  const app = appManager.createApp(appId);
  app.object = mesh;
  const localImportMap = _clone(importMap);
  localImportMap.app = _makeAppUrl(appId);

  const cachedUrls = [];
  const _getUrl = u => {
    const mappedUrl = URL.createObjectURL(new Blob([u], {
      type: 'text/javascript',
    }));
    cachedUrls.push(mappedUrl);
    return mappedUrl;
  };
  const urlCache = {};
  const _mapUrl = u => {
    const importUrl = localImportMap[u];
    if (importUrl) {
      return importUrl;
    } else {
      const cachedUrl = urlCache[u];
      if (cachedUrl) {
        return cachedUrl;
      } else {
        const importUrl = new URL(u, 'https://xrpackage.org/').href;
        let importResponse;
        try {
          importResponse = bundle.getResponse(importUrl);
        } catch(err) {
          console.warn(err);
        }
        if (importResponse) {
          const importBody = importResponse.body;
          let importScript = textDecoder.decode(importBody);
          importScript = _mapScript(importScript);
          const cachedUrl = _getUrl(importScript);
          urlCache[u] = cachedUrl;
          return cachedUrl;
        } else {
          throw new Error('failed to find import url: ' + importUrl);
        }
      }
    }
  };
  const _mapScript = script => {
    const r = /^(\s*import[^\n]+from\s*['"])(.+)(['"])/gm;
    script = script.replace(r, function() {
      const u = _mapUrl(arguments[2]);
      return arguments[1] + u + arguments[3];
    });

    if (instanceId) {
      script = script.replace("document.monetization", `window.document.monetization${instanceId}`);
      script = script.replace("document.monetization.addEventListener", `window.document.monetization${instanceId}.addEventListener`);
      script = `
        window.document.monetization${instanceId} = window.document.createElement('div');
      ` + script;
    }

    return script;
  };

  const bundle = new wbn.Bundle(arrayBuffer);
  const {urls} = bundle;
  for (const u of urls) {
    const response = bundle.getResponse(u);
    const {headers} = response;
    const contentType = headers['content-type'] || 'application/octet-stream';
    const b = new Blob([response.body], {
      type: contentType,
    });
    const blobUrl = URL.createObjectURL(b);
    const {pathname} = new URL(u);
    app.files['.' + pathname] = blobUrl;
  }
  const u = _mapUrl(bundle.primaryURL);

  return mesh;
};
const _loadScn = async (file, opts) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  if (/^\.+\//.test(srcUrl)) {
    srcUrl = new URL(srcUrl, location.href).href;
  }
  
  const res = await fetch(srcUrl);
  const j = await res.json();
  const {objects} = j;
  
  const scene = new THREE.Object3D();
  const physicsBuffers = [];
  let physicsIds = [];

  for (const object of objects) {
    let {name, position = [0, 0, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1], start_url, filename, content, physics_url = null, optimize = false, physics = false} = object;
    const parentId = null;
    position = new THREE.Vector3().fromArray(position);
    quaternion = new THREE.Quaternion().fromArray(quaternion);
    if (start_url) {
      start_url = new URL(start_url, srcUrl).href;
    } else if (filename && content) {
      const blob = new Blob([content], {
        type: 'application/octet-stream',
      });
      start_url = URL.createObjectURL(blob);
      start_url += '/' + filename;
    } else {
      console.warn('cannot load contentless object', object);
      continue;
    }
    if (physics_url) {
      physics_url = new URL(physics_url, srcUrl).href;
    }

    world.addObject(start_url, parentId, position, quaternion, {
      optimize,
      physics,
      physics_url,
    });

    /* const mesh = await runtime.loadFile({
      url: start_url,
      name: start_url,
    }, {
      optimize,
      physics,
    });
    mesh.position.fromArray(position);
    mesh.quaternion.fromArray(quaternion);
    mesh.scale.fromArray(scale);
    scene.add(mesh); */
  }
  scene.run = () => {
    for (const child of scene.children) {
      child.run && child.run();
    }
    physicsIds = physicsBuffers.map(physicsBuffer => {
      const physicsId = ++nextPhysicsId;
      geometryManager.geometryWorker.addCookedGeometryPhysics(geometryManager.physics, physicsBuffer, new THREE.Vector3(), new THREE.Quaternion(), physicsId);
    });
  };
  scene.destroy = () => {
    for (const child of scene.children) {
      child.destroy && child.destroy();
    }
    for (const physicsId of physicsIds) {
      geometryManager.geometryWorker.removeGeometryPhysics(geometryManager.physics, physicsId);
    }
    physicsIds.length = 0;
  };
  return scene;
};
const _loadLink = async file => {
  let href;
  if (file.url) {
    const res = await fetch(file.url);
    href = await res.text();
  } else {
    href = await file.text();
  }

  const geometry = new THREE.CircleBufferGeometry(1, 32)
    .applyMatrix4(new THREE.Matrix4().makeScale(0.5, 1, 1))
    .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 1, 0));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      // tex: {type: 't', value: texture, needsUpdate: true},
      iTime: {value: 0, needsUpdate: true},
    },
    vertexShader: `\
      // uniform float iTime;
      varying vec2 uvs;
      /* varying vec3 vNormal;
      varying vec3 vWorldPosition; */
      void main() {
        uvs = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        // vNormal = normal;
        // vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        /// vWorldPosition = worldPosition.xyz;
      }
    `,
    fragmentShader: `\
      #define PI 3.1415926535897932384626433832795

      uniform float iTime;
      // uniform sampler2D tex;
      varying vec2 uvs;
      /* arying vec3 vNormal;
      varying vec3 vWorldPosition; */

      const vec3 c = vec3(${new THREE.Color(0x1565c0).toArray().join(', ')});

      void main() {
        vec2 uv = uvs;
        /* uv.x *= 1.7320508075688772;
        uv *= 8.0;

        vec3 direction = vWorldPosition - cameraPosition;
        float d = dot(vNormal, normalize(direction));
        float glow = d < 0.0 ? max(1. + d * 2., 0.) : 0.;

        float animationFactor = (1.0 + sin((uvs.y*2. + iTime) * PI*2.))/2.;
        float a = glow + (1.0 - texture2D(tex, uv).r) * (0.01 + pow(animationFactor, 10.0) * 0.5); */

        const vec3 c = vec3(${new THREE.Color(0x29b6f6).toArray().join(', ')});

        vec2 distanceVector = abs(uv - 0.5)*2.;
        float a = pow(length(distanceVector), 5.);
        vec2 normalizedDistanceVector = normalize(distanceVector);
        float angle = atan(normalizedDistanceVector.y, normalizedDistanceVector.x) + iTime*PI*2.;
        float skirt = pow(sin(angle*50.) * cos(angle*20.), 5.) * 0.2;
        a += skirt;
        // if (length(f) > 0.8) {
          gl_FragColor = vec4(c, a);
        /* } else {
          discard;
        } */
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const portalMesh = new THREE.Mesh(geometry, material);
  portalMesh.update = () => {
    const portalRate = 30000;
    portalMesh.material.uniforms.iTime.value = (Date.now()/portalRate) % 1;
    portalMesh.material.uniforms.iTime.needsUpdate = true;
  };
  portalMesh.destroy = () => {
    appManager.destroyApp(appId);
  };
  // portalMesh.position.y = 1;
  // scene.add(portalMesh);

  const textMesh = makeTextMesh(href.slice(0, 80), undefined, 0.2, 'center', 'middle');
  textMesh.position.y = 2.2;
  textMesh.color = 0xCCCCCC;
  portalMesh.add(textMesh);

  let inRangeStart = null;

  const appId = ++appIds;
  const app = appManager.createApp(appId);
  appManager.setAnimationLoop(appId, () => {
    portalMesh.update();

    const distance = rigManager.localRig.inputs.hmd.position.distanceTo(
      localVector.copy(portalMesh.position)
        .add(localVector2.set(0, 1, 0).applyQuaternion(portalMesh.quaternion))
    );
    if (distance < 1) {
      const now = Date.now();
      if (inRangeStart !== null) {
        const timeDiff = now - inRangeStart;
        if (timeDiff >= 2000) {
          renderer.setAnimationLoop(null);
          window.location.href = href;
        }
      } else {
        inRangeStart = now;
      }
    } else {
      inRangeStart = null;
    }
  });

  return portalMesh;
};
const _loadIframe = async (file, opts) => {
  let href;
  if (file.url) {
    const res = await fetch(file.url);
    href = await res.text();
  } else {
    href = await file.text();
  }

  const width = 600;
  const height = 400;

  const iframe = document.createElement('iframe');
  iframe.src = href;
  iframe.allow = 'monetization';
  iframe.style.width = width + 'px';
  iframe.style.height = height + 'px';
  // iframe.style.opacity = 0.75;
  iframe.style.background = 'white';
  // iframe.style.backfaceVisibility = 'visible';

  const object = new CSS3DObject(iframe);
  // object.position.set(0, 1, 0);
  // object.scale.setScalar(0.01);
  object.frustumCulled = false;

  const object2 = new THREE.Mesh(new THREE.PlaneBufferGeometry(width, height), new THREE.MeshBasicMaterial({
    transparent: true,
    // color: 0xFF0000,
    opacity: 0,
    side: THREE.DoubleSide,
  }));
  // object2.position.copy(object.position);
  // object2.quaternion.copy(object.quaternion);
  // object2.scale.copy(object.scale);
  object2.scale.setScalar(0.01);
  object2.frustumCulled = false;
  object2.renderOrder = -Infinity;
  // scene3.add(object2);
  object2.onAfterRender = () => {
    object.position.copy(object2.position);
    object.quaternion.copy(object2.quaternion);
    object.scale.copy(object2.scale);
    object.matrix.copy(object2.matrix);
    object.matrixWorld.copy(object2.matrixWorld);
  };
  object2.run = () => {
    scene2.add(object);
  };
  object2.destroy = () => {
    scene2.remove(object);
  };
  
  return object2;
};

runtime.loadFile = async (file, opts, instanceId) => {
  switch (getExt(file.name)) {
    case 'gltf':
    case 'glb': {
      return await _loadGltf(file, opts);
    }
    case 'vrm': {
      return await _loadVrm(file, opts);
    }
    case 'vox': {
      return await _loadVox(file, opts);
    }
    case 'png':
    case 'gif':
    case 'jpg': {
      return await _loadImg(file, opts);
    }
    case 'js': {
      return await _loadScript(file, opts);
    }
    case 'wbn': {
      return await _loadWebBundle(file, opts, instanceId);
    }
    case 'scn': {
      return await _loadScn(file, opts);
    }
    case 'url': {
      return await _loadLink(file, opts);
    }
    case 'iframe': {
      return await _loadIframe(file, opts);
    }
    case 'mp3': {
      throw new Error('audio not implemented');
    }
    case 'video': {
      throw new Error('video not implemented');
    }
  }
};

export default runtime;
