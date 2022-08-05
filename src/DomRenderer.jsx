import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import gameManager from '../game.js';
import {camera} from '../renderer.js';
import cameraManager from '../camera-manager.js';
import {playersManager} from '../players-manager.js';

// import {CharacterBanner} from './CharacterBanner.jsx';
import domRenderEngine, {DomRenderEngine} from '../dom-renderer.jsx';

const floatFactor = 0.05;
const floatTime = 3000;
const transtionTime = 1000;
const scaleEpsilon = 0.01;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();

const scaleMatrix = new THREE.Matrix4().makeScale(1 + scaleEpsilon, 1 + scaleEpsilon, 1 + scaleEpsilon);

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

const DomRendererChild = ({
  dom,
  innerWidth,
  innerHeight,
  range = 5,
}) => {
  const {width, height} = dom;
  const scaleFactor = DomRenderEngine.getScaleFactor(width, height);
  const [visible, setVisible] = useState(false);
  const iframeContainer2Ref = useRef();

  // tracking
  useEffect(() => {
    const iframeContainer2 = iframeContainer2Ref.current;

    if (iframeContainer2) {
      const frame = e => {
        const {timestamp} = e.data;
        
        const _animateMenuFloat = () => {
          const now = timestamp;
          
          dom.floatNode.position.set(0, 0, 0);
          dom.floatNode.position.y += Math.sin((now % floatTime)/floatTime * 2 * Math.PI) * floatFactor;
          dom.floatNode.position.y += Math.cos(((now / 2) % floatTime)/floatTime * 2 * Math.PI) * floatFactor/2;
          dom.floatNode.position.y += Math.sin(((now / 4) % floatTime)/floatTime * 2 * Math.PI) * floatFactor/4;
          dom.floatNode.updateMatrixWorld();
        };
        _animateMenuFloat();
        
        const floatNodeMatrixWorld = localMatrix3
          .multiplyMatrices(dom.floatNode.matrixWorld, scaleMatrix);

        const _updateCameraContainerMatrix = () => {
          const fov = _getFov();
          const cameraCSSMatrix = getCameraCSSMatrix(
            localMatrix.copy(camera.matrixWorldInverse)
              .premultiply(
                localMatrix2.makeTranslation(0, 0, fov)
              )
              .multiply(
                floatNodeMatrixWorld
              )
          );
          iframeContainer2.style.transform = cameraCSSMatrix;
        };
        _updateCameraContainerMatrix();
      };
      gameManager.addEventListener('frame', frame);

      return () => {
        gameManager.removeEventListener('frame', frame);
      };
    }
  }, [iframeContainer2Ref]);

  // visibility
  useEffect(() => {
    const frame = e => {
      const {timestamp} = e.data;
      const startTime = timestamp;
      const endTime = startTime + transtionTime;

      const _updateVisibility = () => {
        const localPlayer = playersManager.getLocalPlayer();
        const distance = localPlayer.position.distanceTo(dom.position);
        const isInRange = distance < range;
        if (isInRange && !visible) {
          setVisible(true);
          dom.startAnimation(true, startTime, endTime);
        } else if (visible && !isInRange) {
          setVisible(false);
          dom.startAnimation(false, startTime, endTime);
        }
      };
      _updateVisibility();

      const _updateAnimation = () => {
        dom.update(timestamp)
      };
      _updateAnimation();
    };
    gameManager.addEventListener('frame', frame);

    return () => {
      gameManager.removeEventListener('frame', frame);
    };
  }, [visible]);

  const preventDefault = e => {
    // e.preventDefault();
    e.stopPropagation();
  };

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
      onMouseDown={preventDefault}
      onClick={preventDefault}
      onMouseUp={preventDefault}
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
  const [fov, setFov] = useState(_getFov);
  const iframeContainerRef = useRef();

  useEffect(() => {
    const resize = e => {
      setInnerWidth(window.innerWidth);
      setInnerHeight(window.innerHeight);
      setFov(_getFov());
    };
    window.addEventListener('resize', resize);
    const fovchange = (/*e*/) => {
      // const {fov} = e.data;
      setFov(_getFov());
    };
    cameraManager.addEventListener('fovchange', fovchange);
    return () => {
      window.removeEventListener('resize', resize);
      cameraManager.removeEventListener('fovchange', fovchange);
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
        // pointerEvents: 'none',
        // userSelect: 'none',
        // zIndex: -1,
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