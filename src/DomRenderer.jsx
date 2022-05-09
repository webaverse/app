import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import gameManager from '../game.js';
import {sceneLowerPriority, camera} from '../renderer.js';
import {localPlayer} from '../players.js';
import easing from '../easing.js';

import {CharacterBanner} from './CharacterBanner.jsx';

const cubicBezier = easing(0, 1, 0, 1);
const floatFactor = 0.05;
const floatTime = 3000;
const transtionTime = 1000;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

const _getFov = () => camera.projectionMatrix.elements[ 5 ] * (window.innerHeight / 2);
const _getScaleFactor = (width, height) => Math.min(1/width, 1/height);

function epsilon(value) {
  return value;
  // return Math.abs(value) < 1e-10 ? 0 : value;
}
function getObjectCSSMatrix( matrix, cameraCSSMatrix ) {
  var elements = matrix.elements;
  var matrix3d = 'matrix3d(' +
    epsilon( elements[ 0 ] ) + ',' +
    epsilon( elements[ 1 ] ) + ',' +
    epsilon( elements[ 2 ] ) + ',' +
    epsilon( elements[ 3 ] ) + ',' +
    epsilon( - elements[ 4 ] ) + ',' +
    epsilon( - elements[ 5 ] ) + ',' +
    epsilon( - elements[ 6 ] ) + ',' +
    epsilon( - elements[ 7 ] ) + ',' +
    epsilon( elements[ 8 ] ) + ',' +
    epsilon( elements[ 9 ] ) + ',' +
    epsilon( elements[ 10 ] ) + ',' +
    epsilon( elements[ 11 ] ) + ',' +
    epsilon( elements[ 12 ] ) + ',' +
    epsilon( elements[ 13 ] ) + ',' +
    epsilon( elements[ 14 ] ) + ',' +
    epsilon( elements[ 15 ] ) +
  ')';

  /* if ( isIE ) {

    return 'translate(-50%,-50%)' +
      'translate(' + _widthHalf + 'px,' + _heightHalf + 'px)' +
      cameraCSSMatrix +
      matrix3d;

  } */

  return matrix3d;
}
function getCameraCSSMatrix( matrix ) {
  const {elements} = matrix;
  return 'matrix3d(' +
    epsilon( elements[ 0 ] ) + ',' +
    epsilon( - elements[ 1 ] ) + ',' +
    epsilon( elements[ 2 ] ) + ',' +
    epsilon( elements[ 3 ] ) + ',' +
    epsilon( elements[ 4 ] ) + ',' +
    epsilon( - elements[ 5 ] ) + ',' +
    epsilon( elements[ 6 ] ) + ',' +
    epsilon( elements[ 7 ] ) + ',' +
    epsilon( elements[ 8 ] ) + ',' +
    epsilon( - elements[ 9 ] ) + ',' +
    epsilon( elements[ 10 ] ) + ',' +
    epsilon( elements[ 11 ] ) + ',' +
    epsilon( elements[ 12 ] ) + ',' +
    epsilon( - elements[ 13 ] ) + ',' +
    epsilon( elements[ 14 ] ) + ',' +
    epsilon( elements[ 15 ] ) +
  ')';
}

class IFrameMesh extends THREE.Mesh {
  constructor({
    width,
    height,
  }) {
    const scaleFactor = _getScaleFactor(width, height);
    const geometry = new THREE.PlaneBufferGeometry(width * scaleFactor, height * scaleFactor);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
      opacity: 0,
      transparent: true,
      blending: THREE.MultiplyBlending
    });
    super(geometry, material);

    this.width = width;
    this.height = height;

    this.enabled = false;
    this.animation = null;
  }
  startAnimation(startTime, endTime) {
    const startValue = this.material.opacity;
    const endValue = this.enabled ? 0 : 1;
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
      if (timestamp < endTime) {
        let factor = Math.min(Math.max((timestamp - startTime) / (endTime - startTime), 0), 1);
        factor = cubicBezier(factor);
        const value = startValue + (endValue - startValue) * factor;
        this.material.opacity = value;
      } else {
        this.material.opacity = this.enabled ? 0 : 1;
        this.animation = null;
      }
    } else {
      this.material.opacity = this.enabled ? 0 : 1;
    }
  }
}

class DomRenderEngine extends EventTarget {
  constructor() {
    super();

    this.doms = [];
  }
  addDom({
    position = new THREE.Vector3(),
    quaternion = new THREE.Quaternion(),
    scale = new THREE.Vector3(1, 1, 1),
    width,
    height,
    render,
  }) {
    const dom = new IFrameMesh({
      width: width,
      height: height,
    });
    dom.onBeforeRender = renderer => {
      const context = renderer.getContext();
      context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);
    };
    dom.onAfterRender = renderer => {
      const context = renderer.getContext();
      context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
    };
    sceneLowerPriority.add(dom);
    dom.updateMatrixWorld();

    dom.basePosition = position.clone();
    dom.baseQuaternion = quaternion.clone();
    dom.baseScale = scale.clone();
    dom.render = render;
    this.doms.push(dom);

    this.dispatchEvent(new MessageEvent('update'));
  }
  destroy() {
    // XXX finish this
  }
}
const domRenderEngine = new DomRenderEngine();
domRenderEngine.addDom({
  position: new THREE.Vector3(-9, 1.2, -1),
  quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
  width: 600,
  height: 400,
  render: () => (<CharacterBanner />),
});

const DomRendererChild = ({
  dom,
  innerWidth,
  innerHeight,
  range = 5,
}) => {
  const {width, height} = dom;
  const scaleFactor = _getScaleFactor(width, height);
  const [visible, setVisible] = useState(false);
  const iframeContainer2Ref = useRef();

  // tracking
  useEffect(() => {
    const iframeContainer2 = iframeContainer2Ref.current;

    if (iframeContainer2) {
      const render = e => {
        const _animateMenuFloat = () => {
          const now = performance.now();
          dom.position.copy(dom.basePosition);
          dom.position.y += Math.sin((now % floatTime)/floatTime * 2 * Math.PI) * floatFactor;
          dom.position.y += Math.cos(((now / 2) % floatTime)/floatTime * 2 * Math.PI) * floatFactor/2;
          dom.position.y += Math.sin(((now / 4) % floatTime)/floatTime * 2 * Math.PI) * floatFactor/4;
          dom.quaternion.copy(dom.baseQuaternion);
          dom.scale.copy(dom.baseScale);
          dom.updateMatrixWorld();
        };
        _animateMenuFloat();
        
        const _updateCameraContainerMatrix = () => {
          const fov = _getFov();
          const cameraCSSMatrix = getCameraCSSMatrix(
            localMatrix.copy(camera.matrixWorldInverse)
              .premultiply(
                localMatrix2.makeTranslation(0, 0, fov)
              )
              .multiply(
                dom.matrixWorld
              )
          );
          iframeContainer2.style.transform = cameraCSSMatrix;
        };
        _updateCameraContainerMatrix();
      };
      gameManager.addEventListener('render', render);

      return () => {
        gameManager.removeEventListener('render', render);
      };
    }
  }, [iframeContainer2Ref]);

  // visibility
  useEffect(() => {
    const render = e => {
      const timestamp = performance.now(); // XXX pass this in from the event
      const startTime = timestamp;
      const endTime = startTime + transtionTime;

      const _updateVisibility = () => {
        const distance = localPlayer.position.distanceTo(dom.basePosition);
        const isInRange = distance < range;
        if (isInRange && !visible) {
          setVisible(true);
          dom.enabled = true;
          dom.startAnimation(startTime, endTime);
        } else if (visible && !isInRange) {
          setVisible(false);
          dom.enabled = false;
          dom.startAnimation(startTime, endTime);
        }
      };
      _updateVisibility();

      const _updateAnimation = () => {
        dom.update(timestamp)
      };
      _updateAnimation();
    };
    gameManager.addEventListener('render', render);

    return () => {
      gameManager.removeEventListener('render', render);
    };
  }, [visible]);

  return (
    <div
      className={'iframe-container-2'}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }}
      ref={iframeContainer2Ref}
    >
      <div
        className={'iframe'}
        width={width}
        height={height}
        style={{
          position: 'relative',
          width: width + 'px',
          height: height + 'px',
          border: '0',
          overflow: 'hidden',

          transform: 'translate(' + (innerWidth/2 - width/2) + 'px,' + (innerHeight/2 - height/2) + 'px) ' +
            getObjectCSSMatrix(
              localMatrix.compose(
                localVector.set(0, 0, 0),
                localQuaternion.set(0, 0, 0, 1),
                localVector2.setScalar(scaleFactor)
              )
            ),
          pointerEvents: 'auto',
        }}
      >
        {dom.render()}
      </div>
    </div>
  );
}

const DomRendererChildren = ({
  domRenderEngine,
  innerWidth,
  innerHeight,
  fov,
}) => {
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const update = () => {
      setEpoch(epoch + 1);
    };
    domRenderEngine.addEventListener('update', update);
    return () => {
      domRenderEngine.removeEventListener('update', update);
    };
  }, [epoch]);

  return <>
    {domRenderEngine.doms.map((dom, i) => {
      return (
        <DomRendererChild
          dom={dom}
          innerWidth={innerWidth}
          innerHeight={innerHeight}
          fov={fov}
          key={i}
        />
      );
    })}
  </>
};

const DomRenderer = props => {
  const [innerWidth, setInnerWidth] = useState(window.innerWidth);
  const [innerHeight, setInnerHeight] = useState(window.innerHeight);
  const [fov, setFov] = useState(_getFov());
  const iframeContainerRef = useRef();

  useEffect(() => {
    const resize = e => {
      setInnerWidth(window.innerWidth);
      setInnerHeight(window.innerHeight);
      setFov(_getFov());
    };
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div
      className={'iframe-container'}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: `${innerWidth}px`,
        height: `${innerHeight}px`,
        perspective: `${fov}px`,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: -1,
      }}
      ref={iframeContainerRef}
    >
      <DomRendererChildren
        domRenderEngine={domRenderEngine}
        innerWidth={innerWidth}
        innerHeight={innerHeight}
        fov={fov}
      />
    </div>
  );
};
export {
  DomRenderer,
};