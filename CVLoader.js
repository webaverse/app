import * as THREE from 'https://lib.webaverse.com/three.js';
import {GLTFLoader} from 'https://lib.webaverse.com/GLTFLoader.js';
import {VOXLoader} from 'https://lib.webaverse.com/VOXLoader.js';
import pako from 'pako';
// import {OrbitControls} from 'https://lib.webaverse.com/OrbitControls.js';

// './pako.js';
// './pako_inflate.js';

// import {getBasisTransform, axesToAsciiImage, stringToAxes} from './basis.js';
// const inversionMatrix = new THREE.Matrix4();
// const unityTransform = getBasisTransform('-X+Y+Z', '+X+Y+Z', inversionMatrix);

function convertDataURIToBinary(base64) {
  var raw = window.atob(base64);
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}

const _getParcel = (x, z, parcels) => parcels.find(parcel => {
  return x >= parcel.x1 && x < parcel.x2 && z >= parcel.z1 && z < parcel.z2;
});
const _getContent = async (id, hash) => {
  const res = await fetch(`https://https-js-cryptovoxels-com.proxy.webaverse.com/grid/parcels/${id}/at/${hash}`);
  const j = await res.json();
  const {parcel} = j;
  return parcel;
};

const _getTextureMaterial = u => {
  const img = new Image();
  img.onload = () => {
    texture.needsUpdate = true;
  };
  img.onerror = err => {
    console.warn(err);
  };
  img.crossOrigin = 'Anonymous';
  img.src = u;
  const texture = new THREE.Texture(img);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    // transparent: true,
  });
  material.polygonOffset = true;
  material.polygonOffsetFactor = -1.0;
  material.polygonOffsetUnits = -4.0;
  return material;
};
const _getTextureMaterialCached = (() => {
  const cache = {};
  return u => {
    let entry = cache[u];
    if (!entry) {
      entry = _getTextureMaterial(u);
      cache[u] = entry;
    }
    return entry;
  };
})();
const zoom = 8;
const tileRange = 4;
const centerTile = 128;
const tilePixelWidth = 256;
const numTiles = tileRange*2;
const mapSize = 1000*2*(1 + 1/numTiles);
// const tileVoxelWidth = mapSize/4/numTiles;

const _loadVox = async u => {
  let o = await new Promise((accept, reject) => {
    new VOXLoader().load(u, accept, function onprogress() {}, reject);
  });
  const {geometry} = o;
  const positions = geometry.attributes.position.array;
  const normals = geometry.attributes.normal.array;
  // const indices = geometry.index.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = -positions[i];
    
    normals[i] *= -1;
    normals[i+1] *= -1;
    normals[i+2] *= -1;
  }
  const indices = new Uint32Array(positions.length/3);
  for (let i = 0; i < indices.length; i += 3) {
    indices[i] = i;
    indices[i+1] = i+2;
    indices[i+2] = i+1;
  }
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return o;
};
const _loadVoxCached = (() => {
  const cache = {};
  return async u => {
    let entry = cache[u];
    if (!entry) {
      entry = await _loadVox(u);
      cache[u] = entry;
    }
    return entry.clone();
  };
})();

function GetVoxel(field, width, height, depth, x, y, z) {
    if (x < 0 || y < 0 || z < 0 || x >= width * 2 || y >= height * 2 || z >= depth * 2)
    {
        return 0;
    }
    else
    {
        const index = z + y*(depth*2) + x*(depth*2)*(height*2);
        return field[index];
    }
}
function AddUvs(index, transparent, uvs, uvIndex)
{
    if (transparent)
    {
        uvs[uvIndex++] = 0;
        uvs[uvIndex++] = 0;
        uvs[uvIndex++] = 1;
        uvs[uvIndex++] = 0;
        uvs[uvIndex++] = 0;
        uvs[uvIndex++] = 1;
        uvs[uvIndex++] = 1;
        uvs[uvIndex++] = 1;

        return uvIndex;
    }

    const s = 1.0 / 16 / 128 * 128;

    // long textureIndex = index - (1 << 15);
    const textureIndex = index % 16;
    // const textureIndex = index & 15;

    // if (textureIndex >= 32) {
    //   // inverted
    //   textureIndex = (textureIndex % 32) * 2 + 1
    // } else {
    //   textureIndex = (textureIndex % 32) * 2
    // }

    let x = 1.0 / 4 * ((textureIndex % 4) + 0.5);
    let y = 1.0 / 4 * (Math.floor(textureIndex / 4.0) + 0.5);

    y = 1.0 - y;

    uvs[uvIndex++] = x - s;
    uvs[uvIndex++] = y - s;
    uvs[uvIndex++] = x + s;
    uvs[uvIndex++] = y - s;
    uvs[uvIndex++] = x - s;
    uvs[uvIndex++] = y + s;
    uvs[uvIndex++] = x + s;
    uvs[uvIndex++] = y + s;

    return uvIndex;
}
const _colorTable = [
    new THREE.Color(0xffffff),
    new THREE.Color(0x888888),
    new THREE.Color(0x000000),
    new THREE.Color(0xff71ce),
    new THREE.Color(0x01cdfe),
    new THREE.Color(0x05ffa1),
    new THREE.Color(0xb967ff),
    new THREE.Color(0xfffb96),
];
const white = new THREE.Color(0xFFFFFF);
const red = new THREE.Color(0xFF0000);

function UIntToColor(color)
{
    //string binary = Convert.ToString(color, 2);
    //binary = binary.Remove(binary.Length - 2 - 1, 2);
    //uint newValue = Convert.ToUInt32(binary, 2);
    //uint c = color;// - (byte) color;//  (byte)(color & ~(1 << 4));
    // string debug = "";
    if (color >= 32768)
    {
        color -= 32768;
        // debug += "big ";
    }

    if (color === 0)
    {
        return white;
    }

    if (color > 32)
    {
        //uint colorIndex = (uint)Mathf.Floor(color / 32.0f);
        //Debug.Log(color-32);
        
        const index = Math.floor(color / 32);
        if (index >= _colorTable.length) {
            return red;
        }
        return _colorTable[index];
    }
    return white;

}

function IsTransparent(index) {
    return index <= 2;
}
function IsGeometry(index, transparent) {
    return transparent ? index == 2 : index > 2;
}
function GenerateField(field, width, height, depth, transparent) { 
  const newVertices = new Float32Array(1024 * 1024);
  const newUV = new Float32Array(1024 * 1024);
  const indices = new Uint32Array(1024 * 1024);
  const newColor = new Float32Array(1024 * 1024);
  
  let vertexIndex = 0;
  let uvIndex = 0;
  let indexIndex = 0;
  let colorIndex = 0;

  for (let x = -1; x < width * 2; x++)
  {
      for (let y = -1; y < height * 2; y++)
      {
          for (let z = -1; z < depth * 2; z++)
          {
              const i = GetVoxel(field, width, height, depth, x, y, z);
              const nX = GetVoxel(field, width, height, depth, x + 1, y, z);
              const nY = GetVoxel(field, width, height, depth, x, y + 1, z);
              const nZ = GetVoxel(field, width, height, depth, x, y, z + 1);

              if (IsGeometry(i, transparent) !== IsGeometry(nX, transparent))
              {
                  const v = vertexIndex/3;

                  /* newVertices.Add(new Vector3(x + 1, y + 1, z));
                  newVertices.Add(new Vector3(x + 1, y + 1, z + 1));
                  newVertices.Add(new Vector3(x + 1, y, z));
                  newVertices.Add(new Vector3(x + 1, y, z + 1)); */

                  newVertices[vertexIndex++] = x + 1;
                  newVertices[vertexIndex++] = y + 1;
                  newVertices[vertexIndex++] = z;
                  newVertices[vertexIndex++] = x + 1;
                  newVertices[vertexIndex++] = y + 1;
                  newVertices[vertexIndex++] = z + 1;
                  newVertices[vertexIndex++] = x + 1;
                  newVertices[vertexIndex++] = y;
                  newVertices[vertexIndex++] = z;
                  newVertices[vertexIndex++] = x + 1;
                  newVertices[vertexIndex++] = y;
                  newVertices[vertexIndex++] = z + 1;
                  
                  if (i > nX)
                  {
                      indices[indexIndex++] = v + 0;
                      indices[indexIndex++] = v + 1;
                      indices[indexIndex++] = v + 2;

                      indices[indexIndex++] = v + 1;
                      indices[indexIndex++] = v + 3;
                      indices[indexIndex++] = v + 2;
                      
                      uvIndex = AddUvs(i, transparent, newUV, uvIndex);

                      const c = UIntToColor(i);
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                  }
                  else
                  {
                      indices[indexIndex++] = v + 2;
                      indices[indexIndex++] = v + 1;
                      indices[indexIndex++] = v + 0;

                      indices[indexIndex++] = v + 2;
                      indices[indexIndex++] = v + 3;
                      indices[indexIndex++] = v + 1;

                      uvIndex = AddUvs(nX, transparent, newUV, uvIndex);
                      
                      const c = UIntToColor(nX);
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                  }
              }

              if (IsGeometry(i, transparent) !== IsGeometry(nY, transparent))
              {
                  const v = vertexIndex/3;
                  
                  /* newVertices.Add(new Vector3(x, y + 1, z));
                  newVertices.Add(new Vector3(x + 1, y + 1, z));
                  newVertices.Add(new Vector3(x, y + 1, z + 1));
                  newVertices.Add(new Vector3(x + 1, y + 1, z + 1)); */
                  
                  newVertices[vertexIndex++] = x;
                  newVertices[vertexIndex++] = y + 1;
                  newVertices[vertexIndex++] = z;
                  newVertices[vertexIndex++] = x + 1;
                  newVertices[vertexIndex++] = y + 1;
                  newVertices[vertexIndex++] = z;
                  newVertices[vertexIndex++] = x;
                  newVertices[vertexIndex++] = y + 1;
                  newVertices[vertexIndex++] = z + 1;
                  newVertices[vertexIndex++] = x + 1;
                  newVertices[vertexIndex++] = y + 1;
                  newVertices[vertexIndex++] = z + 1;

                  if (i < nY)
                  {
                      indices[indexIndex++] = v + 0;
                      indices[indexIndex++] = v + 1;
                      indices[indexIndex++] = v + 2;

                      indices[indexIndex++] = v + 1;
                      indices[indexIndex++] = v + 3;
                      indices[indexIndex++] = v + 2;

                      uvIndex = AddUvs(nY, transparent, newUV, uvIndex);
                      
                      const c = UIntToColor(nY);
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                  }
                  else
                  {
                      indices[indexIndex++] = v + 2;
                      indices[indexIndex++] = v + 1;
                      indices[indexIndex++] = v + 0;

                      indices[indexIndex++] = v + 2;
                      indices[indexIndex++] = v + 3;
                      indices[indexIndex++] = v + 1;

                      uvIndex = AddUvs(i, transparent, newUV, uvIndex);
                      
                      const c = UIntToColor(i);
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                  }

              }

              if (IsGeometry(i, transparent) !== IsGeometry(nZ, transparent))
              {
                  const v = vertexIndex/3;

                  /* newVertices.Add(new Vector3(x, y, z + 1));
                  newVertices.Add(new Vector3(x + 1, y, z + 1));
                  newVertices.Add(new Vector3(x, y + 1, z + 1));
                  newVertices.Add(new Vector3(x + 1, y + 1, z + 1)); */

                  newVertices[vertexIndex++] = x;
                  newVertices[vertexIndex++] = y;
                  newVertices[vertexIndex++] = z + 1;
                  newVertices[vertexIndex++] = x + 1;
                  newVertices[vertexIndex++] = y;
                  newVertices[vertexIndex++] = z + 1;
                  newVertices[vertexIndex++] = x;
                  newVertices[vertexIndex++] = y + 1;
                  newVertices[vertexIndex++] = z + 1;
                  newVertices[vertexIndex++] = x + 1;
                  newVertices[vertexIndex++] = y + 1;
                  newVertices[vertexIndex++] = z + 1;

                  if (i > nZ)
                  {
                      indices[indexIndex++] = v + 0;
                      indices[indexIndex++] = v + 1;
                      indices[indexIndex++] = v + 2;

                      indices[indexIndex++] = v + 1;
                      indices[indexIndex++] = v + 3;
                      indices[indexIndex++] = v + 2;

                      uvIndex = AddUvs(i, transparent, newUV, uvIndex);
                      
                      const c = UIntToColor(i);
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                  }
                  else
                  {
                      indices[indexIndex++] = v + 2;
                      indices[indexIndex++] = v + 1;
                      indices[indexIndex++] = v + 0;

                      indices[indexIndex++] = v + 2;
                      indices[indexIndex++] = v + 3;
                      indices[indexIndex++] = v + 1;

                      uvIndex = AddUvs(nZ, transparent, newUV, uvIndex);

                      const c = UIntToColor(nZ);
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                      c.toArray(newColor, colorIndex);
                      colorIndex += 3;
                  }
              }
          }
      }
  }
  for (let i = 0; i < vertexIndex; i += 3) {
    newVertices[i] = -newVertices[i];
  }
  for (let i = 0; i < indexIndex; i += 3) {
    const a = indices[i+1];
    indices[i+1] = indices[i];
    indices[i] = a;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(newVertices.subarray(0, vertexIndex), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(newUV.subarray(0, uvIndex), 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(newColor.subarray(0, colorIndex), 3));
  geometry.setIndex(new THREE.BufferAttribute(indices.subarray(0, indexIndex), 1));
  return geometry;
}
const _getCoord = (x, z) => parcels.find(parcel);

class CVLoader {
  async load(x, z) {
    const scene = new THREE.Object3D();
    
    const parcels = await (async () => {
      const res = await fetch(`https://https-www-cryptovoxels-com.proxy.webaverse.com/api/parcels/cached.json`);
      const j = await res.json();
      const {parcels} = j;
      return parcels;
    })();
    console.log('got parcels', parcels);

    // const x = -3;
    // const z = -3;
    /* const floorMesh = (() => {
      const geometry = new THREE.PlaneBufferGeometry(mapSize, mapSize)
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)));

      const canvas = document.createElement('canvas');
      canvas.width = numTiles*tilePixelWidth;
      canvas.height = numTiles*tilePixelWidth;
      (async () => {
        const ctx = canvas.getContext('2d');
        for (let dx = -tileRange; dx < tileRange; dx++) {
          for (let dz = -tileRange; dz < tileRange; dz++) {
            const x = centerTile + dx;
            const z = centerTile + dz;
            const img = await new Promise((accept, reject) => {
              const img = new Image();
              img.src = `https://map.cryptovoxels.com/tile/?z=${zoom}&x=${x}&y=${z}`;
              img.crossOrigin = 'Anonymous';
              img.onload = () => {
                accept(img);
              };
              img.onerror = reject;
            });
            ctx.drawImage(img, (dx+tileRange)*tilePixelWidth, (dz+tileRange)*tilePixelWidth);
            // document.body.appendChild(img);
            // console.log('append', img, img.src, (dx+tileRange)*tilePixelWidth, (dz+tileRange)*tilePixelWidth);
            texture.needsUpdate = true;
          }
        }
      })().catch(err => {
        console.warn(err);
      });
      const texture = new THREE.Texture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
      });
      const mesh = new THREE.Mesh(geometry, material);
      // mesh.position.x = -tileVoxelWidth/2;
      // mesh.position.z = -tileVoxelWidth/2;
      mesh.position.y = -0.1;
      mesh.frustumCulled = false;
      return mesh;
    })();
    scene.add(floorMesh); */

    /* const cubeMesh2 = (() => {
      const geometry = new THREE.BoxBufferGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0xFF0000,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      return mesh;
    })();
    cubeMesh2.position.x = 20;
    cubeMesh2.position.z = 20;
    scene.add(cubeMesh2); */

    const imageGeometry = new THREE.PlaneBufferGeometry(2, 2)
      .applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
    for (let i = 0; i < imageGeometry.index.array.length; i += 3) {
      const a = imageGeometry.index.array[i+1];
      imageGeometry.index.array[i+1] = imageGeometry.index.array[i];
      imageGeometry.index.array[i] = a;
    }

    const tileMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000FF,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const parcel = _getParcel(x, z, parcels);
    // console.log('load coord', x, z, parcel);

    const object = new THREE.Object3D();
    {
      const {id, hash} = parcel;
      const content = await _getContent(id, hash);
      
      let {voxels, palette, tileset, features, x1, x2, y1, y2, z1, z2} = content;
      if (tileset) {
        tileset = `https://https-cdn-cryptovoxels-com.proxy.webaverse.com${tileset}`;
      } else {
        tileset = `https://https-www-cryptovoxels-com.proxy.webaverse.com/textures/atlas-ao.png`;
      }
      const w = x2 - x1;
      const h = y2 - y1;
      const d = z2 - z1;
      const field = new Uint16Array(pako.inflate(convertDataURIToBinary(voxels)).buffer);

      object.position.x = x1*2;
      object.position.z = -z1*2;
      object.rotation.order = 'YXZ';
      object.rotation.y = Math.PI;

      console.log('got content', content, w, h, d, w*h*d);
      const solidGeometry = GenerateField(field, w, h, d, false);
      const transparentGeometry = GenerateField(field, w, h, d, true);
      console.log('got geometries', {solidGeometry, transparentGeometry});

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = tileset;
      img.onload = () => {
        texture.needsUpdate = true;
      };
      img.onerror = err => {
        console.warn(err.stack);
      };
      const texture = new THREE.Texture(img);

      {
        solidGeometry.computeVertexNormals();
        const material = new THREE.MeshPhongMaterial({
          // color: 0xFF0000,
          map: texture,
          vertexColors: true,
        });
        const mesh = new THREE.Mesh(solidGeometry, material);
        mesh.frustumCulled = false;
        object.add(mesh);
      }
      {
        transparentGeometry.computeVertexNormals();
        const material = new THREE.MeshPhongMaterial({
          // map: texture,
          // color: 0xFFFFFF,
          vertexColors: true,
          transparent: true,
          opacity: 0.5,
        });
        const mesh = new THREE.Mesh(transparentGeometry, material);
        mesh.frustumCulled = false;
        object.add(mesh);
      }
      for (const feature of features) {
        // console.log('got feature', feature);

        try {
          const {type} = feature;
          switch (type) {
            case 'image': {
              const {url, position, rotation, scale} = feature;
              const u = new URL(url);
              u.host = u.protocol.replace(/:/g, '-') + u.host.replace(/\./g, '-') + '.proxy.webaverse.com';
              // console.log('got u', u.href);
              const geometry = imageGeometry;
              const material = _getTextureMaterialCached(u.href);
              const mesh = new THREE.Mesh(geometry, material);
              mesh.frustumCulled = false;
              mesh.position.fromArray(position);
              mesh.position.x *= -1;
              mesh.position.multiplyScalar(2);
              mesh.position.x -= w - 0.5;
              mesh.position.y += 0.5;
              mesh.position.z += d - 0.5;
              // console.log('pos x 1', url, position, mesh);
              mesh.rotation.order = 'YXZ';
              mesh.rotation.fromArray(rotation);
              mesh.rotation.y *= -1;
              mesh.rotation.z *= -1;
              mesh.scale.fromArray(scale);
              object.add(mesh);
              break;
            }
            case 'nft-image': {
              const {url, position, rotation, scale} = feature;
              const match = url.match(/https:\/\/opensea\.io\/assets\/([^\/]+)\/([0-9]+)$/);
              if (match) {
                const contract = match[1];
                const token = match[2];
                const u = `https://https-img-cryptovoxels-com.proxy.webaverse.com/node/opensea?contract=${contract}&token=${token}&force_update=0`;
                const res = await fetch(u);
                const j = await res.json();
                const {image_url} = j;
                const geometry = imageGeometry;
                const material = _getTextureMaterialCached(image_url);
                const mesh = new THREE.Mesh(geometry, material);
                mesh.frustumCulled = false;
                mesh.position.fromArray(position);
                mesh.position.x *= -1;
                mesh.position.multiplyScalar(2);
                mesh.position.x -= w - 0.5;
                mesh.position.y += 0.5;
                mesh.position.z += d - 0.5;
                // console.log('pos x 2', url, position, mesh);
                mesh.rotation.order = 'YXZ';
                mesh.rotation.fromArray(rotation);
                mesh.rotation.y *= -1;
                mesh.rotation.z *= -1;
                mesh.scale.fromArray(scale);
                object.add(mesh);
              }
              break;
            }
            case 'vox-model': {
              const {url, position, rotation, scale, flipX} = feature;
              // const u = new URL(url);
              // u.host = u.protocol.replace(/:/g, '-') + u.host.replace(/\./g, '-') + '.proxy.webaverse.com';
              // const model = await _loadVoxCached(u.href);
              const u = `https://https-cdn-cryptovoxels-com.proxy.webaverse.com/node/vox?url=${encodeURI(url)}`;
              const model = await _loadVoxCached(u);
              console.log('got u', u.href, model, {w, h, d, position, rotation, scale});
              model.position.fromArray(position);
              model.position.x *= -1;
              model.position.multiplyScalar(2);
              model.position.x -= w - 0.5;
              model.position.y += 0.5;
              model.position.z += d - 0.5;
              model.rotation.order = 'YXZ';
              model.rotation.fromArray(rotation);
              // model.rotation.x *= -1;
              model.rotation.y *= -1;
              model.rotation.z *= -1;
              model.scale.fromArray(scale).multiplyScalar(0.04);
              // model.scale.z *= -1;
              model.frustumCulled = false;
              object.add(model);
              break;
            }
          }
        } catch (err) {
          console.warn(err);
        }
      }
    }
    return object;
  }
}
export {
  CVLoader,
};