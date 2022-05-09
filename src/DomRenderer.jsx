import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import gameManager from '../game.js';
import {scene, camera} from '../renderer.js';

const floatFactor = 0.05;
const floatTime = 3000;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

const _getFov = () => camera.projectionMatrix.elements[ 5 ] * (window.innerHeight / 2);

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
    const geometry = new THREE.PlaneBufferGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
      opacity: 0,
      transparent: true,
      blending: THREE.MultiplyBlending
    });
    super(geometry, material);
  }
}

class DomRenderEngine {
  constructor(iframeContainer, scene) {
    this.iframeContainer = iframeContainer;
    this.scene = scene;

    const basePosition = new THREE.Vector3(-9, 1, -1);
    
    const _bindChild = iframeContainer2 => {
      // gather constants
      
      const iframe = iframeContainer2.firstChild;
      const width = parseInt(iframe.getAttribute('width'), 10);
      const height = parseInt(iframe.getAttribute('height'), 10);
      const scale = Math.min(1/width, 1/height);

      // attach scene punch-through object

      const object = new THREE.Object3D();
      object.position.copy(basePosition);
      scene.add(object);
      object.updateMatrixWorld();

      const object2 = new IFrameMesh({
        // iframe,
        width: width * scale,
        height: height * scale,
      });
      object2.frustumCulled = false;
  
      object2.onBeforeRender = (renderer) => {
        const context = renderer.getContext();
        context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);
      };
      object2.onAfterRender = (renderer) => {
        const context = renderer.getContext();
        context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
      };
      object.add(object2);
      object2.updateMatrixWorld();

      // listeners

      gameManager.addEventListener('render', e => {
        const _animateMenuFloat = () => {
          const now = performance.now();
          object.position.copy(basePosition);
          object.position.y += Math.sin((now % floatTime)/floatTime * 2 * Math.PI) * floatFactor;
          object.position.y += Math.cos(((now / 2) % floatTime)/floatTime * 2 * Math.PI) * floatFactor/2;
          object.position.y += Math.sin(((now / 4) % floatTime)/floatTime * 2 * Math.PI) * floatFactor/4;
          object.updateMatrixWorld();
        };

        const fov = _getFov();
        const cameraCSSMatrix =
          getCameraCSSMatrix(
            localMatrix.copy(camera.matrixWorldInverse)
              .premultiply(
                localMatrix2.makeTranslation(0, 0, fov)
              )
              .multiply(
                object.matrixWorld
              )
          );
        iframeContainer2.style.transform = cameraCSSMatrix;
      });
    };

    const _bindInitialChildren = () => {
      const children = Array.from(iframeContainer.childNodes);
      for (const child of children) {
        _bindChild(child);
      }
    };
    _bindInitialChildren();

    const _listenForChildren = () => {
      const callback = function(mutationsList, observer) {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            console.log('dom render childlist');
          } else if (mutation.type === 'attributes') {
            console.log('dom render attributes');
          }
        }
      };
      const observer = new MutationObserver(callback);
      observer.observe(this.iframeContainer, {
        childList: true,
      });
    };
    _listenForChildren();
  }
}

const DomRenderer = props => {
  const [innerWidth, setInnerWidth] = useState(window.innerWidth);
  const [innerHeight, setInnerHeight] = useState(window.innerHeight);
  const [fov, setFov] = useState(_getFov());
  const iframeContainerRef = useRef();
  const [domRenderEngine, setDomRenderEngine] = useState(null);
  const children = React.Children.toArray(props.children);

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

  useEffect(() => {
    const iframeContainer = iframeContainerRef.current;
    if (iframeContainer) {
      const domRenderEngine = new DomRenderEngine(iframeContainer, scene);
      setDomRenderEngine(domRenderEngine);

      return () => {
        domRenderEngine.destroy();
      };
    }
  }, [iframeContainerRef]);

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
      {
        children.map((child, i) => {
          const width = child.props.width;
          const height = child.props.height;
          const scale = Math.min(1/width, 1/height);

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
              key={i}
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

                  transform: 'translate(' + (innerWidth/2 - width/2) + 'px,' + (innerHeight/2 - height/2) + 'px) ' + getObjectCSSMatrix(
                    localMatrix.compose(
                      localVector.set(0, 0, 0),
                      localQuaternion.set(0, 0, 0, 1),
                      localVector2.setScalar(scale)
                    )
                  ),
                  pointerEvents: 'auto',
                }}
              >
                {child}
              </div>
            </div>
          );
        })
      }
    </div>
  );
};
export {
  DomRenderer,
};