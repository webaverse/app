importScripts('https://static.xrpackage.org/xrpackage/three.js');

const renderer = new THREE.WebGLRenderer({
  canvas: new OffscreenCanvas(1, 1),
  alpha: true,
});
renderer.setClearColor(new THREE.Color(0x000000), 0);
renderer.autoClear = false;
const container = new THREE.Object3D();

const fakeMaterial = new THREE.MeshBasicMaterial({
  color: 0xFFFFFF,
});

const _getChunkMesh = meshId => {
  for (const child of container.children) {
    if (child.isChunkMesh && child.meshId === meshId) {
      return child;
    }
  }
  return null;
};
const _getOrMakeChunkMesh = (meshId, x, y, z, parcelSize, subparcelSize, slabTotalSize, slabAttributeSize, slabSliceVertices, numSlices) => {
  let chunkMesh = _getChunkMesh(meshId);
  if (!chunkMesh) {
    chunkMesh = _makeChunkMesh(meshId, x, y, z, parcelSize, subparcelSize, slabTotalSize, slabAttributeSize, slabSliceVertices, numSlices);
    container.add(chunkMesh);
  }
  return chunkMesh;
};
const _makeChunkMesh = (meshId, x, y, z, parcelSize, subparcelSize, slabTotalSize, slabAttributeSize, slabSliceVertices, numSlices) => {
  const slabArrayBuffer = new ArrayBuffer(slabTotalSize);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 0*slabAttributeSize, slabSliceVertices*numSlices*3), 3));
  geometry.setAttribute('barycentric', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 1*slabAttributeSize, slabSliceVertices*numSlices*3), 3));
  geometry.setAttribute('id', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 2*slabAttributeSize, slabSliceVertices*numSlices), 1));
  geometry.setAttribute('index', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 3*slabAttributeSize, slabSliceVertices*numSlices), 1));

  const mesh = new THREE.Mesh(geometry, [fakeMaterial]);
  mesh.position.set(x, y, z);
  mesh.frustumCulled = false;
  mesh.meshId = meshId;
  mesh.parcelSize = parcelSize;
  mesh.subparcelSize = subparcelSize;
  mesh.isChunkMesh = true;
  const slabs = [];
  const freeSlabs = [];
  let index = 0;
  mesh.getSlab = (x, y, z) => {
    let slab = slabs.find(slab => slab.x === x && slab.y === y && slab.z === z);
    if (!slab) {
      slab = freeSlabs.pop();
      if (slab) {
        slab.x = x;
        slab.y = y;
        slab.z = z;
        slabs.push(slab);
        geometry.addGroup(slab.slabIndex * slabSliceVertices, slab.position.length/3, 0);
      } else {
        slab = {
          x,
          y,
          z,
          slabIndex: index,
          position: new Float32Array(geometry.attributes.position.array.buffer, geometry.attributes.position.array.byteOffset + index*slabSliceVertices*3*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices*3),
          barycentric: new Float32Array(geometry.attributes.barycentric.array.buffer, geometry.attributes.barycentric.array.byteOffset + index*slabSliceVertices*3*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices*3),
          id: new Float32Array(geometry.attributes.id.array.buffer, geometry.attributes.id.array.byteOffset + index*slabSliceVertices*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices),
          index: new Float32Array(geometry.attributes.index.array.buffer, geometry.attributes.index.array.byteOffset + index*slabSliceVertices*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices),
        };
        slabs.push(slab);
        if (slabs.length > numSlices) {
          debugger;
        }
        geometry.addGroup(index * slabSliceVertices, slab.position.length/3, 0);
        index++;
      }
    }
    return slab;
  };
  mesh.removeSlab = (x, y, z) => {
    const index = slabs.findIndex(slab => slab.x === x && slab.y === y && slab.z === z);
    const slab = slabs[index];
    const groupIndex = geometry.groups.findIndex(group => group.start === slab.slabIndex * slabSliceVertices);
    geometry.groups.splice(groupIndex, 1);
    slabs.splice(index, 1);
    freeSlabs.push(slab);
  };
  mesh.updateGeometry = (slab, spec) => {
    geometry.attributes.position.updateRange.offset = slab.slabIndex*slabSliceVertices*3;
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.barycentric.updateRange.offset = slab.slabIndex*slabSliceVertices*3;
    geometry.attributes.barycentric.needsUpdate = true;
    geometry.attributes.id.updateRange.offset = slab.slabIndex*slabSliceVertices;
    geometry.attributes.id.needsUpdate = true;
    geometry.attributes.index.updateRange.offset = slab.slabIndex*slabSliceVertices;
    geometry.attributes.index.needsUpdate = true;

    geometry.attributes.position.updateRange.count = spec.positions.length;
    geometry.attributes.barycentric.updateRange.count = spec.barycentrics.length;
    geometry.attributes.id.updateRange.count = spec.ids.length;
    geometry.attributes.index.updateRange.count = spec.indices.length;
    renderer.geometries.update(geometry);
  };
  return mesh;
};

const _findMeshWithMeshId = (container, meshId) => {
  let result = null;
  container.traverse(o => {
    if (result === null && o.meshId === meshId) {
      result = o;
    }
  });
  return result;
};

const idMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    attribute float id;
    attribute float index;
    varying float vId;
    varying float vIndex;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      vId = id;
      vIndex = index;
    }
  `,
  fragmentShader: `
    varying float vId;
    varying float vIndex;
    void main() {
      gl_FragColor = vec4(vId/64000.0, vIndex/64000.0, 0.0, 0.0);
    }
  `,
  // side: THREE.DoubleSide,
});
class PointRaycaster {
  constructor(renderer) {
    this.renderer = renderer;
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
    });
    this.renderer.setRenderTarget(renderTarget);
    this.renderer.clear();
    this.renderTarget = renderTarget;
    this.scene = new THREE.Scene();
    this.scene.overrideMaterial = idMaterial;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.pixels = new Float32Array(4);
  }

  raycastMeshes(container, position, quaternion) {
    this.scene.add(container);

    this.camera.position.copy(position);
    this.camera.quaternion.copy(quaternion);
    this.camera.updateMatrixWorld();

    this.renderer.setViewport(0, 0, 1, 1);
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    this.scene.remove(container);
  }
  readRaycast(container, position, quaternion) {
    this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, 1, 1, this.pixels);

    let meshId;
    // let mesh;
    let index;
    let point;
    let normal;
    if (this.pixels[0] !== 0) {
      meshId = Math.round(this.pixels[0]*64000);
      const mesh = _findMeshWithMeshId(container, meshId);
      index = Math.round(this.pixels[1]*64000);

      const triangle = new THREE.Triangle(
        new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9).applyMatrix4(mesh.matrixWorld),
        new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9+3).applyMatrix4(mesh.matrixWorld),
        new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9+6).applyMatrix4(mesh.matrixWorld)
      );
      normal = triangle.getNormal(new THREE.Vector3());
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, triangle.a);

      const raycaster = new THREE.Raycaster();
      raycaster.ray.origin.copy(position);
      raycaster.ray.direction.set(0, 0, -1).applyQuaternion(quaternion);

      point = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    } else {
      meshId = -1;
      // mesh = null;
      index = -1;
      point = null;
      normal = null;
    }
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear();
    return point ? {meshId, index, point: point.toArray(), normal: normal.toArray()} : null;
  }
}
const pointRaycaster = new PointRaycaster(renderer);

const _handleMessage = data => {
  const {method} = data;
  switch (method) {
    case 'loadSlab': {
      const {meshId, x, y, z, specs, parcelSize, subparcelSize, slabTotalSize, slabAttributeSize, slabSliceVertices, numSlices} = data;

      const mesh = _getOrMakeChunkMesh(meshId, x, y, z, parcelSize, subparcelSize, slabTotalSize, slabAttributeSize, slabSliceVertices, numSlices);
      // console.log('load slab', meshId, mesh, specs);

      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        const {x, y, z} = spec;
        const slab = mesh.getSlab(x, y, z);
        slab.position.set(spec.positions);
        slab.barycentric.set(spec.barycentrics);
        slab.id.set(spec.ids);
        /* const indexOffset = slab.slabIndex * slabSliceTris;
        for (let i = 0; i < spec.indices.length; i++) {
          spec.indices[i] += indexOffset;
        } */
        slab.index.set(spec.indices);

        mesh.updateGeometry(slab, spec);

        const group = mesh.geometry.groups.find(group => group.start === slab.slabIndex * slabSliceVertices);
        group.count = spec.positions.length/3;
      }

      self.postMessage({
        result: {},
      });
      break;
    }
    case 'unloadSlab': {
      const {meshId, x, y, z} = data;

      const mesh = _getChunkMesh(meshId);
      mesh.removeSlab(x, y, z);

      self.postMessage({
        result: {},
      });
      break;
    }
    case 'pointRaycast': {
      let {containerMatrix, position, quaternion} = data;

      container.matrix.fromArray(containerMatrix)
        .decompose(container.position, container.quaternion, container.scale);
      position = new THREE.Vector3().fromArray(position);
      quaternion = new THREE.Quaternion().fromArray(quaternion);
      pointRaycaster.raycastMeshes(container, position, quaternion);
      const result = pointRaycaster.readRaycast(container, position, quaternion);

      self.postMessage({
        result,
      });
      break;
    }
    default: {
      console.warn('unknown method', data.method);
      break;
    }
  }
};
self.onmessage = e => {
  _handleMessage(e.data);
};