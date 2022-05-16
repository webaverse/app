/* eslint-disable arrow-parens */
/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
/* eslint-disable linebreak-style */
import metaversefile from 'metaversefile'
import Module from '../../public/bin/geometry'
import {img64} from './imageb64'
import * as THREE from 'three'

const { useApp, useLoaders, useFrame, useCleanup, usePhysics, useInternals } =
  metaversefile

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1')

const physicsIds = []

function getImageData(img) {
  return new Promise((resolve) => {
    var img = new Image();
    const canvas = document.createElement('canvas');
    img.onerror = (e) => {
      console.log(e);
    }
    img.onload = () => {
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const hdata = [];
      const rgbaData = ctx.getImageData(0, 0, img.width, img.height);

      for (let v = 0; v < rgbaData.data.length; v += 4) {
        hdata.push(rgbaData.data[v]);
      }

      resolve([img.width, img.height, hdata]);
    };

    img.src = img64;
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
  getImageData().then((data) => {
    const hm = new Module.HeightMap();
    hm.width = data[0];
    hm.height = data[1];
    hm.data = data[2];
    hm.depth = 2;
    hm.metersPerPixel = 0.8;

    const generator = new Module.HeightMapMeshGenerator(hm);

    const generateMeshFromBuffers = (positions, normals, indices)=>{
      
      const geometry = new THREE.BufferGeometry()
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

      const material = new THREE.MeshBasicMaterial({
        color: '#0822b4',
        wireframe: true,
      });

      const mesh = new THREE.Mesh(geometry, material)

      app.add(mesh)

      const terrainPhysics = physics.addGeometry(mesh);
      physicsIds.push(terrainPhysics);
    };

    const addChunk = (origin) => {
      const buffer = generator.generateChunk(origin.x, origin.y, origin.z);
      const { positions, normals, indices } = bufferReader(buffer);
      generateMeshFromBuffers(positions, normals, indices);
    };

    const addSeam = (origin) => {
      const buffer = generator.generateSeam(origin.x, origin.y, origin.z);
      const { positions, normals, indices } = bufferReader(buffer);
      generateMeshFromBuffers(positions, normals, indices);
    };

    for(let x of [0, 1, 2])
      for(let z of [0, 1, 2]){
        addChunk(new THREE.Vector3(x*64, 0, z*64));
        addSeam(new THREE.Vector3(x*64, 0, z*64));
      }
    hm.delete();
    generator.delete();
  });

  return app;
}
