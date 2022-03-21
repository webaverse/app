import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import atlaspack from './atlaspack.js';
import { getAddressFromMnemonic } from './blockchain.js';
import {playersMapName, tokensHost, storageHost, accountsHost, loginEndpoint, audioTimeoutTime} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

export function jsonParse(s, d = null) {
  try {
    return JSON.parse(s);
  } catch (err) {
    return d;
  }
}
export function parseQuery(queryString) {
  const query = {};
  const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    const k = decodeURIComponent(pair[0]);
    if (k) {
      const v = decodeURIComponent(pair[1] || '');
      query[k] = v;
    }
  }
  return query;
}
export function getRandomString() {
  return Math.random().toString(36).substring(7);
}
export function hex2Uint8Array(hex) {
  return new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)))
}
export function uint8Array2hex(uint8Array) {
  return Array.prototype.map.call(uint8Array, x => ('00' + x.toString(16)).slice(-2)).join('');
}
export function getExt(fileName) {
  const match = fileName
    .replace(/^[a-z]+:\/\/[^\/]+\//, '')
    .match(/\.([^\.]+|t\.js|rtf\.js)(?:\?.*)?$/);
  return match ? match[1].toLowerCase() : '';
}
export function downloadFile(file, filename) {
  const blobURL = URL.createObjectURL(file);
  const tempLink = document.createElement('a');
  tempLink.style.display = 'none';
  tempLink.href = blobURL;
  tempLink.setAttribute('download', filename);

  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
}
export function readFile(file) {
  return new Promise((accept, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      accept(new Uint8Array(fr.result));
    };
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}

export function snapPosition(o, positionSnap) {
  if (positionSnap > 0) {
    o.position.x = Math.round((o.position.x + positionSnap/2) / positionSnap) * positionSnap - positionSnap/2;
    o.position.y = Math.round((o.position.y + positionSnap/2) / positionSnap) * positionSnap - positionSnap/2;
    o.position.z = Math.round((o.position.z + positionSnap/2) / positionSnap) * positionSnap - positionSnap/2;
  }
}
export function snapRotation(o, rotationSnap) {
  o.rotation.x = Math.round(o.rotation.x / rotationSnap) * rotationSnap;
  o.rotation.y = Math.round(o.rotation.y / rotationSnap) * rotationSnap;
  o.rotation.z = Math.round(o.rotation.z / rotationSnap) * rotationSnap;
}

export function makePromise() {
  let accept, reject;
  const p = new Promise((a, r) => {
    accept = a;
    reject = r;
  });
  p.accept = accept;
  p.reject = reject;
  return p;
}

let nextMeshId = 0;
export const getNextMeshId = () => ++nextMeshId;

export function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

export class WaitQueue {
  constructor() {
    this.locked = false;
    this.waiterCbs = [];
  }

  async lock() {
    if (!this.locked) {
      this.locked = true;
    } else {
      const p = makePromise();
      this.waiterCbs.push(p.accept);
      await p;
    }
  }

  async unlock() {
    if (this.waiterCbs.length > 0) {
      this.waiterCbs.pop()();
    } else {
      this.locked = false;
    }
  }

  clearQueue() {
    this.waiterCbs.length = 0;
  }
}

/* const _makeAtlas = (size, images) => {
  let atlasCanvas;
  const rects = [];
  {
    for (let scale = 1; scale > 0; scale *= 0.5) {
      atlasCanvas = document.createElement('canvas');
      atlasCanvas.width = size;
      atlasCanvas.height = size;
      const ctx = atlasCanvas.getContext('2d');
      ctx.fillStyle = '#FFF';
      ctx.fillRect(0, 0, atlasCanvas.width, atlasCanvas.height);
      const atlas = atlaspack(atlasCanvas);
      rects.length = 0;

      let fit = true;
      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        if (image) {
          let rect;
          if (!image.rigid) {
            const w = image.width * scale;
            const h = image.height * scale;
            const resizeCanvas = document.createElement('canvas');
            resizeCanvas.width = w;
            resizeCanvas.height = h;
            const resizeCtx = resizeCanvas.getContext('2d');
            resizeCtx.drawImage(image, 0, 0, w, h);

            rect = atlas.pack(resizeCanvas);
          } else {
            rect = atlas.pack(image);
          }
          if (rect) {
            rects.push(rect.rect);
          } else {
            fit = false;
            break;
          }
        } else {
          rects.push(null);
        }
      }
      if (fit) {
        break;
      }
    }
  }
  return {
    atlasCanvas,
    rects,
  };
}; */
export function mergeMeshes(meshes, geometries, textures) {
  const size = 512;
  const images = textures.map(texture => texture && texture.image);
  const colorsImage = document.createElement('canvas');
  colorsImage.width = size/2;
  colorsImage.height = 1;
  colorsImage.rigid = true;
  const colorsImageCtx = colorsImage.getContext('2d');
  colorsImageCtx.fillStyle = '#FFF';
  colorsImageCtx.fillRect(0, 0,  colorsImage.width,  colorsImage.height);
  const {atlasCanvas, rects} = _makeAtlas(size, images.concat(colorsImage));
  const colorsImageRect = rects[rects.length - 1];
  let colorsImageColorIndex = 0;
  const atlasCanvasCtx = atlasCanvas.getContext('2d');

  const geometry = new THREE.BufferGeometry();
  {
    let numPositions = 0;
    let numIndices = 0;
    for (const geometry of geometries) {
      numPositions += geometry.attributes.position.array.length;
      numIndices += geometry.index.array.length;
    }

    const positions = new Float32Array(numPositions);
    const uvs = new Float32Array(numPositions / 3 * 2);
    const colors = new Float32Array(numPositions);
    const indices = new Uint32Array(numIndices);
    let positionIndex = 0;
    let uvIndex = 0;
    let colorIndex = 0;
    let indicesIndex = 0;
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      const geometry = geometries[i];
      const {material} = mesh;
      const rect = rects[i];

      geometry.applyMatrix4(mesh.matrixWorld);

      const indexOffset = positionIndex / 3;
      if (geometry.index) {
        for (let i = 0; i < geometry.index.array.length; i++) {
          indices[indicesIndex++] = geometry.index.array[i] + indexOffset;
        }
      } else {
        for (let i = 0; i < geometry.attributes.position.array.length / 3; i++) {
          indices[indicesIndex++] = i + indexOffset;
        }
      }

      positions.set(geometry.attributes.position.array, positionIndex);
      positionIndex += geometry.attributes.position.array.length;
      if (geometry.attributes.uv && rect) {
        for (let i = 0; i < geometry.attributes.uv.array.length; i += 2) {
          uvs[uvIndex + i] = rect.x / size + geometry.attributes.uv.array[i] * rect.w / size;
          uvs[uvIndex + i + 1] = rect.y / size + geometry.attributes.uv.array[i + 1] * rect.h / size;
        }
      } else {
        if (material.color) {
          const color = material.color.clone();
          if (material.emissive && material.emissiveIntensity > 0) {
            color.lerp(material.emissive, material.emissiveIntensity);
          }
          atlasCanvasCtx.fillStyle = color.getStyle();
          const uv = new THREE.Vector2(colorsImageRect.x + colorsImageColorIndex, colorsImageRect.y);
          atlasCanvasCtx.fillRect(
            uv.x,
            uv.y,
            uv.x + 1,
            uv.y + 1
          );
          colorsImageColorIndex++;
          uv.x += 0.5;
          uv.y += 0.5;

          for (let i = 0; i < geometry.attributes.uv.array.length; i += 2) {
            uvs[uvIndex + i] = uv.x/size;
            uvs[uvIndex + i + 1] = uv.y/size;
          }
        } else if (material.uniforms && material.uniforms.color1 && material.uniforms.color2) {
          atlasCanvasCtx.fillStyle = material.uniforms.color1.value.getStyle();
          const uv1 = new THREE.Vector2(colorsImageRect.x + colorsImageColorIndex, colorsImageRect.y);
          atlasCanvasCtx.fillRect(
            uv1.x,
            uv1.y,
            uv1.x + 1,
            uv1.y + 1
          );
          colorsImageColorIndex++;
          uv1.x += 0.5;
          uv1.y += 0.5;

          atlasCanvasCtx.fillStyle = material.uniforms.color2.value.getStyle();
          const uv2 = new THREE.Vector2(colorsImageRect.x + colorsImageColorIndex, colorsImageRect.y);
          atlasCanvasCtx.fillRect(
            uv2.x,
            uv2.y,
            uv2.x + 1,
            uv2.y + 1
          );
          colorsImageColorIndex++;
          uv2.x += 0.5;
          uv2.y += 0.5;

          for (let i = 0; i < geometry.attributes.uv.array.length; i += 2) {
            const y = geometry.attributes.uv.array[i];
            const uv = uv1.clone().lerp(uv2, y);

            uvs[uvIndex + i] = uv.x/size;
            uvs[uvIndex + i + 1] = uv.y/size;
          }
        } else {
          throw new Error('failed to uv mesh colors');
        }
      }
      uvIndex += geometry.attributes.position.array.length / 3 * 2;
      if (geometry.attributes.color) {
        colors.set(geometry.attributes.color.array, colorIndex);
      } else {
        colors.fill(1, colorIndex, geometry.attributes.position.array.length);
      }
      colorIndex += geometry.attributes.position.array.length;
    }
    if (textures.some(texture => !!texture)) {
      colors.fill(1);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  }
  geometry.boundingBox = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);

  const texture = new THREE.Texture(atlasCanvas);
  texture.flipY = false;
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    vertexColors: true,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

let nextPhysicsId = 0;
export function getNextPhysicsId() {
  return ++nextPhysicsId;
}

export function convertMeshToPhysicsMesh(topMesh) {
  const oldParent = topMesh.parent;
  oldParent && oldParent.remove(topMesh);

  topMesh.updateMatrixWorld();
  // localMatrix.copy(topMesh.matrix).invert();

  const meshes = [];
  topMesh.traverse(o => {
    if (o.isMesh) {
      meshes.push(o);
    }
  });
  const newGeometries = meshes.map(mesh => {
    const {geometry} = mesh;
    const newGeometry = new THREE.BufferGeometry();
    /* if (mesh.isSkinnedMesh) {
      console.log('compile skinned mesh', mesh);
    } */
    // localMatrix2.multiplyMatrices(localMatrix, mesh.isSkinnedMesh ? topMesh.matrixWorld : mesh.matrixWorld);
    if (mesh.isSkinnedMesh) {
      localMatrix2.identity();
    } else {
      localMatrix2.copy(mesh.matrixWorld);
    }

    if (geometry.attributes.position.isInterleavedBufferAttribute) {
      const positions = new Float32Array(geometry.attributes.position.count * 3);
      for (let i = 0, j = 0; i < positions.length; i += 3, j += geometry.attributes.position.data.stride) {
        localVector
          .fromArray(geometry.attributes.position.data.array, j)
          .applyMatrix4(localMatrix2)
          .toArray(positions, i);
      }
      newGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    } else {
      const positions = new Float32Array(geometry.attributes.position.array.length);
      for (let i = 0; i < positions.length; i += 3) {
        localVector
          .fromArray(geometry.attributes.position.array, i)
          .applyMatrix4(localMatrix2)
          .toArray(positions, i);
      }
      newGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
    
    if (geometry.index) {
      newGeometry.setIndex(geometry.index);
    }
    
    return newGeometry;
  });
  if (oldParent) {
    oldParent.add(topMesh);
    topMesh.updateMatrixWorld();
  }
  if (newGeometries.length > 0) {
    const newGeometry = BufferGeometryUtils.mergeBufferGeometries(newGeometries);
    const physicsMesh = new THREE.Mesh(newGeometry);
    /* physicsMesh.position.copy(topMesh.position);
    physicsMesh.quaternion.copy(topMesh.quaternion);
    physicsMesh.scale.copy(topMesh.scale);
    physicsMesh.matrix.copy(topMesh.matrix);
    physicsMesh.matrixWorld.copy(topMesh.matrixWorld); */
    physicsMesh.visible = false;
    return physicsMesh;
  } else {
    const physicsMesh = new THREE.Mesh();
    physicsMesh.visible = false;
    return physicsMesh;
  }
  
}

export function parseCoord(s) {
  if (s) {
    const split = s.match(/^\[(-?[0-9\.]+),(-?[0-9\.]+),(-?[0-9\.]+)\]$/);
    let x, y, z;
    if (split && !isNaN(x = parseFloat(split[1])) && !isNaN(y = parseFloat(split[2])) && !isNaN(z = parseFloat(split[3]))) {
      return new THREE.Vector3(x, y, z);
    } else {
      return null;
    }
  } else {
    return null;
  }
}

export function parseExtents(s) {
  if (s) {
    const split = s.match(/^\[\[(-?[0-9\.]+),(-?[0-9\.]+),(-?[0-9\.]+)\],\[(-?[0-9\.]+),(-?[0-9\.]+),(-?[0-9\.]+)\]\]$/);
    let x1, y1, z1, x2, y2, z2;
    if (split && !isNaN(x1 = parseFloat(split[1])) && !isNaN(y1 = parseFloat(split[2])) && !isNaN(z1 = parseFloat(split[3])) && !isNaN(x2 = parseFloat(split[4])) && !isNaN(y2 = parseFloat(split[5])) && !isNaN(z2 = parseFloat(split[6]))) {
      return new THREE.Box3(
        new THREE.Vector3(x1, y1, z1),
        new THREE.Vector3(x2, y2, z2)
      );
    } else {
      return null;
    }
  } else {
    return null;
  }
}

export function isInIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export async function contentIdToFile(contentId) {
  let token = null;
  if (typeof contentId === 'number') {
    const res = await fetch(`${tokensHost}/${contentId}`);
    token = await res.json();
    const {hash, name, ext} = token.properties;

    const res2 = await fetch(`${storageHost}/${hash}`);
    const file = await res2.blob();
    file.name = `${name}.${ext}`;
    file.token = token;
    return file;
  } else if (typeof contentId === 'string') {
    let url, name;
    if (/blob:/.test(contentId)) {
      const match = contentId.match(/^(.+)\/([^\/]+)$/);
      if (match) {
        url = match[1];
        name = match[2];
      } else {
        console.warn('blob url not appended with /filename.ext and cannot be interpreted', contentId);
        return null;
      }
    } else {
      url = contentId;
      name = contentId;
    }
    return {
      url,
      name,
      token,
    };
  } else {
    console.warn('unknown content id type', contentId);
    return null;
  }
}

export const addDefaultLights = (scene, {
  shadowMap = false,
} = {}) => {
  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2);
  scene.add(ambientLight);
  scene.ambientLight = ambientLight;
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 2);
  directionalLight.position.set(1, 2, 3);
  scene.add(directionalLight);
  scene.directionalLight = directionalLight;
  /* if (shadowMap) {
    const SHADOW_MAP_WIDTH = 1024;
    const SHADOW_MAP_HEIGHT = 1024;

    directionalLight.castShadow = true;

    directionalLight.shadow.camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 50 );
    // directionalLight.shadow.bias = 0.0001;

    directionalLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    directionalLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
  } */
};

export const unFrustumCull = o => {
  o.traverse(o => {
    if (o.isMesh) {
      o.frustumCulled = false;
    }
  });
};

export const enableShadows = o => {
  o.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
};

export const capitalize = s => s[0].toUpperCase() + s.slice(1);

export const epochStartTime = Date.now();

export const flipGeomeryUvs = geometry => {
  for (let i = 0; i < geometry.attributes.uv.array.length; i += 2) {
    const j = i + 1;
    geometry.attributes.uv.array[j] = 1 - geometry.attributes.uv.array[j];
  }
};

export const updateRaycasterFromMouseEvent = (() => {
  const localVector2D = new THREE.Vector2();
  return (renderer, camera, e, raycaster) => {
    const mouse = localVector2D;
    mouse.x = (e.clientX / renderer.domElement.width * renderer.getPixelRatio()) * 2 - 1;
    mouse.y = -(e.clientY / renderer.domElement.height * renderer.getPixelRatio()) * 2 + 1;
    raycaster.setFromCamera(
      mouse,
      camera
    );
  };
})();
export const getCameraUiPlane = (camera, distance, plane) => {
  plane.setFromNormalAndCoplanarPoint(
    localVector3
      .set(0, 0, 1)
      .applyQuaternion(camera.quaternion),
    localVector4
      .copy(camera.position)
      .add(
        localVector5
          .set(0, 0, -distance)
          .applyQuaternion(camera.quaternion)
      )
  );
  return plane;
};
export const getUiForwardIntersection = (() => {
  const localRaycaster = new THREE.Raycaster();
  const localPlane = new THREE.Plane();
  return (renderer, camera, e, v) => {
    updateRaycasterFromMouseEvent(renderer, camera, e, localRaycaster);
    // project mesh outwards
    const cameraUiPlane = getCameraUiPlane(camera, 2, localPlane);
    const intersection = localRaycaster.ray.intersectPlane(cameraUiPlane, v);
    return intersection;
  };
})();

export function makeId(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function contentIdToStorageUrl(id) {
  if (typeof id === 'number') {
    const hash = await contracts.mainnetsidechain.NFT.methods.getHash(id + '').call();
    return `${storageHost}/${hash}`;
  } else if (typeof id === 'string') {
    return id;
  } else {
    return null;
  }
}

async function pullUserObject(loginToken) {
  const address = getAddressFromMnemonic(loginToken.mnemonic);
  const res = await fetch(`${accountsHost}/${address}`);
  var result = await res.json();
  result.mnemonic = loginToken.mnemonic;
  return result;
}

export const handleDiscordLogin = async (code, id) => {
  if (!code) {
    return;
  }
  try{
    let res = await fetch(loginEndpoint + `?discordid=${encodeURIComponent(id)}&discordcode=${encodeURIComponent(code)}&redirect_uri=${window.location.origin}/login`, {
      method: 'POST',
    });
    res = await res.json();
    if (!res.error) {
      return await pullUserObject(res);
    } else {
      //console.warn('Unable to login ', res.error);
      return res;
    }
  }catch(e){
    
  }
};

export function mod(a, n) {
  return (a % n + n) % n;
}

export function angleDifference(angle1, angle2) {
  let a = angle2 - angle1;
  a = mod(a + Math.PI, Math.PI*2) - Math.PI;
  return a;
}

export function getVelocityDampingFactor(dampingPer60Hz, timeDiff) {
  return Math.pow(dampingPer60Hz, timeDiff / 60);
}

export function getPlayerPrefix(playerId) {
  return playersMapName + '.' + playerId;
}

/* export function fitCameraToBox(camera, boundingBox, fitOffset = 1) {
  const center = boundingBox.getCenter(localVector);
  const size = boundingBox.getSize(localVector2);

  const maxSize = Math.max( size.x, size.y, size.z );
  const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * camera.fov / 360 ) );
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance );

  camera.position.z = distance;
  // camera.lookAt(center);
  camera.updateMatrixWorld();
} */

export function fitCameraToBoundingBox(camera, box, fitOffset = 1) {
  const size = box.getSize(localVector);
  const center = box.getCenter(localVector2);
  
  const maxSize = Math.max( size.x, size.y, size.z );
  const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * camera.fov / 360 ) );
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);
  
  const direction = center.clone()
    .sub(camera.position)
    .normalize()
    .multiplyScalar(distance);

  camera.position.copy(center).add(direction);
  camera.quaternion.setFromRotationMatrix(
    localMatrix.lookAt(
      camera.position,
      center,
      camera.up,
    )
  );
}

export function applyVelocity(position, velocity, timeDiffS) {
  position.add(localVector.copy(velocity).multiplyScalar(timeDiffS));
}

export function copyPQS(dst, src) {
  dst.position.copy(src.position);
  dst.quaternion.copy(src.quaternion);
  dst.scale.copy(src.scale);
}

export async function loadJson(u) {
  const res = await fetch(u);
  return await res.json();
}
export async function loadAudio(u) {
  const audio = new Audio();
  const p = new Promise((accept, reject) => {
    const timeout = setTimeout(() => {
      console.warn('audio load seems hung', audio);
    }, audioTimeoutTime);
    const _cleanup = () => {
      clearTimeout(timeout);
    };
    audio.oncanplay = () => {
      _cleanup();
      accept();
    };
    audio.onerror = err => {
      _cleanup();
      reject(err);
    };
  });
  // console.log('got src', `../sounds/${soundType}/${fileName}`);
  audio.crossOrigin = 'Anonymous';
  audio.src = u;
  audio.load();
  await p;
  // document.body.appendChild(audio);
  return audio;
}
export async function loadAudioBuffer(audioContext, url) {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
}
export const memoize = fn => {
  let loaded = false;
  let cache = null;
  return () => {
    if (!loaded) {
      cache = fn();
      loaded = true;
    }
    return cache;
  };
};
export function shuffle(array, rng = Math.random) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(rng() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}
export const waitForFrame = () => new Promise(accept => {
  requestAnimationFrame(() => {
    accept();
  });
});

const doUpload = async (u, f) => {
  const res = await fetch(u, {
    method: 'POST',
    body: f,
  });
  const hashes = await res.json();
  return hashes;
}
export const proxifyUrl = u => {
  const match = u.match(/^([a-z0-9]+):\/\/([a-z0-9\-\.]+)(.+)$/i);
  if (match) {
    return 'https://' + match[1] + '-' + match[2].replace(/\-/g, '--').replace(/\./g, '-') + '.proxy.webaverse.com' + match[3];
  } else {
    return u;
  }
};
export const handleUpload = async (
  item,
  {
    onProgress = null,
  } = {}
) => {
  console.log('uploading...');
  
  const _uploadObject = async item => {
    let u;
    
    if (item instanceof FileList) {
      const formData = new FormData();

      formData.append(
        '',
        new Blob([], {
          type: 'application/x-directory',
        }),
        ''
      );

      const files = item;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        formData.append(file.name, file, file.name);
      }

      const hashes = await doUpload(`https://ipfs.webaverse.com/`, formData, {
        onProgress,
      });

      const rootDirectory = hashes.find(h => h.name === '');
      const rootDirectoryHash = rootDirectory.hash;
      u = `https://ipfs.webaverse.com/ipfs/${rootDirectoryHash}/`;
      // console.log(u);
    } else {
      const file = item.getAsFile();
      const entry = item.webkitGetAsEntry();
      
      if (item.kind === 'string') {
        const s = await new Promise((accept, reject) => {
          item.getAsString(accept);
        });
        const j = JSON.parse(s);
        const {token_id, asset_contract} = j;
        const {address} = asset_contract;
        
        if (contractNames[address]) {
          u = `/@proxy/` + encodeURI(`eth://${address}/${token_id}`);
        } else {
          console.log('got j', j);
          const {traits} = j;
          // cryptovoxels wearables
          const voxTrait = traits.find(t => t.trait_type === 'vox'); // XXX move to a loader
          if (voxTrait) {
            const {value} = voxTrait;
            u = proxifyUrl(value) + '?type=vox';
          } else {
            const {token_metadata} = j;
            // console.log('proxify', token_metadata);
            const res = await fetch(proxifyUrl(token_metadata), {
              mode: 'cors',
            });
            const j2 = await res.json();
            // console.log('got metadata', j2);
            
            // dcl wearables
            if (j2.id?.startsWith('urn:decentraland:')) {
              // 'urn:decentraland:ethereum:collections-v1:mch_collection:mch_enemy_upper_body'
              const res = await fetch(`https://peer-lb.decentraland.org/lambdas/collections/wearables?wearableId=${j2.id}`, { // XXX move to a loader
                mode: 'cors',
              });
              const j3 = await res.json();
              const {wearables} = j3;
              const wearable = wearables[0];
              const representation = wearable.data.representations[0];
              const {mainFile, contents} = representation;
              const file = contents.find(f => f.key === mainFile);
              const match = mainFile.match(/\.([a-z0-9]+)$/i);
              const type = match && match[1];
              // console.log('got wearable', {mainFile, contents, file, type});
              u = '/@proxy/' + encodeURI(file.url) + (type ? ('?type=' + type) : '');
            } else {
              // avatar
              const {avatar_url, asset} = j2;
              const avatarUrl = avatar_url || asset;
              if (avatarUrl) {
                u = '/@proxy/' + encodeURI(avatarUrl) + '?type=vrm';
              } else {
                // default
                const {image} = j2;
                u = '/@proxy/' + encodeURI(image);
              }
            }
          }
        }
      } else if (entry.isDirectory) {
        const formData = new FormData();
        
        const rootEntry = entry;
        const _recurse = async entry => {
          function getFullPath(entry) {
            return entry.fullPath.slice(rootEntry.fullPath.length);
          }
          const fullPath = getFullPath(entry);
          // console.log('directory full path', entry.fullPath, rootEntry.fullPath, fullPath);
          formData.append(
            fullPath,
            new Blob([], {
              type: 'application/x-directory',
            }),
            fullPath
          );
          
          const reader = entry.createReader();
          async function readEntries() {
            const entries = await new Promise((accept, reject) => {
              reader.readEntries(entries => {
                if (entries.length > 0) {
                  accept(entries);
                } else {
                  accept(null);
                }
              }, reject);
            });
            return entries;
          }
          let entriesArray;
          while (entriesArray = await readEntries()) {
            for (const entry of entriesArray) {
              if (entry.isFile) {
                const file = await new Promise((accept, reject) => {
                  entry.file(accept, reject);
                });
                const fullPath = getFullPath(entry);

                formData.append(fullPath, file, fullPath);
              } else if (entry.isDirectory) {
                await _recurse(entry);
              }
            }
          } 
        };
        await _recurse(rootEntry);

        const hashes = await doUpload(`https://ipfs.webaverse.com/`, formData, {
          onProgress,
        });

        const rootDirectory = hashes.find(h => h.name === '');
        const rootDirectoryHash = rootDirectory.hash;
        u = `https://ipfs.webaverse.com/ipfs/${rootDirectoryHash}/`;
        console.log(u);
      } else {
        const j = await doUpload(`https://ipfs.webaverse.com/`, file, {
          onProgress,
        });
        const {hash} = j;
        const {name} = file;

        u = `${storageHost}/${hash}/${name}`;
      }
    }
    return u;
  };
  const u = await _uploadObject(item);
  console.log('upload complete:', u);
  return u;
};

export const loadImage = u => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    resolve(img);
  };
  img.onerror = reject;
  img.crossOrigin = 'Anonymous';
  img.src = u;
});