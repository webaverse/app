import * as THREE from './three.module.js';
import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import atlaspack from './atlaspack.js';

const localVector = new THREE.Vector3();

export function jsonParse(s, d = null) {
  try {
    return JSON.parse(s);
  } catch (err) {
    return d;
  }
}
export function parseQuery(queryString) {
  var query = {};
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
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
  const match = fileName.match(/\.([^\.]+)$/);
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
export function bindUploadFileButton(inputFileEl, handleUpload) {
  inputFileEl.addEventListener('change', async e => {
    const {files} = e.target;
    if (files.length === 1) {
      const [file] = files;
      handleUpload(file);
    }

    const {parentNode} = inputFileEl;
    parentNode.removeChild(inputFileEl);
    const newInputFileEl = inputFileEl.ownerDocument.createElement('input');
    newInputFileEl.type = 'file';
    // newInputFileEl.id = 'upload-file-button';
    // newInputFileEl.style.display = 'none';
    newInputFileEl.classList.add('hidden');
    parentNode.appendChild(newInputFileEl);
    bindUploadFileButton(newInputFileEl, handleUpload);
  });
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

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
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

const _makeAtlas = (size, images) => {
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
};
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

export function convertMeshToPhysicsMesh(mesh) {
  mesh.updateMatrixWorld();

  const meshes = [];
  mesh.traverse(o => {
    if (o.isMesh) {
      meshes.push(o);
    }
  });
  const newGeometries = meshes.map(mesh => {
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
      const positions = new Float32Array(geometry.attributes.position.array.length);
      for (let i = 0; i < positions.length; i += 3) {
        localVector
          .fromArray(geometry.attributes.position.array, i)
          .applyMatrix4(mesh.matrixWorld)
          .toArray(positions, i);
      }
      newGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
    
    if (geometry.index) {
      newGeometry.setIndex(geometry.index);
    }
    
    return newGeometry;
  });
  const newGeometry = BufferGeometryUtils.mergeBufferGeometries(newGeometries);
  const physicsMesh = new THREE.Mesh(newGeometry);
  return physicsMesh;
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

export function isInIframe {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}