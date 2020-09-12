import * as THREE from './three.module.js';
// import {scene} from './run.js';
import {TextMesh} from './textmesh-standalone.esm.js';
import easing from './easing.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();

const cubicBezier = easing(0, 1, 0, 1);

function mod(a, b) {
  return ((a % b) + b) % b;
}

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
  ]);

  let renderIds = 0;
  return {
    async render(htmlString, width, height) {
      const [iframe/*, interfaceHtml */] = await loadPromise;

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
        htmlString,
        templateData: null,
        width,
        height,
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

const _makeHtmlString = (label, tiles) => {
  const index = 0;
  return `\
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
  width: ${uiSize / 8}px;
  height: ${uiSize / 8}px;
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
  height: ${uiSize - uiSize / 12 * 2}px;
  width: ${uiSize - uiSize / 12 * 2}px;
  top: ${uiSize / 12}px;
  left: ${uiSize / 12}px;
  padding: ${uiSize / 20}px;
  background-color: #FFF;
  font-size: 50px;
}
h1, h2, h3 {
  margin: 0;
  margin-bottom: ${uiSize / 50}px;
}
.tiles {
  display: flex;
}
.tiles .tile {
  display: flex;
  flex-direction: column;
  background-color: #7e57c2;
  margin-right: ${uiSize / 100}px;
  margin-bottom: ${uiSize / 100}px;
  padding-bottom: 0;
}
.tiles .tile .img {
  width: ${uiSize / 10}px;
  height: ${uiSize / 10 * 1.2}px;
  margin: ${uiSize / 100}px;
  background-color: #FFF;
}
.tiles .tile .text {
  padding: ${uiSize / 100}px;
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
    <h3>${label}</h3>
    ${tiles.map((items, i) => `\
      <div class=tiles>
        ${items.map((item, j) => `\
          <a class=tile id=tile-${i}-${j}>
            <div class=img></div>
            <div class=text>${item}</div>
          </a>
        `).join('\n')}
      </div>
    `).join('\n')}
    </div>
  </div>
</div>
`;
};
const _makeToolsString = (tools, selectedWeapon) => {
  const w = uiSize/tools.length;
  const h = uiSize*uiWorldSize;
  const margin = w/10;
  const wInner = w - margin;

  return `\
<style>
* {
  box-sizing: border-box;
}
.body {
  display: flex;
  background-color: transparent;
  font-family: 'Bangers';
}
.tool {
  display: flex;
  flex-direction: column;
  background-color: #7e57c2;
  width: ${wInner}px;
  margin-right: ${margin}px;
  margin-bottom: ${margin}px;
  padding-bottom: 0;
  overflow: hidden;
}
.tool.selected {
  background-color: #ff7043;
}
.tool .img {
  width: ${wInner - margin*2}px;
  height: ${h - margin*2}px;
  margin: ${margin}px;
  background-color: #FFF;
}
.tool .text {
  padding: ${margin}px;
  padding-top: 0;
  color: #FFF;
}
</style>
<div class=body>
  ${tools.map(tool => `\
    <a class="tool ${tool === selectedWeapon ? 'selected' : ''}" id=tool-${tool}>
      <div class=img></div>
      <div class=text>${tool}</div>
    </a>
  `).join('\n')}
</div>
`;
};
const _makeDetailsString = () => {
  const w = uiSize;
  const h = uiSize*0.5;

  return `\
<style>
* {
  box-sizing: border-box;
}
.body {
  display: flex;
  width: ${w}px;
  height: ${h}px;
  background-color: #FFF;
  border-left: ${w/10}px solid #ff7043;
  font-family: 'Bangers';
}
.wrap {
  display: flex;
  padding-left: ${w/30}px;
  flex: 1;
  flex-direction: column;
}
.buttons {
  display: flex;
  flex-direction: column;
}
.buttons .button {
  display: flex;
  width: 400px;
  height: 400px;
  margin: 50px;
  border: 10px solid #000;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 100px;
}
.header {
  display: flex;
  flex-direction: column;
}
.close-button {
  display: flex;
  width: 200px;
  height: 200px;
  background-color: #000;
  color: #FFF;
  justify-content: center;
  align-items: center;
  font-size: 100px;
}
h1 {
  margin: 30px 0;
  font-size: 200px;
}
p {
  margin: 30px 0;
  font-size: 100px;
}
</style>
<div class=body>
  <div class=wrap>
    <h1>Details</h1>
    <p>Lorem ipsum</p>
  </div>
  <div class=buttons>
    <div class=button>Run</div>
    <div class=button>Add to inventory</div>
  </div>
  <div class=header>
    <div class=close-button>X</div>
  </div>
</div>
`;
};
const _makeInventoryString = () => {
  const margin = uiSize/2/40;
  const w = (uiSize/2 - margin)/3;
  const innerW = w - margin;
  const _makeIcon = () => `\
<div class=icon>
  <div class="border top-left"></div>
  <div class="border top-right"></div>
  <div class="border bottom-left"></div>
  <div class="border bottom-right"></div>
</div>
`;
  return `\
}
<style>
* {
  box-sizing: border-box;
}
.body {
  display: flex;
  width: ${uiSize}px;
  height: ${uiSize/2}px;
  font-family: 'Bangers';
}
.arrow {
  display: flex;
  width: ${uiSize/2/10}px;
  height: ${uiSize/2}px;
  justify-content: center;
  align-items: center;
  background-color: #000;
  color: #FFF;
  font-size: 100px;
}
.icons {
  display: flex;
  width: ${uiSize/2}px;
  height: ${uiSize/2}px;
  padding-top: ${margin}px;
  padding-left: ${margin}px;
  flex-wrap: wrap;
}
.icon {
  display: flex;
  position: relative;
  width: ${innerW}px;
  height: ${innerW}px;
  margin-right: ${margin}px;
  margin-bottom: ${margin}px;
}
.border {
  position: absolute;
  width: ${innerW/4}px;
  height: ${innerW/4}px;
  border: ${innerW/20}px solid #111;
}
.border.top-left {
  top: 0;
  left: 0;
  border-bottom: 0;
  border-right: 0;
}
.border.top-right {
  top: 0;
  right: 0;
  border-bottom: 0;
  border-left: 0;
}
.border.bottom-left {
  bottom: 0;
  left: 0;
  border-top: 0;
  border-right: 0;
}
.border.bottom-right {
  bottom: 0;
  right: 0;
  border-top: 0;
  border-left: 0;
}
.details {
  display: flex;
  padding: 50px;
  background-color: #FFF;
  flex: 1;
  flex-direction: column;
}
h1 {
  margin: 10px 0;
  font-size: 100px;
}
p {
  margin: 10px 0;
  font-size: 60px;
}
</style>
<div class=body>
  <div class=arrow>&lt;</div>
  <div class=icons>
    ${_makeIcon()}
    ${_makeIcon()}
    ${_makeIcon()}
    ${_makeIcon()}
    ${_makeIcon()}
    ${_makeIcon()}
    ${_makeIcon()}
    ${_makeIcon()}
    ${_makeIcon()}
  </div>
  <div class=arrow>&gt;</div>
  <div class=details>
    <h1>Details</h1>
    <p>Lorem ipsum</p>
  </div>
</div>
`;
};
const makeUiMesh = (label, tiles, onclick) => {
  const geometry = new THREE.PlaneBufferGeometry(uiWorldSize, uiWorldSize)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0));
  const canvas = document.createElement('canvas');
  canvas.width = uiSize;
  canvas.height = uiSize;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(canvas.width, canvas.height);
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
    THREE.LinearEncoding,
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
    const geometry = new THREE.BoxBufferGeometry(1, 1, 0.001);
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
  mesh.add(highlightMesh);
  mesh.highlightMesh = highlightMesh;

  let anchors = [];
  mesh.update = () => {
    const htmlString = _makeHtmlString(label, tiles);
    uiRenderer.render(htmlString, canvas.width, canvas.height)
      .then(result => {
        imageData.data.set(result.data);
        ctx.putImageData(imageData, 0, 0);
        texture.needsUpdate = true;
        mesh.visible = true;

        anchors = result.anchors;
        // console.log(anchors);
      });
  };
  mesh.getAnchors = () => anchors;
  mesh.click = anchor => {
    const match = anchor.id.match(/^tile-([0-9]+)-([0-9]+)$/);
    const i = parseInt(match[1], 10);
    const j = parseInt(match[2], 10);
    onclick(tiles[i][j]);
  };
  mesh.update();

  return mesh;
};
const makeUiFullMesh = scene => {
  const meshSpecs = [
    [
      'inventory',
      [['Rifle', 'Pickaxe', 'Paintbrush'], ['Wood', 'Stone', 'Metal']],
      new THREE.Vector3(0, 0, 0.1),
      new THREE.Quaternion(),
      item => {
        console.log('click item', item);
      },
    ],
    [
      'map',
      [['Location']],
      new THREE.Vector3(-0.1, 0, 0),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2),
      item => {
        console.log('click item', item);
      },
    ],
    [
      'settings',
      [['Avatar']],
      new THREE.Vector3(0, 0, -0.1),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI),
      item => {
        console.log('click item', item);
      },
    ],
    [
      'build',
      [['Wood wall', 'Wood floor', 'Wood ramp'], ['Stone wall', 'Stone floor', 'Stone ramp'], ['Metal wall', 'Metal floor', 'Metal ramp']],
      new THREE.Vector3(0.1, 0, 0),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 3 / 2),
      item => {
        console.log('click item', item);
      },
    ],
  ];
  const object = new THREE.Object3D();
  for (const meshSpec of meshSpecs) {
    const [label, items, position, quaternion, onclick] = meshSpec;
    const mesh = makeUiMesh(label, items, onclick);
    mesh.position.copy(position);
    mesh.quaternion.copy(quaternion);
    object.add(mesh);
  }

  const wrap = new THREE.Object3D();
  wrap.add(object);
  let animation = null;
  let currentDeltaX = 0;
  wrap.rotate = deltaX => {
    currentDeltaX -= deltaX * Math.PI / 2;
    currentDeltaX = mod(currentDeltaX, Math.PI * 2);
    const startQuaternion = object.quaternion.clone();
    const endQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), currentDeltaX);
    const startTime = Date.now();
    const endTime = startTime + 1000;
    animation = {
      update() {
        const now = Date.now();
        const factor = Math.min((now - startTime) / (endTime - startTime), 1);
        if (factor < 1) {
          object.quaternion.copy(startQuaternion).slerp(endQuaternion, cubicBezier(factor));
        } else {
          object.quaternion.copy(endQuaternion);
          animation = null;
        }
      },
    };
  };
  wrap.update = () => {
    animation && animation.update();
  };

  const cubeMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(0.01, 0.01, 0.01), new THREE.MeshBasicMaterial({
    color: 0x0000FF,
  }));
  cubeMesh.visible = false;
  scene.add(cubeMesh);

  let currentMesh = null;
  let currentAnchor = null;
  const intersects = [];
  const localIntersections = [];
  wrap.intersect = raycaster => {
    for (const mesh of object.children) {
      mesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      raycaster.intersectObject(mesh, false, intersects);
      if (intersects.length > 0) {
        const [{distance, point, uv}] = intersects;
        intersects.length = 0;
        if (uv.x >= 1 / 12 && uv.x <= (1 - 1 / 12) && uv.y >= 1 / 12 && uv.y <= (1 - 1 / 12)) {
          localIntersections.push({
            distance,
            point,
            uv,
            mesh,
          });
        }
      }

      mesh.highlightMesh.visible = false;
    }
    currentMesh = null;
    currentAnchor = null;
    if (localIntersections.length > 0) {
      localIntersections.sort((a, b) => a.distance - b.distance);
      const [{point, uv, mesh}] = localIntersections;
      localIntersections.length = 0;
      cubeMesh.position.copy(point);
      cubeMesh.visible = true;

      if (uv) {
        uv.y = 1 - uv.y;
        uv.multiplyScalar(uiSize);

        const anchors = mesh.getAnchors();
        for (let i = 0; i < anchors.length; i++) {
          const anchor = anchors[i];
          const {top, bottom, left, right, width, height} = anchor;
          if (uv.x >= left && uv.x < right && uv.y >= top && uv.y < bottom) {
            currentMesh = mesh;
            currentAnchor = anchor;

            mesh.highlightMesh.position.x = -uiWorldSize / 2 + (left + width / 2) / uiSize * uiWorldSize;
            mesh.highlightMesh.position.y = uiWorldSize - (top + height / 2) / uiSize * uiWorldSize;
            mesh.highlightMesh.scale.x = width / uiSize * uiWorldSize;
            mesh.highlightMesh.scale.y = height / uiSize * uiWorldSize;
            mesh.highlightMesh.visible = true;
            break;
          }
        }
      }
    } else {
      cubeMesh.visible = false;
    }
  };
  wrap.click = () => {
    currentMesh && currentMesh.click(currentAnchor);
  };
  return wrap;
};
const makeToolsMesh = (tools, selectTool) => {
  const geometry = new THREE.PlaneBufferGeometry(1, 0.2)
    // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0));
  const canvas = document.createElement('canvas');
  canvas.width = uiSize;
  canvas.height = uiSize*uiWorldSize;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(canvas.width, canvas.height);
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
    THREE.LinearEncoding,
  );
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.7,
  });
  const mesh = new THREE.Mesh(geometry, material);
  // mesh.visible = false;
  mesh.frustumCulled = false;

  /* const highlightMesh = (() => {
    const geometry = new THREE.BoxBufferGeometry(1, 1, 0.001);
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
  mesh.add(highlightMesh);
  mesh.highlightMesh = highlightMesh; */

  // let anchors = [];
  let selectedWeapon = null;
  let lastSelectedWeapon = null;
  mesh.update = position => {
    if (position) {
      const toolPositions = tools.map((tool, i) =>
        mesh.position.clone()
          .add(new THREE.Vector3(-1/2 + 1/tools.length/2 + i/tools.length, 0, 0).applyQuaternion(mesh.quaternion))
      );
      let closestToolIndex = 0;
      let closestToolDistance = toolPositions[0].distanceTo(position);
      for (let i = 1; i < tools.length; i++) {
        const distance = toolPositions[i].distanceTo(position);
        if (distance < closestToolDistance) {
          closestToolIndex = i;
          closestToolDistance = distance;
        }
      }
      selectedWeapon = tools[closestToolIndex];
    } else {
      selectedWeapon = tools[0];
    }
    if (selectedWeapon !== lastSelectedWeapon) {
      selectTool(selectedWeapon);
      
      const htmlString = _makeToolsString(tools, selectedWeapon);
      uiRenderer.render(htmlString, canvas.width, canvas.height)
        .then(result => {
          imageData.data.set(result.data);
          ctx.putImageData(imageData, 0, 0);
          texture.needsUpdate = true;
          // mesh.visible = true;

          // anchors = result.anchors;
          // console.log(anchors);
        });
    }
    lastSelectedWeapon = selectedWeapon;
  };
  /* mesh.getAnchors = () => anchors;
  mesh.click = anchor => {
    console.log('got anchor', anchor);
  }; */
  mesh.update(null);

  return mesh;
};
const makeDetailsMesh = () => {
  const geometry = new THREE.PlaneBufferGeometry(1, 0.5)
    // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0));
  const canvas = document.createElement('canvas');
  canvas.width = uiSize;
  canvas.height = uiSize*0.5;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(canvas.width, canvas.height);
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
    THREE.LinearEncoding,
  );
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.7,
  });
  const mesh = new THREE.Mesh(geometry, material);
  // mesh.visible = false;
  mesh.frustumCulled = false;

  /* const highlightMesh = (() => {
    const geometry = new THREE.BoxBufferGeometry(1, 1, 0.001);
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
  mesh.add(highlightMesh);
  mesh.highlightMesh = highlightMesh; */

  // let anchors = [];
  mesh.update = () => {
    const htmlString = _makeDetailsString();
    uiRenderer.render(htmlString, canvas.width, canvas.height)
      .then(result => {
        imageData.data.set(result.data);
        ctx.putImageData(imageData, 0, 0);
        texture.needsUpdate = true;
        // mesh.visible = true;

        // anchors = result.anchors;
        // console.log(anchors);
      });
  };
  /* mesh.getAnchors = () => anchors;
  mesh.click = anchor => {
    console.log('got anchor', anchor);
  }; */
  mesh.update();

  return mesh;
};
const makeInventoryMesh = () => {
  const geometry = new THREE.PlaneBufferGeometry(0.2, 0.2/2)
    // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0));
  const canvas = document.createElement('canvas');
  canvas.width = uiSize;
  canvas.height = uiSize/2;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(canvas.width, canvas.height);
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
    THREE.LinearEncoding,
  );
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.7,
  });
  const mesh = new THREE.Mesh(geometry, material);
  // mesh.visible = false;
  mesh.frustumCulled = false;

  /* const highlightMesh = (() => {
    const geometry = new THREE.BoxBufferGeometry(1, 1, 0.001);
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
  mesh.add(highlightMesh);
  mesh.highlightMesh = highlightMesh; */

  // let anchors = [];
  mesh.update = () => {
    const htmlString = _makeInventoryString();
    uiRenderer.render(htmlString, canvas.width, canvas.height)
      .then(result => {
        imageData.data.set(result.data);
        ctx.putImageData(imageData, 0, 0);
        texture.needsUpdate = true;
        // mesh.visible = true;

        // anchors = result.anchors;
        // console.log(anchors);
      });
  };
  /* mesh.getAnchors = () => anchors;
  mesh.click = anchor => {
    console.log('got anchor', anchor);
  }; */
  mesh.update();

  return mesh;
};

export {
  makeUiMesh,
  makeUiFullMesh,
  makeTextMesh,
  makeToolsMesh,
  makeDetailsMesh,
  makeInventoryMesh,
  /* makeWristMenu,
  makeHighlightMesh,
  makeRayMesh, */
};
