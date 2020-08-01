import * as THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
// import {XRPackage} from './run.js';
import {TextMesh} from './textmesh-standalone.esm.js'

const makeTextMesh = (text = '', font = './GeosansLight.ttf', fontSize = 1, anchorX = 'left', anchorY = 'middle') => {
  const textMesh = new TextMesh();
  textMesh.text = text;
  textMesh.font = font;
  textMesh.fontSize = fontSize;
  textMesh.color = 0x000000;
  textMesh.anchorX = anchorX;
  textMesh.anchorY = anchorY;
  textMesh.frustumCulled = false;
  textMesh.sync();
  return textMesh;
};

/* const apiHost = 'https://ipfs.exokit.org/ipfs';

let dragMesh = null;

const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localRaycater = new THREE.Raycaster();

const makeWristMenu = ({scene, ray, highlightMesh, addPackage}) => {
  const object = new THREE.Object3D();

  const size = 1;
  const packageWidth = size*0.9;
  const packageHeight = size*0.1;
  const packageMargin = size*0.2;
  const sidebarSize = size*0.1;

  const _makeSide = name => {
    const object = new THREE.Object3D();
    
    const background = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(size, size),
      new THREE.MeshBasicMaterial({
        color: 0xEEEEEE,
        side: THREE.DoubleSide,
      })
    );
    object.add(background);

    const textMesh = makeTextMesh(name, undefined, size*0.1);
    textMesh.position.x = -size/2;
    textMesh.position.y = size/2;
    textMesh.position.z = 0.001;
    object.add(textMesh);

    {
      const img = new Image();
      const texture = new THREE.Texture(img);
      (async () => {
        img.crossOrigin = 'Anonymous';
        img.src = './chevron-up.png';
        await new Promise((accept, reject) => {
          img.onload = () => {
            texture.needsUpdate = true;
          };
          img.onerror = reject;
        });
      })();
      const chevronUp = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          alphaTest: 0.5,
        })
      );
      chevronUp.scale.set(sidebarSize, sidebarSize, 0.001);
      chevronUp.position.x = size/2 - sidebarSize/2;
      chevronUp.position.y = size/2 - sidebarSize/2;
      chevronUp.position.z = 0.001;
      object.add(chevronUp);
      object.chevronUp = chevronUp;
    }
    {
      const img = new Image();
      const texture = new THREE.Texture(img);
      (async () => {
        img.crossOrigin = 'Anonymous';
        img.src = './chevron-down.png';
        await new Promise((accept, reject) => {
          img.onload = () => {
            texture.needsUpdate = true;
          };
          img.onerror = reject;
        });
      })();
      const chevronDown = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          alphaTest: 0.5,
        })
      );
      chevronDown.scale.set(sidebarSize, sidebarSize, 0.001);
      chevronDown.position.x = size/2 - sidebarSize/2;
      chevronDown.position.y = -size/2 + sidebarSize/2;
      chevronDown.position.z = 0.001;
      object.add(chevronDown);
      object.chevronDown = chevronDown;
    }
    
    return object;
  };
  const _makePackageSide = name => {
    const object = _makeSide(name);
    
    const _makePackageMesh = pJ => {
      const {name, dataHash, icons} = pJ;
      const iconHash = icons && icons.find(i => i.type === 'image/gif').hash;

      const object = new THREE.Object3D();
      object.position.x = -size/2 + packageWidth/2;
      object.dataHash = dataHash;

      const backgroundMesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          color: 0xb0bec5,
          side: THREE.DoubleSide,
        })
      );
      backgroundMesh.scale.set(packageWidth, packageHeight, 0.01);
      object.add(backgroundMesh);
      object.backgroundMesh = backgroundMesh;

      const img = new Image();
      const texture = new THREE.Texture(img);
      (async () => {
        img.crossOrigin = 'Anonymous';
        img.src = `${apiHost}/${iconHash}.gif`;
        await new Promise((accept, reject) => {
          img.onload = () => {
            texture.needsUpdate = true;
          };
          img.onerror = reject;
        });
      })();

      const imgMesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(packageHeight, packageHeight),
        new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
        })
      );
      imgMesh.position.x = -packageWidth/2 + packageHeight/2;
      imgMesh.position.z = 0.001;
      object.add(imgMesh);

      const textMesh = makeTextMesh(name, undefined, size*0.05);
      textMesh.position.x = -packageWidth/2 + packageHeight;
      textMesh.position.y = packageHeight/2;
      textMesh.position.z = 0.001;
      object.add(textMesh);

      return object;
    };
    
    const packages = new THREE.Object3D();
    packages.position.z = 0.001;
    object.add(packages);

    let currentPage = 0;
    const packagesPerPage = 8;
    let ps = [];
    object.setPackages = newPs => {
      ps = newPs;
      object.renderPackages();
    };
    object.goPage = n => {
      currentPage += n;
      currentPage = Math.min(Math.max(currentPage, 0), Math.floor(ps.length / packagesPerPage));
      object.renderPackages();
    };
    object.renderPackages = () => {
      packages.children.length = 0;
      ps.slice(currentPage * packagesPerPage, (currentPage + 1) * packagesPerPage).forEach((p, i) => {
        const packageMesh = _makePackageMesh(p);
        packageMesh.offset = i*packageHeight;
        packageMesh.position.y = size/2 - packageMargin - packageHeight/2 - packageMesh.offset;
        packages.add(packageMesh);
      });
    };
    object.updateIntersect = () => {
      highlightMesh.visible = false;

      if (!dragMesh) {
        highlightMesh.onmousedown = null;
        highlightMesh.onmouseup = null;

        localRaycater.ray.origin.copy(ray.position);
        localRaycater.ray.direction.set(0, 0, -1).applyQuaternion(ray.quaternion);
        const intersects = localRaycater.intersectObjects(
          [object.chevronUp, object.chevronDown].concat(
            packages.children.map(p => p.backgroundMesh)
          )
        );
        if (intersects.length > 0) {
          const [intersect] = intersects;
          const {object: intersectObject} = intersect;
          if (intersectObject === object.chevronUp) {
            highlightMesh.onmousedown = () => {
              object.goPage(-1);
            };

            return true;
          } else if (intersectObject === object.chevronDown) {
            highlightMesh.onmousedown = () => {
              object.goPage(1);
            };

            return true;
          } else {
            intersectObject.getWorldPosition(highlightMesh.position);
            intersectObject.getWorldQuaternion(highlightMesh.quaternion);
            intersectObject.getWorldScale(highlightMesh.scale);
            highlightMesh.visible = true;

            const packageMesh = intersectObject.parent;
            highlightMesh.onmousedown = () => {
              dragMesh = packageMesh.clone(true);
              dragMesh.dataHash = packageMesh.dataHash;
              dragMesh.startMatrix = packageMesh.matrixWorld.clone();
              dragMesh.startRayMatrix = ray.matrixWorld.clone();
              scene.add(dragMesh);
            };
            highlightMesh.onmouseup = () => {
              (async () => {
                const {dataHash, matrix} = dragMesh;
                const p = await XRPackage.download(dataHash);
                await addPackage(p, matrix);
              })();
              scene.remove(dragMesh);
              dragMesh = null;
            };

            return true;
          }
        }
      }
      return false;
    };
    return object;
  };
  const _makeObjectsSide = name => {
    const object = _makeSide(name);
    
    const objects = new THREE.Object3D();
    objects.position.z = 0.001;
    object.add(objects);
    
    const _makeObjectMesh = oJ => {
      const {name, dataHash, icons} = oJ;
      const iconHash = icons && icons.find(i => i.type === 'image/gif').hash;

      const object = new THREE.Object3D();
      object.position.x = -size/2 + packageWidth/2;
      object.object = oJ;

      const backgroundMesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          color: 0xb0bec5,
          side: THREE.DoubleSide,
        })
      );
      backgroundMesh.scale.set(packageWidth, packageHeight, 0.01);
      object.add(backgroundMesh);
      object.backgroundMesh = backgroundMesh;

      const img = new Image();
      const texture = new THREE.Texture(img);
      (async () => {
        const u = await oJ.getScreenshotImageUrl();
        img.crossOrigin = 'Anonymous';
        img.src = u;
        await new Promise((accept, reject) => {
          img.onload = () => {
            texture.needsUpdate = true;
          };
          img.onerror = reject;
        });
      })();

      const imgMesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(packageHeight, packageHeight),
        new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
        })
      );
      imgMesh.position.x = -packageWidth/2 + packageHeight/2;
      imgMesh.position.z = 0.001;
      object.add(imgMesh);

      const textMesh = makeTextMesh(name, undefined, size*0.05);
      textMesh.position.x = -packageWidth/2 + packageHeight;
      textMesh.position.y = packageHeight/2;
      textMesh.position.z = 0.001;
      object.add(textMesh);

      return object;
    };

    let currentPage = 0;
    const objectsPerPage = 8;
    let os = [];
    object.setObjects = newOs => {
      os = newOs;
      object.renderObjects();
    };
    object.goPage = n => {
      currentPage += n;
      currentPage = Math.min(Math.max(currentPage, 0), Math.floor(os.length / objectsPerPage));
      object.renderObjects();
    };
    object.renderObjects = () => {
      objects.children.length = 0;
      os.slice(currentPage * objectsPerPage, (currentPage + 1) * objectsPerPage).forEach((o, i) => {
        const packageMesh = _makeObjectMesh(o);
        packageMesh.offset = i*packageHeight;
        packageMesh.position.y = size/2 - packageMargin - packageHeight/2 - packageMesh.offset;
        objects.add(packageMesh);
      });
    };
    object.updateIntersect = () => {
      if (!highlightMesh.onmousedown) {
        highlightMesh.visible = false;
        
        localRaycater.ray.origin.copy(ray.position);
        localRaycater.ray.direction.set(0, 0, -1).applyQuaternion(ray.quaternion);
        const intersects = localRaycater.intersectObjects(
          [object.chevronUp, object.chevronDown].concat(
            objects.children.map(p => p.backgroundMesh)
          )
        );
        if (intersects.length > 0) {
          const [intersect] = intersects;
          const {object: intersectObject} = intersect;
          if (intersectObject === object.chevronUp) {
            highlightMesh.onmousedown = () => {
              object.goPage(-1);
            };

            return true;
          } else if (intersectObject === object.chevronDown) {
            highlightMesh.onmousedown = () => {
              object.goPage(1);
            };

            return true;
          } else {
            intersectObject.getWorldPosition(highlightMesh.position);
            intersectObject.getWorldQuaternion(highlightMesh.quaternion);
            intersectObject.getWorldScale(highlightMesh.scale);
            highlightMesh.visible = true;

            const objectMesh = intersectObject.parent;
            highlightMesh.onmousedown = () => {
              const {object} = objectMesh;
              console.log('click object', object);
            };
            highlightMesh.onmouseup = () => {
              // nothing
            };

            return true;
          }
        }
      }
      return false;
    };
    
    return object;
  };
  
  const packageSide = _makePackageSide('Packages');
  object.add(packageSide);
  object.packageSide = packageSide;

  const inventorySide = _makePackageSide('Inventory');
  inventorySide.position.x = 1;
  object.add(inventorySide);
  object.inventorySide = inventorySide;
  
  const objectsSide = _makeObjectsSide('Objects');
  objectsSide.position.x = 2;
  object.add(objectsSide);
  object.objectsSide = objectsSide;

  object.update = (frame, session, referenceSpace) => {
    const inputSources = Array.from(session.inputSources);
    const _loadGamepad = i => {
      const inputSource = inputSources[i];
      if (inputSource) {

        let pose, gamepad;
        if ((pose = frame.getPose(inputSource.targetRaySpace, referenceSpace)) && (gamepad = inputSource.gamepad)) {
          localMatrix.fromArray(pose.transform.matrix)
            .decompose(ray.position, ray.quaternion, ray.scale);
          ray.updateMatrixWorld();
        }
      }
    };
    // _loadGamepad(0);
    _loadGamepad(1);
    // object.update();
    if (dragMesh) {
      dragMesh.matrix.copy(dragMesh.startMatrix)
        .premultiply(localMatrix2.getInverse(dragMesh.startRayMatrix))
        .premultiply(ray.matrixWorld)
        .decompose(dragMesh.position, dragMesh.quaternion, dragMesh.scale);
    }

    packageSide.updateIntersect() || inventorySide.updateIntersect() || objectsSide.updateIntersect();
  };
  
  return object;
};
const makeHighlightMesh = () => {
  const highlightMesh = new THREE.Mesh(
    new THREE.BoxBufferGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.1,
    })
  );
  highlightMesh.visible = false;
  return highlightMesh;
};
const makeRayMesh = () => {
  const ray = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(0.01, 0.01, 10, 3, 1)
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 10/2, 0))
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2))),
    new THREE.MeshBasicMaterial({
      color: 0x64b5f6,
    })
  );
  ray.frustumCulled = false;
  return ray;
}; */

const uiSize = 2048;
const uiWorldSize = 0.2;

const uiRenderer = (() => {
  const loadPromise = Promise.all([
    new Promise((accept, reject) => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://render.exokit.xyz/';
      iframe.onload = () => {
        accept(iframe);
      };
      iframe.onerror = err => {
        reject(err);
      };
      iframe.setAttribute('frameborder', 0);
      iframe.style.position = 'absolute';
      iframe.style.width = `${uiSize}px`;
      iframe.style.height = `${uiSize}px`;
      iframe.style.top = '-4096px';
      iframe.style.left = '-4096px';
      document.body.appendChild(iframe);
    }),
    /* fetch('interface-world.html')
      .then(res => res.text()), */
  ]);

  let renderIds = 0;
  return {
    async render() {
      const [iframe/*, interfaceHtml*/] = await loadPromise;

      if (renderIds > 0) {
        iframe.contentWindow.postMessage({
          method: 'cancel',
          id: renderIds,
        });
      }

      const start = Date.now();
      const mc = new MessageChannel();
      iframe.contentWindow.postMessage({
        method: 'render',
        id: ++renderIds,
        htmlString: `\
<style>
* {
  box-sizing: border-box;
}
.body {
  background-color: transparent;
  font-family: 'Bangers';
}
.border {
  position: absolute;
  width: ${uiSize/8}px;
  height: ${uiSize/8}px;
  border: 30px solid #111;
}
.border.top-left {
  top: 0;
  left: 0;
  border-top-left-radius: ${uiSize}px;
  border-bottom: 0;
  border-right: 0;
}
.border.top-right {
  top: 0;
  right: 0;
  border-top-right-radius: ${uiSize}px;
  border-bottom: 0;
  border-left: 0;
}
.border.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom-left-radius: ${uiSize}px;
  border-top: 0;
  border-right: 0;
}
.border.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom-right-radius: ${uiSize}px;
  border-top: 0;
  border-left: 0;
}
.wrap {
  position: absolute;
  height: ${uiSize - uiSize/12*2}px;
  width: ${uiSize - uiSize/12*2}px;
  top: ${uiSize/12}px;
  left: ${uiSize/12}px;
  padding: ${uiSize/20}px;
  background-color: #FFF;
  font-size: 50px;
}
h1, h2, h3 {
  margin: 0;
  margin-bottom: ${uiSize/50}px;
}
.tiles {
  display: flex;
}
.tiles .tile {
  display: flex;
  flex-direction: column;
  background-color: #7e57c2;
  margin-right: ${uiSize/100}px;
  margin-bottom: ${uiSize/100}px;
  padding-bottom: 0;
}
.tiles .tile .img {
  width: ${uiSize/10}px;
  height: ${uiSize/10*1.2}px;
  margin: ${uiSize/100}px;
  background-color: #FFF;
}
.tiles .tile .text {
  padding: ${uiSize/100}px;
  padding-top: 0;
  color: #FFF;
}
</style>
<div class=body>
  <div class="border top-left"></div>
  <div class="border top-right"></div>
  <div class="border bottom-left"></div>
  <div class="border bottom-right"></div>
  <div class=wrap>
    <h3>Inventory</h3>
    <div class=tiles>
      <a class=tile id=inventory-1>
        <div class=img></div>
        <div class=text>Rifle</div>
      </a>
      <a class=tile id=inventory-2>
        <div class=img></div>
        <div class=text>Pickaxe</div>
      </a>
    </div>
  </div>
</div>
`,
        templateData: null,
        width: uiSize,
        height: uiSize,
        transparent: true,
        port: mc.port2,
      }, '*', [mc.port2]);
      const result = await new Promise((accept, reject) => {
        mc.port1.onmessage = e => {
          const {data} = e;
          const {error, result} = data;

          if (result) {
            console.log('time taken', Date.now() - start);

            accept(result);
          } else {
            reject(error);
          }
        };
      });
      return result;
    },
  };
})();

const makeUiMesh = () => {
  const geometry = new THREE.PlaneBufferGeometry(0.2, 0.2)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize/2, 0));
  const canvas = document.createElement('canvas');
  canvas.width = uiSize;
  canvas.height = uiSize;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(uiSize, uiSize);
  const texture = new THREE.Texture(
    canvas,
    THREE.UVMapping,
    THREE.ClampToEdgeWrapping,
    THREE.ClampToEdgeWrapping,
    THREE.LinearFilter,
    THREE.LinearMipMapLinearFilter,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
    16,
    THREE.LinearEncoding
  );
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.7,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  mesh.frustumCulled = false;
  
  const highlightMesh = (() => {
    const geometry = new THREE.BoxBufferGeometry(1, 1, 0.01);
    const material = new THREE.MeshBasicMaterial({
      color: 0x42a5f5,
      transparent: true,
      opacity: 0.5,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.visible = false;
    return mesh;
  })();
  /* highlightMesh.position.x = -uiWorldSize/2 + (10 + 150/2)/uiSize*uiWorldSize;
  highlightMesh.position.y = uiWorldSize - (60 + 150/2)/uiSize*uiWorldSize;
  highlightMesh.scale.x = highlightMesh.scale.y = 150/uiSize*uiWorldSize; */
  mesh.add(highlightMesh);

  let anchors = [];
  mesh.update = () => {
    uiRenderer.render()
      .then(result => {
        imageData.data.set(result.data);
        ctx.putImageData(imageData, 0, 0);
        texture.needsUpdate = true;
        mesh.visible = true;
        
        anchors = result.anchors;
        // console.log(anchors);
      });
  };
  let hoveredAnchor = null;
  mesh.intersect = uv => {
    hoveredAnchor = null;
    highlightMesh.visible = false;

    if (uv) {
      uv.y = 1 - uv.y;
      uv.multiplyScalar(uiSize);

      for (let i = 0; i < anchors.length; i++) {
        const anchor = anchors[i];
        const {top, bottom, left, right, width, height} = anchor;
        if (uv.x >= left && uv.x < right && uv.y >= top && uv.y < bottom) {
          hoveredAnchor = anchor;
          
          highlightMesh.position.x = -uiWorldSize/2 + (left + width/2)/uiSize*uiWorldSize;
          highlightMesh.position.y = uiWorldSize - (top + height/2)/uiSize*uiWorldSize;
          highlightMesh.scale.x = width/uiSize*uiWorldSize;
          highlightMesh.scale.y = height/uiSize*uiWorldSize;
          highlightMesh.visible = true;
          break;
        }
      }
    }
  };
  mesh.click = () => {
    console.log('got click', hoveredAnchor);
    /* if (hoveredAnchor) {
      const {id} = hoveredAnchor;
      if (/^(?:tool-|color-)/.test(id)) {
        interfaceDocument.getElementById(id).click();
      } else {
        switch (id) {
          default: {
            console.warn('unknown anchor click', id);
            break;
          }
        }
      }
      return true;
    } else {
      return false;
    } */
  };
  mesh.update();

  return mesh;
};

export {
  makeUiMesh,
  makeTextMesh,
  /* makeWristMenu,
  makeHighlightMesh,
  makeRayMesh, */
};