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
varying vec3 vPosition;
varying vec3 vNormal;
void main() {

  vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

  gl_Position = projectionMatrix *
                modelViewMatrix *
                vec4(position, 1.0);
}
`

const frag = `
varying vec3 vPosition;
varying vec3 vNormal;
uniform sampler2D grassTex;
uniform sampler2D snowGrassTex;
uniform sampler2D blendTex;
uniform sampler2D rockTex;
uniform sampler2D blueTex;

vec3 lerp(vec3 s, vec3 e, float t){ return s+(e-s)*t; }

vec4 TriplanarMapping(sampler2D tex, vec3 coordinates, vec3 blending)
{
  vec4 xaxis = texture2D(tex, coordinates.yz);
  vec4 yaxis = texture2D(tex, coordinates.xz);
  vec4 zaxis = texture2D(tex, coordinates.xy);
  // blend the results of the 3 planar projections.
  vec4 result = xaxis * blending.x + yaxis * blending.y + zaxis * blending.z;

  return result;
}

void main() {

  // in vNormal is the world-space normal of the fragment
  vec3 blending = pow(vNormal, vec3(4,4,4));
  blending /= dot(blending, vec3(1,1,1));

  vec3 textureColor;

  vec3 grassColor = TriplanarMapping(grassTex, vPosition, blending).rgb;
  vec3 snowGrassColor = TriplanarMapping(snowGrassTex, vPosition, blending).rgb;
  vec3 slopeColor = TriplanarMapping(blendTex, vPosition, blending).rgb;
  vec3 rockColor = TriplanarMapping(rockTex, vPosition, blending).rgb;

  float blend;
  float slope = 1.0f - vNormal.y;
  float height = vPosition.y;

  if(slope < 0.25f)
  {
      float grassLimit = 16.0f, snowGrassLimit = 24.0f;
      blend = slope / 0.25f;
      if (height < grassLimit)
        textureColor = lerp(grassColor, slopeColor, blend);
      else if (height > snowGrassLimit)
        textureColor = lerp(snowGrassColor, slopeColor, blend);
      else
      {
        float blendGrass = (height - grassLimit) / (snowGrassLimit - grassLimit);
        vec3 blendGrassColor = lerp(grassColor, snowGrassColor, blendGrass);
        textureColor = lerp(blendGrassColor, slopeColor, blend);
      }
  }

  if((slope >= 0.25f) && (slope < 0.6f))
  {
      blend = (slope - 0.25f) * (1.0f / (0.6f - 0.25f));
      textureColor = lerp(slopeColor, rockColor, blend);
  }

  if(slope >= 0.6f)
  {
      textureColor = rockColor;
  }

  gl_FragColor.rgb = textureColor;

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
    hm.depth = 3;
    hm.metersPerPixel = 0.7;

    const generator = new Module.HeightMapMeshGenerator(hm);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        grassTex: new THREE.Uniform(imageToTexture(baseUrl + 'grass.jpg')),
        snowGrassTex: new THREE.Uniform(imageToTexture(baseUrl + 'snow_grass.jpg')),
        blendTex: new THREE.Uniform(imageToTexture(baseUrl + 'blend.jpg')),
        rockTex: new THREE.Uniform(imageToTexture(baseUrl + 'rock.jpg')),
        blueTex: new THREE.Uniform(imageToTexture(baseUrl + 'blue.jpg'))
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
    let lod = 2;
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
