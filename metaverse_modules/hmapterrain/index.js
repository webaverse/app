/* eslint-disable arrow-parens */
/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
/* eslint-disable linebreak-style */
import metaversefile from 'metaversefile'
import Module from '../../public/bin/geometry'
import * as THREE from 'three'
import { Matrix4, Plane } from 'three';

const { useApp, useLoaders, useFrame, useCleanup, usePhysics, useInternals } =
  metaversefile

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1')

const physicsIds = []

const vert = `
varying vec3 vNormal;
varying vec2 vUv;
void main() {

  vNormal = (modelMatrix * vec4(normal, 1.0)).xyz;
  vUv = uv;

  gl_Position = projectionMatrix *
                modelViewMatrix *
                vec4(position, 1.0);
}
`

const frag = `
varying vec3 vNormal;
varying vec2 vUv;
uniform sampler2D grassTex;
uniform sampler2D blendTex;
uniform sampler2D rockTex;
vec3 lerp(vec3 s, vec3 e, float t){ return s+(e-s)*t; }
void main() {
  vec3 textureColor;
  vec3 grassColor = texture2D(grassTex, vUv).rgb;
  vec3 rockColor = texture2D(rockTex, vUv).rgb;
  vec3 slopeColor = texture2D(blendTex, vUv).rgb;
  float blend;
  float slope = 1.0f - vNormal.y;
  if(slope < 0.25)
  {
      blend = slope / 0.25f;
      textureColor = lerp(grassColor, slopeColor, blend);
  }

  if((slope < 0.6) && (slope >= 0.25f))
  {
      blend = (slope - 0.25f) * (1.0f / (0.6f - 0.25f));
      textureColor = lerp(slopeColor, rockColor, blend);
  }

  if(slope >= 0.6)
  {
      textureColor = rockColor;
  }

  gl_FragColor.rgb = textureColor.rgb;

}
`

function getImageData(imgUrl) {
  return new Promise((resolve) => {
    var img = new Image();
    const canvas = document.createElement('canvas');
    img.onerror = (e) => {
      console.log(e);
    }
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const hdata = [];
      const rgbaData = ctx.getImageData(0, 0, img.width, img.height);

      for (let v = 0; v < rgbaData.data.length; v += 4) {
        hdata.push(rgbaData.data[v]);
      }

      resolve([img.width, img.height, hdata]);
    };

    img.src = imgUrl;
  });
}

class BufferManager {
  constructor() {
    this.buffers = []
  }

  readBuffer = (constructor, outputBuffer, index) => {
    this.buffers.push(outputBuffer)
    const offset = outputBuffer / constructor.BYTES_PER_ELEMENT
    return Module.HEAP32[offset + index]
  }

  readAttribute = (constructor, buffer, count) => {
    this.buffers.push(buffer)
    return Module.HEAPF32.slice(
      buffer / constructor.BYTES_PER_ELEMENT,
      buffer / constructor.BYTES_PER_ELEMENT + count
    )
  }

  readIndices = (constructor, buffer, count) => {
    this.buffers.push(buffer)
    return Module.HEAPU32.slice(
      buffer / constructor.BYTES_PER_ELEMENT,
      buffer / constructor.BYTES_PER_ELEMENT + count
    )
  }

  freeAllBuffers = () => {
    for (let i = 0; i < this.buffers.length; i++) {
      Module._doFree(this.buffers[i])
    }
  }
}

const imageToTexture = (imgUrl) => {
  const img = new Image();
  
  img.onload = () => {
    texture.needsUpdate = true;
  };
  
  img.onerror = err => {
    console.warn(err);
  };
  
  img.crossOrigin = 'Anonymous';
  img.src = imgUrl;
  const texture = new THREE.Texture(img);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 0, 0 );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  // texture.anisotropy = 16;
  return texture;
};

const bufferReader = (buffer) => {
  const bufferManager = new BufferManager()

  // reading the data with the same order as C++
  const positionCount = bufferManager.readBuffer(Int32Array, buffer, 0); // vector size
  const positionBuffer = bufferManager.readBuffer(Int32Array, buffer, 1); // position vector
  const normalCount = bufferManager.readBuffer(Int32Array, buffer, 2); // vector size
  const normalBuffer = bufferManager.readBuffer(Int32Array, buffer, 3); // normal vector
  const indicesCount = bufferManager.readBuffer(Int32Array, buffer, 4); // vector size
  const indicesBuffer = bufferManager.readBuffer(Int32Array, buffer, 5); // indices vector
  const positions = bufferManager.readAttribute(Int32Array, positionBuffer, positionCount * 3);
  const normals = bufferManager.readAttribute(Int32Array, normalBuffer, normalCount * 3);
  const indices = bufferManager.readIndices(Int32Array, indicesBuffer, indicesCount);

  //bufferManager.freeAllBuffers()

  return { positions, normals, indices };
}

function _applyBoxUV(geom, transformMatrix, bbox, bbox_max_size) {

    let coords = [];
    coords.length = 2 * geom.attributes.position.array.length / 3;

    // geom.removeAttribute('uv');
    if (geom.attributes.uv === undefined) {
        geom.addAttribute('uv', new THREE.Float32BufferAttribute(coords, 2));
    }

    //maps 3 verts of 1 face on the better side of the cube
    //side of the cube can be XY, XZ or YZ
    let makeUVs = function(v0, v1, v2) {

        //pre-rotate the model so that cube sides match world axis
        v0.applyMatrix4(transformMatrix);
        v1.applyMatrix4(transformMatrix);
        v2.applyMatrix4(transformMatrix);

        //get normal of the face, to know into which cube side it maps better
        let n = new THREE.Vector3();
        n.crossVectors(v1.clone().sub(v0), v1.clone().sub(v2)).normalize();

        n.x = Math.abs(n.x);
        n.y = Math.abs(n.y);
        n.z = Math.abs(n.z);

        let uv0 = new THREE.Vector2();
        let uv1 = new THREE.Vector2();
        let uv2 = new THREE.Vector2();
        // xz mapping
        if (n.y > n.x && n.y > n.z) {
            uv0.x = (v0.x - bbox.min.x) / bbox_max_size;
            uv0.y = (bbox.max.z - v0.z) / bbox_max_size;

            uv1.x = (v1.x - bbox.min.x) / bbox_max_size;
            uv1.y = (bbox.max.z - v1.z) / bbox_max_size;

            uv2.x = (v2.x - bbox.min.x) / bbox_max_size;
            uv2.y = (bbox.max.z - v2.z) / bbox_max_size;
        } else
        if (n.x > n.y && n.x > n.z) {
            uv0.x = (v0.z - bbox.min.z) / bbox_max_size;
            uv0.y = (v0.y - bbox.min.y) / bbox_max_size;

            uv1.x = (v1.z - bbox.min.z) / bbox_max_size;
            uv1.y = (v1.y - bbox.min.y) / bbox_max_size;

            uv2.x = (v2.z - bbox.min.z) / bbox_max_size;
            uv2.y = (v2.y - bbox.min.y) / bbox_max_size;
        } else
        if (n.z > n.y && n.z > n.x) {
            uv0.x = (v0.x - bbox.min.x) / bbox_max_size;
            uv0.y = (v0.y - bbox.min.y) / bbox_max_size;

            uv1.x = (v1.x - bbox.min.x) / bbox_max_size;
            uv1.y = (v1.y - bbox.min.y) / bbox_max_size;

            uv2.x = (v2.x - bbox.min.x) / bbox_max_size;
            uv2.y = (v2.y - bbox.min.y) / bbox_max_size;
        }

        return {
            uv0: uv0,
            uv1: uv1,
            uv2: uv2
        };
    };

    if (geom.index) { // is it indexed buffer geometry?
        for (let vi = 0; vi < geom.index.array.length; vi += 3) {
            let idx0 = geom.index.array[vi];
            let idx1 = geom.index.array[vi + 1];
            let idx2 = geom.index.array[vi + 2];

            let vx0 = geom.attributes.position.array[3 * idx0];
            let vy0 = geom.attributes.position.array[3 * idx0 + 1];
            let vz0 = geom.attributes.position.array[3 * idx0 + 2];

            let vx1 = geom.attributes.position.array[3 * idx1];
            let vy1 = geom.attributes.position.array[3 * idx1 + 1];
            let vz1 = geom.attributes.position.array[3 * idx1 + 2];

            let vx2 = geom.attributes.position.array[3 * idx2];
            let vy2 = geom.attributes.position.array[3 * idx2 + 1];
            let vz2 = geom.attributes.position.array[3 * idx2 + 2];

            let v0 = new THREE.Vector3(vx0, vy0, vz0);
            let v1 = new THREE.Vector3(vx1, vy1, vz1);
            let v2 = new THREE.Vector3(vx2, vy2, vz2);

            let uvs = makeUVs(v0, v1, v2, coords);

            coords[2 * idx0] = uvs.uv0.x;
            coords[2 * idx0 + 1] = uvs.uv0.y;

            coords[2 * idx1] = uvs.uv1.x;
            coords[2 * idx1 + 1] = uvs.uv1.y;

            coords[2 * idx2] = uvs.uv2.x;
            coords[2 * idx2 + 1] = uvs.uv2.y;
        }
    } else {
        for (let vi = 0; vi < geom.attributes.position.array.length; vi += 9) {
            let vx0 = geom.attributes.position.array[vi];
            let vy0 = geom.attributes.position.array[vi + 1];
            let vz0 = geom.attributes.position.array[vi + 2];

            let vx1 = geom.attributes.position.array[vi + 3];
            let vy1 = geom.attributes.position.array[vi + 4];
            let vz1 = geom.attributes.position.array[vi + 5];

            let vx2 = geom.attributes.position.array[vi + 6];
            let vy2 = geom.attributes.position.array[vi + 7];
            let vz2 = geom.attributes.position.array[vi + 8];

            let v0 = new THREE.Vector3(vx0, vy0, vz0);
            let v1 = new THREE.Vector3(vx1, vy1, vz1);
            let v2 = new THREE.Vector3(vx2, vy2, vz2);

            let uvs = makeUVs(v0, v1, v2, coords);

            let idx0 = vi / 3;
            let idx1 = idx0 + 1;
            let idx2 = idx0 + 2;

            coords[2 * idx0] = uvs.uv0.x;
            coords[2 * idx0 + 1] = uvs.uv0.y;

            coords[2 * idx1] = uvs.uv1.x;
            coords[2 * idx1 + 1] = uvs.uv1.y;

            coords[2 * idx2] = uvs.uv2.x;
            coords[2 * idx2 + 1] = uvs.uv2.y;
        }
    }

    geom.attributes.uv.array = new Float32Array(coords);
}

function applyBoxUV(bufferGeometry, transformMatrix, boxSize) {

    if (transformMatrix === undefined) {
        transformMatrix = new THREE.Matrix4();
    }

    if (boxSize === undefined) {
        let geom = bufferGeometry;
        geom.computeBoundingBox();
        let bbox = geom.boundingBox;

        let bbox_size_x = bbox.max.x - bbox.min.x;
        let bbox_size_z = bbox.max.z - bbox.min.z;
        let bbox_size_y = bbox.max.y - bbox.min.y;

        boxSize = Math.max(bbox_size_x, bbox_size_y, bbox_size_z);
    }

    let uvBbox = new THREE.Box3(new THREE.Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2), new THREE.Vector3(boxSize / 2, boxSize / 2, boxSize / 2));

    _applyBoxUV(bufferGeometry, transformMatrix, uvBbox, boxSize);

}

export default (e) => {
  console.log('application start!!');
  const physics = usePhysics();
  const app = useApp();
  app.name = '???';
  getImageData(baseUrl + 'map.png').then((data) => {
    const hm = new Module.HeightMap();
    hm.width = data[0];
    hm.height = data[1];
    hm.data = data[2];
    hm.depth = 2.5;
    hm.metersPerPixel = 0.7;

    const generator = new Module.HeightMapMeshGenerator(hm);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        grassTex: new THREE.Uniform(imageToTexture(baseUrl + 'grass.jpg')),
        blendTex: new THREE.Uniform(imageToTexture(baseUrl + 'blend.jpg')),
        rockTex: new THREE.Uniform(imageToTexture(baseUrl + 'rock.jpg'))
      },
      vertexShader: vert,
      fragmentShader: frag
    });

    const generateMeshFromBuffers = (positions, normals, indices, origin)=>{
      const geometry = new THREE.BufferGeometry();
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      for(let i = 0; i < positions.length; i+=3){
        positions[i] -= origin.x;
        positions[i+1] -= origin.y;
        positions[i+2] -= origin.z;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      applyBoxUV(geometry, new Matrix4(), 10);
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(origin);
      app.add(mesh)
      const terrainPhysics = physics.addGeometry(mesh);
      physicsIds.push(terrainPhysics);
    };

    const addChunk = (origin, lod) => {
      const buffer = generator.generateChunk(origin.x, origin.y, origin.z, lod);
      const { positions, normals, indices } = bufferReader(buffer);
      generateMeshFromBuffers(positions, normals, indices, origin);
    };

    const addSeam = (origin, lod) => {
      const buffer = generator.generateSeam(origin.x, origin.y, origin.z, lod);
      const { positions, normals, indices } = bufferReader(buffer);
      generateMeshFromBuffers(positions, normals, indices, origin);
    };
    let lod = 8;
    for(let x of [-2, -1, 0, 1, 2])
      for(let z of [-2, -1, 0, 1, 2])
      {
        addChunk(new THREE.Vector3(x*64, 0, z*64), lod);
        addSeam(new THREE.Vector3(x*64, 0, z*64), lod);
      }
    //addChunk(new THREE.Vector3(64, 0, 64));
    //addSeam(new THREE.Vector3(64, 0, 64));

    hm.delete();
    generator.delete();
  });

  return app;
}
