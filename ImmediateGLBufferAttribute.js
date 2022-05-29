import * as THREE from 'three';
import {getRenderer} from './renderer.js';

export class ImmediateGLBufferAttribute extends THREE.GLBufferAttribute {
  constructor(array, itemSize, isIndex = false) {
    const Type = array.constructor;
    let glType;
    switch (Type) {
      case Float32Array: {
        glType = WebGLRenderingContext.FLOAT;
        break;
      }
      case Uint16Array: {
        glType = WebGLRenderingContext.UNSIGNED_SHORT;
        break;
      }
      case Uint32Array: {
        glType = WebGLRenderingContext.UNSIGNED_INT;
        break;
      }
      default: {
        throw new Error(`Unsupported array type: ${Type}`);
      }
    }
    const renderer = getRenderer();
    const gl = renderer.getContext();
    const buffer = gl.createBuffer();
    const target = ImmediateGLBufferAttribute.getTarget(isIndex);
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, array.byteLength, gl.STATIC_DRAW);
    gl.bindBuffer(target, null);
    super(buffer, glType, itemSize, Type.BYTES_PER_ELEMENT, array.length / itemSize);
    
    this.array = array;
    this.isIndex = isIndex;
    /* this.updateRange = {
      offset: 0,
      count: -1,
    }; */
  }
  static getTarget(isIndex) {
    return isIndex ? WebGLRenderingContext.ELEMENT_ARRAY_BUFFER : WebGLRenderingContext.ARRAY_BUFFER;
  }
  getTarget() {
    return ImmediateGLBufferAttribute.getTarget(this.isIndex);
  }
  static getTargetBinding(isIndex) {
    return isIndex ? WebGLRenderingContext.ELEMENT_ARRAY_BUFFER_BINDING : WebGLRenderingContext.ARRAY_BUFFER_BINDING;
  }
  getTargetBinding() {
    return ImmediateGLBufferAttribute.getTargetBinding(this.isIndex);
  }
  pushed = false;
  static pushUpdate() {
    const renderer = getRenderer();
    const gl = renderer.getContext();
    
    const arrayBufferBinding = gl.getParameter(WebGLRenderingContext.ARRAY_BUFFER_BINDING);
    const elementArrayBufferBinding = gl.getParameter(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER_BINDING);
    this.pushed = true;

    const popUpdate = () => {
      gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, arrayBufferBinding);
      gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, elementArrayBufferBinding);
      this.pushed = false;
    };
    return popUpdate;
  }
  update(offset, count) {
    let popUpdate = null;
    if (!ImmediateGLBufferAttribute.pushed) {
      popUpdate = ImmediateGLBufferAttribute.pushUpdate();
    }
   
    {
      const renderer = getRenderer();
      const gl = renderer.getContext();
      const target = this.getTarget();
      
      gl.bindBuffer(target, this.buffer);
      gl.bufferSubData(
        target,
        offset * this.elementSize,
        this.array,
        offset,
        count
      );
    }

    popUpdate && popUpdate();
  }
}