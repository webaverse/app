import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import {GLTFExporter} from './GLTFExporter.js';
import {bindUploadFileButton, mergeMeshes} from './util.js';
import wbn from './wbn.js';
import {storageHost} from './constants.js';
import app from './app-object.js';

const inventory = new EventTarget();

const textDecoder = new TextDecoder();

const _importMapUrl = u => new URL(u, location.protocol + '//' + location.host);
const importMap = {
  three: _importMapUrl('./three.module.js'),
  app: _importMapUrl('./app-object.js'),
};

const _getExt = fileName => {
  const match = fileName.match(/\.(.+)$/);
  return match && match[1];
}
inventory.bakeFile = async file => {
  switch (_getExt(file.name)) {
    case 'gltf':
    case 'glb':
    case 'vrm': {
      const u = URL.createObjectURL(file);
      let o;
      try {
        o = await new Promise((accept, reject) => {
          new GLTFLoader().load(u, accept, function onprogress() {}, reject);
        });
      } finally {
        URL.revokeObjectURL(u);
      }
      o = o.scene;

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
      const mesh = mergeMeshes(meshes, geometries, textures);
      mesh.userData.gltfExtensions = {
        EXT_aabb: mesh.geometry.boundingBox.min.toArray()
          .concat(mesh.geometry.boundingBox.max.toArray()),
      };
      const arrayBuffer = await new Promise((accept, reject) => {
        new GLTFExporter().parse(mesh, accept, {
          binary: true,
          includeCustomExtensions: true,
        });
      });
      const bakedFile = new Blob([arrayBuffer], {
        type: 'model/gltf+binary',
      });
      bakedFile.name = file.name;
      return bakedFile;
    }
    default: {
      return file;
    }
  }
};

// const thingFiles = {};
const _loadGltf = async file => {
  const u = URL.createObjectURL(file);
  let o;
  try {
    o = await new Promise((accept, reject) => {
      new GLTFLoader().load(u, accept, function onprogress() {}, reject);
    });
  } finally {
    URL.revokeObjectURL(u);
  }
  o = o.scene;
  o.traverse(o => {
    if (o.isMesh && o.userData.gltfExtensions && o.userData.gltfExtensions.EXT_aabb) {
      o.geometry.boundingBox = new THREE.Box3();
      o.geometry.boundingBox.min.fromArray(o.userData.gltfExtensions.EXT_aabb, 0);
      o.geometry.boundingBox.max.fromArray(o.userData.gltfExtensions.EXT_aabb, 3);
    }
  });
  return o;

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
  /* const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  }); */
  const material = meshComposer.material.clone();
  material.uniforms.map.value = texture;
  material.uniforms.map.needsUpdate = true;

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
const _loadWebBundle = async file => {
  const arrayBuffer = await new Promise((accept, reject) => {
    const fr = new FileReader();
    fr.onload = function() {
      accept(this.result);
    };
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });

  const urls = [];
  const _getUrl = u => {
    const mappedUrl = URL.createObjectURL(new Blob([u], {
      type: 'text/javascript',
    }));
    urls.push(mappedUrl);
    return mappedUrl;
  };
  const urlCache = {};
  const _mapUrl = u => {
    const importUrl = importMap[u];
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

  const mesh = makeIconMesh();
  mesh.geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-1, -1/2, -0.1),
    new THREE.Vector3(1, 1/2, 0.1),
  );
  mesh.frustumCulled = false;
  mesh.run = () => {
    const bundle = new wbn.Bundle(arrayBuffer);
    const u = _mapUrl(bundle.primaryURL);
    import(u)
      .then(() => {
        console.log('import returned');
      }, err => {
        console.warn('import failed', err);
      })
      .finally(() => {
        for (const u of urls) {
          URL.revokeObjectURL(u);
        }
      });
  };
  return mesh;
};
inventory.uploadFile = async file => {
  const bakedFile = await inventory.bakeFile(file);

  /* const mesh = await inventory.loadFileForWorld(bakedFile);
  app.scene.add(mesh); */

  const res = await fetch(storageHost, {
    method: 'POST',
    body: bakedFile,
  });
  const {hash} = await res.json();
  const {name} = bakedFile;
  files.push({
    name,
    hash,
  });
  inventory.dispatchEvent(new MessageEvent('filesupdate', {
    data: files,
  }));
};
bindUploadFileButton(document.getElementById('load-package-input'), inventory.uploadFile);

let files = [];
inventory.getFiles = () => files;
inventory.loadFileForWorld = async file => {
  switch (_getExt(file.name)) {
    case 'gltf':
    case 'glb':
    case 'vrm': {
      return await _loadGltf(file);
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
  }
};

document.addEventListener('dragover', e => {
  e.preventDefault();
});
document.addEventListener('drop', async e => {
  e.preventDefault();

  if (e.dataTransfer.files.length > 0) {
    const [file] = e.dataTransfer.files;
    await inventory.uploadFile(file);
  }
});

export default inventory;