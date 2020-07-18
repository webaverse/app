importScripts('https://static.xrpackage.org/xrpackage/three.js', './base64.js');

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
  readRaycast() {
    this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, 1, 1, this.pixels);
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear();

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
      raycaster.ray.origin.copy(this.camera.position);
      raycaster.ray.direction.set(0, 0, -1).applyQuaternion(this.camera.quaternion);

      point = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    } else {
      meshId = -1;
      // mesh = null;
      index = -1;
      point = null;
      normal = null;
    }
    return point ? {meshId, index, point: point.toArray(), normal: normal.toArray()} : null;
  }
}
const depthMaterial = new THREE.ShaderMaterial({
  vertexShader: `\
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
  fragmentShader: `\
    // varying vec2 vTexCoords;

    varying float vId;
    varying float vIndex;

    // uniform float uNear;
    // uniform float uFar;
    vec2 encodePixelDepth(float v) {
      float x = fract(v);
      v -= x;
      v /= 255.0;
      float y = fract(v);
      return vec2(x, y);
    }
    void main() {
      gl_FragColor = vec4(encodePixelDepth(gl_FragCoord.z/gl_FragCoord.w), vId/64000.0, vIndex/64000.0);
    }
  `,
  // side: THREE.DoubleSide,
});
class CollisionRaycaster {
  constructor(renderer) {
    this.renderer = renderer;
    this.renderTargets = [];
    this.scene = new THREE.Scene();
    this.scene.overrideMaterial = depthMaterial;
    this.camera = new THREE.OrthographicCamera(Math.PI, Math.PI, Math.PI, Math.PI, 0.001, 1000);
    this.pixels = new Float32Array(10*10*4);
    this.depths = new Float32Array(10*10);
    this.normals = new Float32Array(10*10*3);
  }

  raycastMeshes(container, position, quaternion, uSize, vSize, dSize, index) {
    this.scene.add(container);

    this.camera.position.copy(position);
    this.camera.quaternion.copy(quaternion);
    this.camera.updateMatrixWorld();

    this.camera.left = uSize / -2;
    this.camera.right = uSize / 2;
    this.camera.top = vSize / 2;
    this.camera.bottom = vSize / -2;
    this.camera.near = 0.001;
    this.camera.far = dSize;
    this.camera.updateProjectionMatrix();

    // this.scene.overrideMaterial.uniforms.uNear.value = this.camera.near;
    // this.scene.overrideMaterial.uniforms.uFar.value = this.camera.far;

    this.renderer.setViewport(0, 0, 10, 10);
    if (!this.renderTargets[index]) {
      this.renderTargets[index] = new THREE.WebGLRenderTarget(10, 10, {
        type: THREE.FloatType,
        format: THREE.RGBAFormat,
      });
      this.renderTargets[index].position = new THREE.Vector3();
      this.renderTargets[index].quaternion = new THREE.Quaternion();
      this.renderTargets[index].near = 0;
      this.renderTargets[index].far = 0;
      this.renderer.setRenderTarget(this.renderTargets[index]);
      this.renderer.clear();
    } else {
      this.renderer.setRenderTarget(this.renderTargets[index]);
    }
    this.renderer.render(this.scene, this.camera);

    this.renderTargets[index].position.copy(position);
    this.renderTargets[index].quaternion.copy(quaternion);
    this.renderTargets[index].near = this.camera.near;
    this.renderTargets[index].far = this.camera.far;

    this.scene.remove(container);
  }
  readRaycast(index) {
    const renderTarget = this.renderTargets[index];
    this.renderer.readRenderTargetPixels(renderTarget, 0, 0, 10, 10, this.pixels);
    this.renderer.setRenderTarget(renderTarget);
    this.renderer.clear();

    let j = 0;
    for (let i = 0; i < this.depths.length; i++) {
      if (this.pixels[j] !== 0) {
        let v =
          this.pixels[j] +
          this.pixels[j+1] * 255.0;
        this.depths[i] = renderTarget.near + v * (renderTarget.far - renderTarget.near);
        const meshId = Math.round(this.pixels[j+2]*64000);
        const index = Math.round(this.pixels[j+3]*64000);

        const mesh = _findMeshWithMeshId(container, meshId);
        const triangle = new THREE.Triangle(
          new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9).applyMatrix4(mesh.matrixWorld),
          new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9+3).applyMatrix4(mesh.matrixWorld),
          new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9+6).applyMatrix4(mesh.matrixWorld)
        );
        triangle.getNormal(new THREE.Vector3()).toArray(this.normals, i*3);
      } else {
        this.depths[i] = Infinity;
      }
      j += 4;
    }
  }
}
const physicsMaterial = new THREE.ShaderMaterial({
  vertexShader: `\
    // attribute float id;
    // attribute float index;
    // varying float vId;
    // varying float vIndex;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      // vId = id;
      // vIndex = index;
    }
  `,
  fragmentShader: `\
    // varying vec2 vTexCoords;

    // varying float vId;
    // varying float vIndex;

    // uniform float uNear;
    // uniform float uFar;
    vec2 encodePixelDepth(float v) {
      float x = fract(v);
      v -= x;
      v /= 255.0;
      float y = fract(v);
      return vec2(x, y);
    }
    void main() {
      gl_FragColor = vec4(encodePixelDepth(gl_FragCoord.z/gl_FragCoord.w), 1.0, 1.0);
    }
  `,
  // side: THREE.DoubleSide,
});
class PhysicsRaycaster {
  constructor(renderer) {
    this.renderer = renderer;
    const renderTarget = new THREE.WebGLRenderTarget(64, 1, {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
    });
    this.renderer.setRenderTarget(renderTarget);
    this.renderer.clear();
    this.renderTarget = renderTarget;
    this.scene = new THREE.Scene();
    this.scene.overrideMaterial = physicsMaterial;
    this.camera = new THREE.OrthographicCamera(Math.PI, Math.PI, Math.PI, Math.PI, 0.001, 1000);
    this.pixels = new Float32Array(64*4);
    this.depths = new Float32Array(64);
  }

  raycastMeshes(container, position, quaternion, uSize, vSize, dSize) {
    const oldParent = container.parent;
    this.scene.add(container);
    if (oldParent) {
      this.scene.position.copy(oldParent.position);
      this.scene.quaternion.copy(oldParent.quaternion);
      this.scene.scale.copy(oldParent.scale);
    }
    container.traverse(o => {
      if (o.isMesh) {
        o.oldVisible = o.visible;
        o.visible = !o.isBuildMesh;
      }
    });

    this.camera.position.copy(position);
    this.camera.quaternion.copy(quaternion);
    this.camera.updateMatrixWorld();

    this.camera.left = uSize / -2;
    this.camera.right = uSize / 2;
    this.camera.top = vSize / 2;
    this.camera.bottom = vSize / -2;
    this.camera.near = 0.001;
    this.camera.far = dSize;
    this.camera.updateProjectionMatrix();

    // this.scene.overrideMaterial.uniforms.uNear.value = this.camera.near;
    // this.scene.overrideMaterial.uniforms.uFar.value = this.camera.far;

    const collisionIndex = this.index++;
    this.renderer.setViewport(collisionIndex, 0, 1, 1);
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    container.traverse(o => {
      if (o.isMesh) {
        o.visible = o.oldVisible;
      }
    });
    if (oldParent) {
      oldParent.add(container);
    } else {
      container.parent.remove(container);
    }
    return collisionIndex;
  }
  readRaycast() {
    this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, this.index, 1, this.pixels);
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear();

    let j = 0;
    for (let i = 0; i < this.index; i++) {
      if (this.pixels[j+2] !== 0) {
        let v =
          this.pixels[j] +
          this.pixels[j+1] * 255.0;
        this.depths[i] = this.camera.near + v * (this.camera.far - this.camera.near);
      } else {
        this.depths[i] = Infinity;
      }
      j += 4;
    }

    this.index = 0;
  }
}
const pointRaycaster = new PointRaycaster(renderer);
const collisionRaycaster = new CollisionRaycaster(renderer);
const physicsRaycaster = new PhysicsRaycaster(renderer);

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
      const {containerMatrix, position: positionData, quaternion: quaternionData} = data;

      container.matrix.fromArray(containerMatrix)
        .decompose(container.position, container.quaternion, container.scale);
      const position = new THREE.Vector3().fromArray(positionData);
      const quaternion = new THREE.Quaternion().fromArray(quaternionData);
      pointRaycaster.raycastMeshes(container, position, quaternion);

      self.postMessage({
        result: {},
      });
      break;
    }
    case 'collisionRaycast': {
      const {containerMatrix, position: positionData, quaternion: quaternionData, width, height, depth, index} = data;

      container.matrix.fromArray(containerMatrix)
        .decompose(container.position, container.quaternion, container.scale);
      const position = new THREE.Vector3().fromArray(positionData);
      const quaternion = new THREE.Quaternion().fromArray(quaternionData);
      collisionRaycaster.raycastMeshes(container, position, quaternion, width, height, depth, index);

      self.postMessage({
        result: {},
      });
      break;
    }
    case 'physicsRaycast': {
      const {containerMatrix, collisions, width, height, depth} = data;

      container.matrix.fromArray(containerMatrix)
        .decompose(container.position, container.quaternion, container.scale);
      for (const collision of collisions) {
        const [positionData, quaternionData] = collision;
        const position = new THREE.Vector3().fromArray(positionData);
        const quaternion = new THREE.Quaternion().fromArray(quaternionData);
        physicsRaycaster.raycastMeshes(container, position, quaternion, width, height, depth);
      }

      self.postMessage({
        result: {},
      });
      break;
    }
    case 'raycastResult': {
      // const {containerMatrix, collisions, width, height, depth} = data;
      const raycastResultData = pointRaycaster.readRaycast();

      const collisionResults = collisionRaycaster.renderTargets.map((renderTarget, index) => {
        collisionRaycaster.readRaycast(index);
        return {
          position: renderTarget.position.toArray(),
          quaternion: renderTarget.quaternion.toArray(),
          depths: base64.encode(collisionRaycaster.depths.buffer),
          normals: base64.encode(collisionRaycaster.normals.buffer),
        };
      });

      physicsRaycaster.readRaycast();
      const physicsResultData = {
        depths: base64.encode(physicsRaycaster.depths.buffer),
      };

      self.postMessage({
        result: [
          raycastResultData,
          collisionResults,
          physicsResultData,
        ],
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