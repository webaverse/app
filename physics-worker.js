importScripts('./bin/physx2.js');

class Allocator {
  constructor() {
    this.offsets = [];
  }
  alloc(constructor, size) {
    const offset = self.Module._malloc(size * constructor.BYTES_PER_ELEMENT);
    const b = new constructor(self.Module.HEAP8.buffer, self.Module.HEAP8.byteOffset + offset, size);
    b.offset = offset;
    this.offsets.push(offset);
    return b;
  }
  freeAll() {
    for (let i = 0; i < this.offsets.length; i++) {
      self.Module._doFree(this.offsets[i]);
    }
    this.offsets.length = 0;
  }
}

const _bakeGeometry = (positionsData, indicesData) => {
  const allocator = new Allocator();

  const positions = allocator.alloc(Float32Array, positionsData.length);
  positions.set(positionsData);
  const indices = indicesData ? allocator.alloc(Uint32Array, indicesData.length) : null;
  indicesData && indices.set(indicesData);

  const ptr = allocator.alloc(Uint32Array, 1);
  const data = allocator.alloc(Uint32Array, 1);
  const size = allocator.alloc(Uint32Array, 1);

  self.Module._bakeGeometry(
    positions.offset,
    indices ? indices.offset : 0,
    positions.length,
    indices ? indices.length : 0,
    ptr.offset,
    data.offset,
    size.offset
  );

  const arrayBuffer = new ArrayBuffer(size[0]);
  const physicsGeometryBuffer = new Uint8Array(arrayBuffer);
  const physicsGeometryBufferSrc = new Uint8Array(self.Module.HEAP8.buffer, self.Module.HEAP8.byteOffset + data[0], size[0]);
  physicsGeometryBuffer.set(physicsGeometryBufferSrc);

  self.Module._releaseBakedGeometry(
    ptr[0]
  );
  allocator.freeAll();

  return [
    {
      physicsGeometryBuffer,
    },
    arrayBuffer,
  ];
};
const _bakeGeometries = specs => {
  const pointers = specs.map(spec => {
    const {positions: positionsData, indices: indicesData} = spec;

    const allocator = new Allocator();

    const positions = allocator.alloc(Float32Array, positionsData.length);
    positions.set(positionsData);
    const indices = indicesData ? allocator.alloc(Uint32Array, indicesData.length) : null;
    indicesData && indices.set(indicesData);

    const ptr = allocator.alloc(Uint32Array, 1);
    const data = allocator.alloc(Uint32Array, 1);
    const size = allocator.alloc(Uint32Array, 1);

    self.Module._bakeGeometry(
      positions.offset,
      indices ? indices.offset : 0,
      positions.length,
      indices ? indices.length : 0,
      ptr.offset,
      data.offset,
      size.offset
    );

    const pointer = [ptr[0], data[0], size[0]];
    allocator.freeAll();
    return pointer;
  });
  let totalSize = 0;
  for (const pointer of pointers) {
    const [ptr, data, size] = pointer;
    totalSize += size;
  }
  const arrayBuffer = new ArrayBuffer(totalSize);
  let index = 0;
  const physicsGeometryBuffers = pointers.map(pointer => {
    const [ptr, data, size] = pointer;

    const physicsGeometryBuffer = new Uint8Array(arrayBuffer, index, size);
    const physicsGeometryBufferSrc = new Uint8Array(self.Module.HEAP8.buffer, self.Module.HEAP8.byteOffset + data, size);
    physicsGeometryBuffer.set(physicsGeometryBufferSrc);
    index += size;

    self.Module._releaseBakedGeometry(
      ptr
    );

    return physicsGeometryBuffer;
  });

  return [
    {
      physicsGeometryBuffers,
    },
    arrayBuffer,
  ];
};

const queue = [];
let loaded = false;
const _handleMessage = data => {
  const {method} = data;
  switch (method) {
    case 'bakeGeometry': {
      const {positions, indices} = data;
      const [result, transfer] = _bakeGeometry(positions, indices);
      self.postMessage({
        result,
      }, [transfer]);
      break;
    }
    case 'bakeGeometries': {
      const {specs} = data;
      const [result, transfer] = _bakeGeometries(specs);
      self.postMessage({
        result,
      }, [transfer]);
      break;
    }
    default: {
      console.warn('unknown method', data.method);
      break;
    }
  }
};
const _flushMessages = () => {
  for (let i = 0; i < queue.length; i++) {
    _handleMessage(queue[i]);
  }
};
self.onmessage = e => {
  const {data} = e;
  if (!loaded) {
    queue.push(data);
  } else {
    _handleMessage(data);
  }
};

wasmModulePromise.then(() => {
  Module._initPhysx();

  loaded = true;
  _flushMessages();
}).catch(err => {
  console.warn(err.stack);
});
