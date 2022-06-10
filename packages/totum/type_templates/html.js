import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useResize, useInternals, useLoaders, usePhysics, useCleanup} = metaversefile;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

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

export default e => {
  const app = useApp();
  const physics = usePhysics();
  
  const object = app;
  const {
    sceneHighPriority,
    camera,
    iframeContainer,
  } = useInternals();
  const href = ${this.srcUrl};
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
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'html';
export const components = ${this.components};