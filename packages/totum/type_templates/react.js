import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useDomRenderer, useInternals, useWear, useCleanup} = metaversefile;

let baseUrl = import.meta.url.replace(/(\\/)[^\\/\\\\]*$/, '$1');
{
  const bu = new URL(baseUrl);
  const proxyPrefix ='/@proxy/';
  if (bu.pathname.startsWith(proxyPrefix)) {
    baseUrl = bu.pathname.slice(proxyPrefix.length) + bu.search + bu.hash;
  }
}

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

export default e => {  
  const app = useApp();
  const {sceneLowerPriority} = useInternals();
  const domRenderEngine = useDomRenderer();

  let srcUrl = ${this.srcUrl};
  
  let dom = null;
  const transformMatrix = new THREE.Matrix4();
  e.waitUntil((async () => {
    const res = await fetch(srcUrl);
    const json = await res.json();
    let {position, quaternion, scale, jsxUrl} = json;

    app.setComponent('wear', {
      boneAttachment: 'head',
      position,
      quaternion,
      scale,
    });

    if (/^\\./.test(jsxUrl)) {
      jsxUrl = new URL(jsxUrl, baseUrl).href;
    }
    if (/^https?:\\/\\//.test(jsxUrl) && !jsxUrl.startsWith(location.origin)) {
      jsxUrl = '/@proxy/' + jsxUrl;
    }
    const m = await import(jsxUrl);
  
    dom = domRenderEngine.addDom({
      render: () => m.default(),
    });

    {
      let needsMatrix = false;
      if (Array.isArray(position)) {
        localVector.fromArray(position);
        needsMatrix = true;
      } else {
        localVector.set(0, 0, 0);
      }
      if (Array.isArray(quaternion)) {
        localQuaternion.fromArray(quaternion);
        needsMatrix = true;
      } else {
        localQuaternion.identity();
      }
      if (Array.isArray(scale)) {
        localVector2.fromArray(scale);
        needsMatrix = true;
      } else {
        localVector2.set(1, 1, 1);
      }
      if (needsMatrix) {
        transformMatrix.compose(localVector, localQuaternion, localVector2);
      }
    }

    sceneLowerPriority.add(dom);
    dom.updateMatrixWorld();
  })());

  useFrame(() => {
    if (dom) {
      if (!wearing) {
        localMatrix.multiplyMatrices(
          app.matrixWorld,
          transformMatrix,
        ).decompose(dom.position, dom.quaternion, dom.scale);
        dom.updateMatrixWorld();
      } else {
        dom.position.copy(app.position);
        dom.quaternion.copy(app.quaternion);
        dom.scale.copy(app.scale);
        dom.updateMatrixWorld();
      }
    }
  });

  let wearing = false;
  useWear(e => {
    wearing = e.wear;
  });

  useCleanup(() => {
    if (dom) {
      dom.destroy();
    }
  });

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'react';
export const components = ${this.components};