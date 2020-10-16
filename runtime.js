import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import {VOXLoader} from './VOXLoader.js';
// import {GLTFExporter} from './GLTFExporter.js';
import {getExt, mergeMeshes} from './util.js';
// import {bake} from './bakeUtils.js';
import {makeIconMesh, makeTextMesh} from './vr-ui.js';
import {appManager} from './app-object.js';
import wbn from './wbn.js';
// import {storageHost} from './constants.js';

const runtime = {};

const textDecoder = new TextDecoder();

const _importMapUrl = u => new URL(u, location.protocol + '//' + location.host).href;
const importMap = {
  three: _importMapUrl('./three.module.js'),
  app: _importMapUrl('./app-object.js'),
  BufferGeometryUtils: _importMapUrl('./BufferGeometryUtils.js'),
  GLTFLoader: _importMapUrl('./GLTFLoader.js'),
};

const _clone = o => JSON.parse(JSON.stringify(o));

// const thingFiles = {};
const _loadGltf = async file => {
  // const u = `${storageHost}/${hash}`;
  const u = URL.createObjectURL(file);
  let o;
  try {
    o = await new Promise((accept, reject) => {
      new GLTFLoader().load(u, accept, function onprogress() {}, reject);
    });
  } catch(err) {
    console.warn(err);
  } finally {
    URL.revokeObjectURL(u);
  }
  o = o.scene;

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

  /* const u = URL.createObjectURL(file);
  let o;
  try {
    o = await new Promise((accept, reject) => {
      new GLTFLoader().load(u, accept, function onprogress() {}, reject);
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
      new GLTFLoader().load(u, accept, x => {
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
  const u = URL.createObjectURL(file);
  let o;
  try {
    o = await new Promise((accept, reject) => {
      new GLTFLoader().load(u, accept, function onprogress() {}, reject);
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
    const u = URL.createObjectURL(file);
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
const _loadScript = async file => {
  const mesh = makeIconMesh();
  mesh.geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-1, -1/2, -0.1),
    new THREE.Vector3(1, 1/2, 0.1),
  );
  mesh.frustumCulled = false;
  mesh.run = async () => {
    const u = URL.createObjectURL(file);
    await import(u).finally(() => {
      URL.revokeObjectURL(u);
    });
  };
  return mesh;
};
let appIds = 0;
const _loadWebBundle = async file => {
  const arrayBuffer = await new Promise((accept, reject) => {
    const fr = new FileReader();
    fr.onload = function() {
      accept(this.result);
    };
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });

  const appId = ++appIds;
  const mesh = makeIconMesh();
  mesh.geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-1, -1/2, -0.1),
    new THREE.Vector3(1, 1/2, 0.1),
  );
  mesh.frustumCulled = false;
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
  localImportMap.app = (() => {
    const s = `\
      import {renderer as _renderer, scene, camera, orbitControls, appManager} from ${JSON.stringify(importMap.app)};
      const renderer = Object.create(_renderer);
      renderer.setAnimationLoop = function(fn) {
        appManager.setAnimationLoop(${appId}, fn);
      };
      const app = appManager.getApp(${appId});
      export {renderer, scene, camera, orbitControls, app};
    `;
    const b = new Blob([s], {
      type: 'application/javascript',
    });
    return URL.createObjectURL(b);
  })();

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
    return script;
  };

  const bundle = new wbn.Bundle(arrayBuffer);
  // console.log('got bundle', bundle);
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
    app.files[pathname] = blobUrl;
  }
  const u = _mapUrl(bundle.primaryURL);

  return mesh;
};
const _loadLink = async file => {
  const text = await file.text();

  const geometry = new THREE.CircleBufferGeometry(1, 32)
    .applyMatrix4(new THREE.Matrix4().makeScale(0.5, 1, 1));
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

  const textMesh = makeTextMesh(text.slice(0, 80), undefined, 0.2, 'center', 'middle');
  textMesh.position.y = 1.2;
  portalMesh.add(textMesh);

  const appId = ++appIds;
  const app = appManager.createApp(appId);
  appManager.setAnimationLoop(appId, () => {
    portalMesh.update();
  });

  return portalMesh;
};

runtime.loadFile = async file => {
  switch (getExt(file.name)) {
    case 'gltf':
    case 'glb': {
      return await _loadGltf(file);
    }
    case 'vrm': {
      return await _loadVrm(file);
    }
    case 'vox': {
      return await _loadVox(file);
    }
    case 'png':
    case 'gif':
    case 'jpg': {
      return await _loadImg(file);
    }
    case 'js': {
      return await _loadScript(file);
      break;
    }
    case 'wbn': {
      return await _loadWebBundle(file);
    }
    case 'url': {
      return await _loadLink(file);
    }
  }
};

export default runtime;