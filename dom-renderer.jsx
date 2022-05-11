import * as THREE from 'three';

import {sceneLowerPriority} from './renderer.js';
import easing from './easing.js';

const cubicBezier = easing(0, 1, 0, 1);

class DomItem extends THREE.Object3D {
  constructor(position, quaternion, scale, width, height, worldWidth, render) {
    super();

    this.position.copy(position);
    this.quaternion.copy(quaternion);
    this.scale.copy(scale);

    this.width = width;
    this.height = height;
    this.worldWidth = worldWidth;
    // this.basePosition = position.clone();
    // this.baseQuaternion = quaternion.clone();
    // this.baseScale = scale.clone();
    this.render = render;

    this.enabled = false;
    this.value = 0;
    this.animation = null;

    const floatNode = new THREE.Object3D();
    this.floatNode = floatNode;
    this.add(floatNode);

    const iframeMesh = new IFrameMesh({
      width,
      height,
    });
    this.iframeMesh = iframeMesh;
    floatNode.add(iframeMesh);
  }
  startAnimation(enabled, startTime, endTime) {
    this.enabled = enabled;
    
    const startValue = this.value;
    const endValue = enabled ? 1 : 0;
    this.animation = {
      startTime,
      endTime,
      startValue,
      endValue,
    };
  }
  update(timestamp) {
    if (this.animation) {
      const {startTime, endTime, startValue, endValue} = this.animation;
      let factor = Math.min(Math.max((timestamp - startTime) / (endTime - startTime), 0), 1);
      factor = cubicBezier(factor);
      if (factor < 1) {
        this.value = startValue + (endValue - startValue) * factor;
      } else {
        this.value = endValue;
        this.animation = null;
      }
    } else {
      this.value = this.enabled ? 1 : 0;
    }

    if (this.value > 0) {
      const w = this.value;
      const shiftOffset = (1 - w) * this.worldWidth/2;
      this.iframeMesh.position.x = -shiftOffset;
      this.iframeMesh.scale.set(w, 1, 1);
      this.iframeMesh.updateMatrixWorld();
      
      this.iframeMesh.material.opacity = 1 - this.value;
      
      this.visible = true;
    } else {
      this.visible = false;
    }
  }
}

class IFrameMesh extends THREE.Mesh {
  constructor({
    width,
    height,
  }) {
    const scaleFactor = DomRenderEngine.getScaleFactor(width, height);
    const geometry = new THREE.PlaneBufferGeometry(width * scaleFactor, height * scaleFactor);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
      opacity: 0,
      transparent: true,
      blending: THREE.MultiplyBlending
    });
    super(geometry, material);

    this.frustumCulled = false;
    this.onBeforeRender = renderer => {
      const context = renderer.getContext();
      context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);
    };
    this.onAfterRender = renderer => {
      const context = renderer.getContext();
      context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
    };
  }
}

export class DomRenderEngine extends EventTarget {
  constructor() {
    super();

    this.doms = [];
  }
  static getScaleFactor(width, height) {
    return Math.min(1/width, 1/height);
  }
  addDom({
    position = new THREE.Vector3(),
    quaternion = new THREE.Quaternion(),
    scale = new THREE.Vector3(1, 1, 1),
    width = 600,
    height = 400,
    worldWidth = 1,
    render = () => (<div />),
  }) {
    const dom = new DomItem(position, quaternion, scale, width, height, worldWidth, render);
    
    this.doms.push(dom);

    this.dispatchEvent(new MessageEvent('update'));

    return dom;
  }
  removeDom(dom) {
    const index = this.doms.indexOf(dom);
    if (index !== -1) {
      this.doms.splice(index, 1);
    }
  }
  destroy() {
    // XXX finish this
  }
}
const domRenderer = new DomRenderEngine();
export default domRenderer;