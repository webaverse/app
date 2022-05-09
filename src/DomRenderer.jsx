import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
// import classnames from 'classnames';
// import dioramaManager from '../diorama.js';
// import game from '../game.js';
// import dioramaManager from '../diorama.js';
// import {NpcPlayer} from '../character-controller.js';
// import {world} from '../world.js';
// import styles from './MegaHup.module.css';
import {scene, camera} from '../renderer.js';
// import {RpgText} from './RpgText.jsx';
// import {chatTextSpeed} from '../constants.js';
// import metaversefile from 'metaversefile';
// const {useLocalPlayer} = metaversefile;
// import {chatTextSpeed} from '../constants.js';

const width = 400;

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
    // iframe,
    width,
    height,
  }) {
    const geometry = new THREE.PlaneBufferGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
      // colorWrite: false,
      // depthWrite: true,
      opacity: 0,
      transparent: true,
      blending: THREE.MultiplyBlending
    });
    super(geometry, material);

    // this.iframe = iframe;
  }
  
  /* onBeforeRender(renderer, scene, camera, geometry, material, group) {
    super.onBeforeRender && super.onBeforeRender.apply(this, arguments);
    
    console.log('before render', this.iframe);
  } */
}

class DomRenderFrame {
  constructor(iframeContainer2) {
    this.iframeContainer2 = iframeContainer2;
  }
  update() {
    if (app.parent) {
      object2.position.copy(object.position);
      object2.quaternion.copy(object.quaternion);
      object2.scale.copy(object.scale);
      // object2.matrix.copy(object.matrix);
      // object2.matrixWorld.copy(object.matrixWorld);
      object2.updateMatrixWorld();
      
      const cameraCSSMatrix =
        // 'translateZ(' + fov + 'px) ' +
        getCameraCSSMatrix(
          localMatrix.copy(camera.matrixWorldInverse)
            // .invert()
            .premultiply(
              localMatrix2.makeTranslation(0, 0, fov)
            )
            .multiply(
              object.matrixWorld
            )
            /* .premultiply(
              localMatrix2.makeScale(1/window.innerWidth, -1/window.innerHeight, 1)
                .invert()
            ) */
            // .invert()
        );
      this.iframeContainer2.style.transform = cameraCSSMatrix;
      this.iframeContainer2.style.visibility = null;
    } else {
      this.iframeContainer2.style.visibility = 'hidden';
    }
  }
}

class DomRenderEngine {
  constructor(iframeContainer, scene) {
    this.iframeContainer = iframeContainer;
    this.scene = scene;

    console.log('mutation observer', this.iframeContainer);
  }
}














const TotumHtmlTypeTemplate = e => {
  const app = useApp();
  const physics = usePhysics();
  
  const object = app;
  const {
    sceneHighPriority,
    camera,
    iframeContainer,
  } = useInternals();
  const res = app.getComponent('resolution');
  const width = res[0];
  const height = res[1];
  const scale = Math.min(1/width, 1/height);

  const _makeIframe = () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('width', width); 
    iframe.setAttribute('height', height); 
    iframe.style.width = width + 'px';
    iframe.style.height = height + 'px';
    // iframe.style.opacity = 0.75;
    iframe.style.background = 'white';
    iframe.style.border = '0';
    iframe.src = href;
    // window.iframe = iframe;
    iframe.style.width = width + 'px';
    iframe.style.height = height + 'px';
    iframe.style.visibility = 'hidden';
    return iframe;
  };
  let iframe = _makeIframe();
  document.body.appendChild(iframe);
  
  const iframeContainer2 = document.createElement('div');
  iframeContainer2.style.cssText = 'position: absolute; left: 0; top: 0; bottom: 0; right: 0;';
  iframeContainer.appendChild(iframeContainer2);
  
  let fov = 0;
  const _updateSize = () => {
    fov = iframeContainer.getFov();
    
    iframe.style.transform = 'translate(' + (window.innerWidth/2 - width/2) + 'px,' + (window.innerHeight/2 - height/2) + 'px) ' + getObjectCSSMatrix(
      localMatrix.compose(
        localVector.set(0, 0, 0),
        localQuaternion.set(0, 0, 0, 1),
        localVector2.setScalar(scale)
      )
    );
    iframe.style.pointerEvents = 'auto';
  };
  _updateSize();

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
  // const object = new THREE.Mesh();
  // object.contentId = contentId;
  // object.frustumCulled = false;
  // object.isHtml = true;
  let physicsIds = [];
  let staticPhysicsIds = [];
  {
    const physicsId = physics.addBoxGeometry(
      new THREE.Vector3(),
      new THREE.Quaternion(),
      new THREE.Vector3(width * scale * app.scale.x / (app.scale.x * 2), height * scale * app.scale.y / (app.scale.y * 2), 0.001),
      false
    );
    physicsIds.push(physicsId);
    staticPhysicsIds.push(physicsId);
    
    iframe.addEventListener('load', e => {
      iframe.style.visibility = null;
      iframeContainer2.appendChild(iframe);
    }, {once: true});
    sceneHighPriority.add(object2);
  }
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
    staticPhysicsIds.length = 0;
    
    iframeContainer2.parentElement.removeChild(iframeContainer2);
    sceneHighPriority.remove(object2);
  });
  /* object.getPhysicsIds = () => physicsIds;
  object.getStaticPhysicsIds = () => staticPhysicsIds;
  object.hit = () => {
    console.log('hit', object); // XXX
    return {
      hit: false,
      died: false,
    };
  }; */
  
  useFrame(e => {
    if (app.parent) {
      object2.position.copy(object.position);
      object2.quaternion.copy(object.quaternion);
      object2.scale.copy(object.scale);
      // object2.matrix.copy(object.matrix);
      // object2.matrixWorld.copy(object.matrixWorld);
      object2.updateMatrixWorld();

      const cameraCSSMatrix =
        // 'translateZ(' + fov + 'px) ' +
        getCameraCSSMatrix(
          localMatrix.copy(camera.matrixWorldInverse)
            // .invert()
            .premultiply(
              localMatrix2.makeTranslation(0, 0, fov)
            )
            .multiply(
              object.matrixWorld
            )
            /* .premultiply(
              localMatrix2.makeScale(1/window.innerWidth, -1/window.innerHeight, 1)
                .invert()
            ) */
            // .invert()
        );
      iframeContainer2.style.transform = cameraCSSMatrix;
      iframeContainer2.style.visibility = null;
    } else {
      iframeContainer2.style.visibility = 'hidden';
    }
  });
  useResize(_updateSize);
  
  return object;
};























const DomRenderer = props => {
  const [width, setWidth] = useState(window.innerHeight);
  const [height, setHeight] = useState(window.innerHeight);
  const [fov, setFov] = useState(_getFov());
  const iframeContainerRef = useRef();
  const [domRenderEngine, setDomRenderEngine] = useState(null);
  const children = React.Children.toArray(props.children);

  useEffect(() => {
    const resize = e => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
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
        width,
        height,
        perspective: `${fov}px`,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      ref={iframeContainerRef}
    >
      {
        children.map((child, i) => {
          const width = child.props.width;
          const height = child.props.height;

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
                style={{
                  width: width + 'px',
                  height: height + 'px',
                  basckground: 'white',
                  border: '0',
                  // visibility: 'hidden',
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