import * as THREE from 'three';
import React from 'react';
// import {sceneLowerPriority} from './renderer.js';
import easing from './easing.js';
import physicsManager from './physics-manager.js';

const cubicBezier = easing(0, 1, 0, 1);

const physicsScene = physicsManager.getScene();

class DomItem extends THREE.Object3D {
  constructor(position, quaternion, scale, width, height, worldWidth, render) {
    super();

    this.name = 'domNode';

    this.position.copy(position);
    this.quaternion.copy(quaternion);
    this.scale.copy(scale);

    this.width = width;
    this.height = height;
    this.worldWidth = worldWidth;
    this.render = render;

    this.enabled = false;
    this.value = 0;
    this.animation = null;

    const floatNode = new THREE.Object3D();
    floatNode.name = 'domRendererFloatNode';
    this.add(floatNode);
    this.floatNode = floatNode;

    const innerNode = new THREE.Object3D();
    innerNode.name = 'domRendererInnerNode';
    floatNode.add(innerNode);
    this.innerNode = innerNode;

    const backgroundMesh = new BackgroundMesh({
      width,
      height,
    });
    backgroundMesh.name = 'domRendererBackgroundNode';
    this.backgroundMesh = backgroundMesh;
    innerNode.add(backgroundMesh);

    const punchoutMesh = new PunchoutMesh({
      width,
      height,
    });
    punchoutMesh.name = 'domRendererPunchoutNode';
    this.punchoutMesh = punchoutMesh;
    innerNode.add(punchoutMesh);

    const p = position;
    const q = quaternion;
    const hs = new THREE.Vector3(
      punchoutMesh.worldWidth,
      punchoutMesh.worldHeight,
      0.01,
    ).multiplyScalar(0.5);
    const dynamic = false;
    const physicsObject = physicsScene.addBoxGeometry(p, q, hs, dynamic);
    physicsScene.disableActor(physicsObject);
    physicsScene.disableGeometryQueries(physicsObject);
    this.physicsObject = physicsObject;
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
      const { startTime, endTime, startValue, endValue } = this.animation;
      let factor = Math.min(
        Math.max((timestamp - startTime) / (endTime - startTime), 0),
        1,
      );
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
      const shiftOffset = ((1 - w) * this.worldWidth) / 2;
      this.innerNode.position.x = -shiftOffset;
      this.innerNode.scale.set(w, 1, 1);
      this.innerNode.updateMatrixWorld();

      this.backgroundMesh.material.uniforms.opacity.value = this.value;
      this.backgroundMesh.material.uniforms.opacity.needsUpdate = true;

      this.punchoutMesh.material.uniforms.opacity.value = 1 - this.value;
      this.punchoutMesh.material.uniforms.opacity.needsUpdate = true;

      this.physicsObject.position.setFromMatrixPosition(
        this.innerNode.matrixWorld,
      );
      this.physicsObject.quaternion.setFromRotationMatrix(
        this.innerNode.matrixWorld,
      );
      this.physicsObject.updateMatrixWorld();
      physicsScene.setTransform(this.physicsObject);

      // this.visible = true;
    } else {
      // this.visible = false;
    }
  }

  onBeforeRaycast() {
    if (this.enabled) {
      physicsScene.enableActor(this.physicsObject);
      physicsScene.enableGeometryQueries(this.physicsObject);
    }
  }

  onAfterRaycast() {
    if (this.enabled) {
      physicsScene.disableActor(this.physicsObject);
      physicsScene.disableGeometryQueries(this.physicsObject);
    }
  }

  destroy() {
    physicsScene.enableActor(this.physicsObject);
    physicsScene.removeGeometry(this.physicsObject);
  }
}

class BackgroundMesh extends THREE.Mesh {
  constructor({ width, height }) {
    const scaleFactor = DomRenderEngine.getScaleFactor(width, height);
    const worldWidth = width * scaleFactor;
    const worldHeight = height * scaleFactor;
    const geometry = new THREE.PlaneGeometry(worldWidth, worldHeight);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        opacity: {
          value: 0,
          needsUpdate: true,
        },
      },
      vertexShader: `\
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `\
        uniform float opacity;

        void main() {
          gl_FragColor = vec4(0., 0., 0., opacity);
        }
      `,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    super(geometry, material);

    // this.frustumCulled = false;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }
}

class PunchoutMesh extends THREE.Mesh {
  constructor({ width, height }) {
    const scaleFactor = DomRenderEngine.getScaleFactor(width, height);
    const worldWidth = width * scaleFactor;
    const worldHeight = height * scaleFactor;
    const geometry = new THREE.PlaneGeometry(worldWidth, worldHeight);
    const material = new THREE.ShaderMaterial({
      // color: 0xFFFFFF,
      // side: THREE.DoubleSide,
      // opacity: 0,
      transparent: true,
      blending: THREE.MultiplyBlending,
      uniforms: {
        opacity: {
          value: 1,
          needsUpdate: true,
        },
      },
      vertexShader: `\
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `\
        uniform float opacity;

        void main() {
          gl_FragColor = vec4(1., 1., 1., opacity);
        }
      `,
      side: THREE.DoubleSide,
      // depthTest: false,
      // depthWrite: false,
    });
    super(geometry, material);

    // this.frustumCulled = false;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }
}

export class DomRenderEngine extends EventTarget {
  constructor() {
    super();

    this.doms = [];
    this.physicsObjects = [];
    this.lastHover = false;
  }

  static getScaleFactor(width, height) {
    return Math.min(1 / width, 1 / height);
  }

  addDom({
    position = new THREE.Vector3(),
    quaternion = new THREE.Quaternion(),
    scale = new THREE.Vector3(1, 1, 1),
    width = 512,
    height = 512,
    worldWidth = 1,
    render = () => <div />,
  }) {
    const dom = new DomItem(
      position,
      quaternion,
      scale,
      width,
      height,
      worldWidth,
      render,
    );
    this.doms.push(dom);
    this.physicsObjects.push(dom.physicsObject);

    this.dispatchEvent(new MessageEvent('update'));

    globalThis.dom = dom;

    return dom;
  }

  removeDom(dom) {
    const index = this.doms.indexOf(dom);
    if (index !== -1) {
      this.doms.splice(index, 1);
      this.physicsObjects.splice(index, 1);
    }
  }

  /* update() {
    const hover = this.doms.some(dom => {
      return false;
    });
    if (hover !== this.lastHover) {
      this.lastHover = hover;

      this.dispatchEvent(new MessageEvent('hover', {
        data: {
          hover,
        },
      }));
    }
  } */
  getPhysicsObjects() {
    return this.physicsObjects;
  }

  onBeforeRaycast() {
    for (const dom of this.doms) {
      dom.onBeforeRaycast();
    }
  }

  onAfterRaycast() {
    for (const dom of this.doms) {
      dom.onAfterRaycast();
    }
  }

  destroy() {
    // XXX finish this
  }
}
const domRenderer = new DomRenderEngine();
export default domRenderer;
