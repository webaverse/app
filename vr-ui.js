import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import {scene} from './run.js';
import {TextMesh} from './textmesh-standalone.esm.js';
import {CapsuleGeometry} from './CapsuleGeometry.js';
import easing from './easing.js';
import * as icons from './icons.js';
import {makePromise} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localVector2D = new THREE.Vector2();

const cubicBezier = easing(0, 1, 0, 1);

function mod(a, b) {
  return ((a % b) + b) % b;
}
const _flipUvs = geometry => {
  for (let i = 0; i < geometry.attributes.uv.array.length; i += 2) {
    geometry.attributes.uv.array[i+1] = 1 - geometry.attributes.uv.array[i+1];
  }
  return geometry;
};

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

const makePopoverMesh = (textMesh, {width, height, target} = {}) => {
  const popoverMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), new THREE.MeshBasicMaterial({
    color: 0x000000,
  }));
  popoverMesh.add(textMesh);
  // orthographicScene.add(popoverMesh);
  popoverMesh.position.z = -1; // needed for othro camera
  popoverMesh.visible = false;
  popoverMesh.width = width;
  popoverMesh.height = height;
  popoverMesh.update = () => {
    const n = localVector.set(0, 0, -1)
      .applyQuaternion(camera.quaternion)
      .dot(
        localVector2.copy(target.position)
          .sub(camera.position)
      );
    toScreenPosition(target, camera, localVector);
    const renderer = getRenderer();
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    popoverMesh.position.x = -1 + localVector.x/width*2;
    popoverMesh.position.y = 1 - localVector.y/height*2;
    const distance = target.position.distanceTo(camera.position);
    const maxSoftDistance = 3;
    const maxHardDistance = 8;
    if (n > 0 && distance < maxHardDistance) {
      // const halfWidthFactor = popoverMesh.width/width;
      // const halfHeightFactor = popoverMesh.height/height;
      popoverMesh.scale.set(popoverMesh.width/width, popoverMesh.height/height, 1);
      if (distance > maxSoftDistance) {
        popoverMesh.scale.multiplyScalar(1 / (distance - maxSoftDistance + 1));
      }
      /* if (distance > maxDistance / 2) {
        popoverMesh.position.x = Math.min(Math.max(popoverMesh.position.x, -0.99 + halfWidthFactor), 0.99 - halfWidthFactor);
        popoverMesh.position.y = Math.min(Math.max(popoverMesh.position.y, -0.99 + halfHeightFactor), 0.99 - halfHeightFactor);
      } */
      popoverMesh.visible = true;
    } else {
      popoverMesh.visible = false;
    }
  };
  return popoverMesh;
};

const rayColor = 0x64b5f6;
const makeCubeMesh = () => {
  const geometry = new THREE.CylinderBufferGeometry(0.005, 0.005, 0.001)
    .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1))));
  const cubeMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    color: rayColor,
  }));
  cubeMesh.visible = false;
  return cubeMesh;
};

const makeHighlightMesh = () => {
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
}; */
const makeRayMesh = () => {
  const ray = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(0.002, 0.002, 1, 3, 1)
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 1/2, 0))
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2))),
    new THREE.MeshBasicMaterial({
      color: rayColor,
    })
  );
  ray.frustumCulled = false;
  return ray;
};
const makeRigCapsule = () => {
  const geometry = new CapsuleGeometry()
    .applyMatrix4(new THREE.Matrix4().makeTranslation(0, -0.7, 0));
  const material = new THREE.ShaderMaterial({
    vertexShader: `\
      // uniform float iTime;
      // varying vec2 uvs;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        // uvs = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        vNormal = normal;
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
      }
    `,
    fragmentShader: `\
      #define PI 3.1415926535897932384626433832795

      // uniform float iTime;
      // varying vec2 uvs;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      const vec3 c = vec3(${new THREE.Color(0x1565c0).toArray().join(', ')});

      void main() {
        // vec2 uv = uvs;
        // uv.x *= 1.7320508075688772;
        // uv *= 8.0;

        vec3 direction = vWorldPosition - cameraPosition;
        float d = dot(vNormal, normalize(direction));
        float glow = d < 0.0 ? max(1. + d * 2., 0.1) : 0.;

        float a = glow;
        gl_FragColor = vec4(c, a);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.geometry.computeBoundingBox();
  mesh.frustumCulled = false;
  return mesh;
};

const uiSize = 2048;
const uiWorldSize = 0.4;

/* const uiRenderer = (() => {
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
      const [iframe] = await loadPromise;

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
        bitmap: true,
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
})(); */

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
  const textW = margin*3;

  return `\
<style>
* {
  box-sizing: border-box;
}
/* body {
  width: ${uiSize}px;
  height: ${uiSize}px;
  background-color: red;
} */
.body {
  display: flex;
  font-family: 'Bangers';
  flex-direction: column;
}
.wrap,
.tool {
  height: ${h/2}px;
}
.wrap {
  width: ${uiSize}px;
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
.tool.big {
  width: 100%;
}
.tool .img {
  flex: 1;
  /* width: ${wInner - margin*2}px;
  height: ${h - margin*2 - textW}px; */
  margin: ${margin}px;
  background-color: #FFF;
}
.tool .text {
  display: flex;
  height: ${textW}px;
  padding: 0 ${margin}px;
  align-items: center;
  color: #FFF;
  font-size: ${textW}px;
}
.tools {
  display: flex;
}
</style>
<div class=body>
  <div class=wrap>
    <a class="tool big ${selectedWeapon === 'menu' ? 'selected' : ''}" id=menu>
      <div class=img></div>
      <div class=text>Menu</div>
    </a>
  </div>
  <div class=tools>
    ${tools.map(tool => `\
      <a class="tool ${tool === selectedWeapon ? 'selected' : ''}" id=tool-${tool}>
        <div class=img></div>
        <div class=text>${tool}</div>
      </a>
    `).join('\n')}
  </div>
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
    <a class=button id=run-button>Run</a>
    <a class=button id=bake-button>Bake</a>
    <a class=button id=add-button>Add to inventory</a>
    <a class=button id=remove-button>Remove</a>
  </div>
  <div class=header>
    <a class=close-button id=close-button>X</a>
  </div>
</div>
`;
};
const _makeTradeString = (ftAmount, ftBalance) => {
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
.notches {
  display: flex;
  font-size: 100px;
}
.notches .notch {
  display: flex;
  padding: 30px;
  border: 5px solid #000;
  border-radius: 30px;
  justify-content: center;
  align-items: center;
}
</style>
<div class=body>
  <!-- <div class=wrap>
    <h1>Details</h1>
    <p>Lorem ipsum</p>
  </div> -->
  <div class=wrap>
    <div class=ft>
      <div class=notches>
        <a class=notch id=notch-down>-</a>
        <div>${ftAmount}/${ftBalance}</div>
        <a class=notch id=notch-up>+</a>
      </div>
    </div>
    <div class=nft>
    </div>
  </div>
  <div class=buttons>
    <a class=button id=trade-button>Trade</a>
  </div>
  <div class=header>
    <a class=close-button id=close-button>X</a>
  </div>
</div>
`;
};
const _makePopupString = (text) => {
  const w = uiSize;
  const h = uiSize*0.5;

  return `\
<style>
* {
  box-sizing: border-box;
}
.body {
  width: ${w}px;
  height: ${h}px;
}
.wrap {
  display: inline-block;
  background-color: #111;
  color: #FFF;
  font-family: 'Bangers';
  font-size: ${h/10}px;
  line-height: 1;
  white-space: pre-wrap;
}
</style>
<div class=body>
  <div class=wrap>${escape(text)}</div>
</div>
`;
};
const _makeInventoryString = () => {
  const fullW = uiSize/2;
  const arrowW = fullW/10;
  const wrapInnerW = fullW - arrowW*2;
  const margin = fullW/40;
  const iconW = (wrapInnerW - margin)/3;
  const innerW = iconW - margin;
  const scrollbarW = fullW/40;
  const _makeIcon = i => `\
<a class=icon id="icon-${i}">
  <div class="border top-left"></div>
  <div class="border top-right"></div>
  <div class="border bottom-left"></div>
  <div class="border bottom-right"></div>
</a>
`;
  let iconIndex = 0;
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
.wrap {
  display: flex;
  width: ${wrapInnerW}px;
  flex-direction: column;
  overflow: hidden;
}
.arrow {
  display: flex;
  width: ${wrapInnerW}px;
  height: ${arrowW}px;
  justify-content: center;
  align-items: center;
  background-color: #000;
  color: #FFF;
  font-size: 100px;
}
.arrow .text {
  transform: rotate(90deg);
}
.icons {
  display: flex;
  width: ${wrapInnerW}px;
  height: ${wrapInnerW}px;
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
.icon.selected {
  background-color: #42a5f5;
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
.scrollbar {
  position: relative;
  width: ${scrollbarW}px;
  height: 100%;
  background-color: #EEE;
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
  <div class=wrap>
    <a class=arrow id=arrow-up><div class=text>&lt;</div></a>
    <div class=icons>
      ${_makeIcon(iconIndex++)}
      ${_makeIcon(iconIndex++)}
      ${_makeIcon(iconIndex++)}
      ${_makeIcon(iconIndex++)}
      ${_makeIcon(iconIndex++)}
      ${_makeIcon(iconIndex++)}
      ${_makeIcon(iconIndex++)}
      ${_makeIcon(iconIndex++)}
      ${_makeIcon(iconIndex++)}
    </div>
    <a class=arrow id=arrow-down><div class=text>&gt;</div></a>
  </div>
  <a class=scrollbar id=scrollbar></a>
  <div class=details>
    <h1>Details</h1>
    <p>Lorem ipsum</p>
  </div>
</div>
`;
};
const _makeColorsString = (colors, selectedColors) => {
  const getColorString = (index, colorIndex) => `<a id=color-${index}-${colorIndex} class="color ${selectedColors[index] === colorIndex ? 'selected' : ''}"><div class=inner style="background-color: #${colors[colorIndex]};"></div></a>`;
  const w = uiSize;
  const h = uiSize/2;
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
  font-family: 'Bangers';
}
h1 {
  font-size: 100px;
}
.row {
  display: flex;
}
.colors {
  display: flex;
  margin-right: 5px;
  flex-direction: column;
}
.colors > .row > .color {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  cursor: pointer;
  width: 100px;
  height: 100px;
  position: relative;
}
.colors > .row > .color:hover {
  background-color: #333;
}
.colors > .row > .color:active,
.colors > .row > .color.selected {
  background-color: #000;
}
.colors > .row > .color > .inner {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  right: 3px;
}
</style>
<div class=body>
  <div class=wrap>
    <div class=colors>
      <h1>Color 1</h1>
      <div class=row>
        ${getColorString(0, 0)}
        ${getColorString(0, 1)}
        ${getColorString(0, 2)}
        ${getColorString(0, 3)}
        ${getColorString(0, 4)}
        ${getColorString(0, 5)}
        ${getColorString(0, 6)}
        ${getColorString(0, 7)}
        ${getColorString(0, 8)}
        ${getColorString(0, 9)}
      </div>
      <div class=row>
        ${getColorString(0, 10)}
        ${getColorString(0, 11)}
        ${getColorString(0, 12)}
        ${getColorString(0, 13)}
        ${getColorString(0, 14)}
        ${getColorString(0, 15)}
        ${getColorString(0, 16)}
        ${getColorString(0, 17)}
        ${getColorString(0, 18)}
        ${getColorString(0, 19)}
      </div>
      <h1>Color 2</h1>
      <div class=row>
        ${getColorString(1, 0)}
        ${getColorString(1, 1)}
        ${getColorString(1, 2)}
        ${getColorString(1, 3)}
        ${getColorString(1, 4)}
        ${getColorString(1, 5)}
        ${getColorString(1, 6)}
        ${getColorString(1, 7)}
        ${getColorString(1, 8)}
        ${getColorString(1, 9)}
      </div>
      <div class=row>
        ${getColorString(1, 10)}
        ${getColorString(1, 11)}
        ${getColorString(1, 12)}
        ${getColorString(1, 13)}
        ${getColorString(1, 14)}
        ${getColorString(1, 15)}
        ${getColorString(1, 16)}
        ${getColorString(1, 17)}
        ${getColorString(1, 18)}
        ${getColorString(1, 19)}
      </div>
    </div>
  </div>
</div>
`;
};
const _makeIconString = () => {
  const w = uiSize;
  const h = uiSize/2;
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
  overflow: hidden;
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
</style>
<div class=body>
  <div class=wrap>
    <img src="${icons.code}" height=${h/2}>
  </div>
  <a class=scrollbar id=scrollbar></a>
  <div class=details>
    <h1>Details</h1>
    <p>Lorem ipsum</p>
  </div>
  <div class=buttons>
    <a class=button id=run-button>Run</a>
    <a class=button id=add-button>Add to inventory</a>
  </div>
</div>
`;
};
/* const _makeMenuString = () => {
  const w = uiSize;
  const h = uiSize;
  return `\
<style>
* {
  box-sizing: border-box;
}
.body {
  display: flex;
  width: ${w}px;
  height: ${h}px;
  background-color: #CCC;
  font-family: 'Bangers';
  font-size: 100px;
}
nav {
  display: flex;
  padding: 30px;
  background-color: #333;
  color: #FFF;
  justify-content: center;
  align-items: center;
}
</style>
<div class=body>
  <h1>Menu</h1>
  <nav id=button>Button</nav>
</div>
`;
}; */
/* const makeIconMesh = () => {
  const geometry = _flipUvs(
    new THREE.PlaneBufferGeometry(1, 1/2)
      // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0))
  );
  const texture = new THREE.Texture(
    null,
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
    const htmlString = _makeIconString();
    uiRenderer.render(htmlString, uiSize, uiSize/2)
      .then(result => {
        // imageData.data.set(result.data);
        // ctx.putImageData(imageData, 0, 0);
        // ctx.drawImage(result.data, 0, 0);
        texture.image = result.data;
        texture.needsUpdate = true;
        mesh.visible = true;

        anchors = result.anchors;
        // console.log(anchors);
      });
  };
  mesh.getAnchors = () => anchors;
  mesh.update();

  return mesh;
};
const makeMenuMesh = (cubeMesh, onclickBindings) => {
  const canvasWidth = uiSize;
  const canvasHeight = uiSize;
  const worldWidth = 2;
  const worldHeight = 2;
  
  const geometry = _flipUvs(
    new THREE.PlaneBufferGeometry(worldWidth, worldHeight)
      // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0))
  );
  const texture = new THREE.Texture(
    null,
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
    // const htmlString = _makeMenuString();
    const state = getState();
    // console.log('update state', state);
    const htmlString = Menu({
      activeTab: state.menu.activeTab,
      username: state.menu.username,
      avatarUrl: state.menu.avatarUrl,
      avatarFileName: state.menu.avatarFileName,
      avatarPreview: state.menu.avatarPreview,
      inventoryItems: state.menu.inventory.items,
      balance: state.menu.inventory.balance,
      selectedId: state.menu.inventory.selectedId,
      selectedHash: state.menu.inventory.selectedHash,
      selectedFileName: state.menu.inventory.selectedFileName,
      allItems: state.menu.browse.items,
      peers: state.menu.world.peers,
      selectedPeerId: state.menu.world.selectedPeerId,
      trade: state.menu.trade,
    });
    uiRenderer.render(htmlString, canvasWidth, canvasHeight)
      .then(result => {
        // imageData.data.set(result.data);
        // ctx.putImageData(imageData, 0, 0);
        // ctx.drawImage(result.data, 0, 0);
        texture.image = result.data;
        texture.needsUpdate = true;

        anchors = result.anchors;
        // console.log(anchors);
      });
  };
  mesh.getAnchors = () => anchors;
  mesh.click = anchorSpec => {
    const {anchor} = anchorSpec;
    const onclick = anchor ? onclickBindings[anchor.id] : null;
    if (onclick) {
      onclick(anchor);
    }
  };
  mesh.intersect = localIntersections => {
    highlightMesh.visible = false;

    let currentAnchor = null;
    const [{point, face, uv, object}] = localIntersections;
    cubeMesh.position.copy(point);
    cubeMesh.quaternion.setFromUnitVectors(localVector.set(0, 0, 1), localVector2.copy(face.normal).applyQuaternion(object.quaternion));
    cubeMesh.visible = true;

    localVector2D.copy(uv);
    // localVector2D.y = 1 - localVector2D.y;
    localVector2D.x *= canvasWidth;
    localVector2D.y *= canvasHeight;

    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const {top, bottom, left, right, width, height} = anchor;
      if (localVector2D.x >= left && localVector2D.x < right && localVector2D.y >= top && localVector2D.y < bottom) {
        currentAnchor = anchor;

        highlightMesh.position.x = -worldWidth/2 + (left + width/2) / canvasWidth * worldWidth;
        highlightMesh.position.y = worldHeight/2 - (top + height/2) / canvasHeight * worldHeight;
        highlightMesh.scale.x = width / canvasWidth * worldWidth;
        highlightMesh.scale.y = height / canvasHeight * worldHeight;
        highlightMesh.visible = true;
        break;
      }
    }
    return currentAnchor;
  };
  mesh.update();

  return mesh;
}; */
/* const makeUiMesh = (label, tiles, onclick) => {
  const geometry = _flipUvs(
    new THREE.PlaneBufferGeometry(uiWorldSize, uiWorldSize)
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0))
  );
  const texture = new THREE.Texture(
    null,
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
    uiRenderer.render(htmlString, uiSize, uiSize)
      .then(result => {
        // imageData.data.set(result.data);
        // ctx.putImageData(imageData, 0, 0);
        // ctx.drawImage(result.data, 0, 0);
        texture.image = result.data;
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
const makeUiFullMesh = cubeMesh => {
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
const makeToolsMesh = (tools, selectTool, selectMenu) => {
  const canvasWidth = uiSize;
  const canvasHeight = uiSize*uiWorldSize;
  const geometry = _flipUvs(new THREE.PlaneBufferGeometry(1, uiWorldSize));
    // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0));
  const texture = new THREE.Texture(
    null,
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

  // let anchors = [];
  let selectedWeapon = null;
  let lastSelectedWeapon = null;
  let lastDown = false;
  mesh.update = position => {
    if (position) {
      const menuToolPosition = mesh.position.clone()
        .add(new THREE.Vector3(0, 0.5, 0).applyQuaternion(mesh.quaternion))
      const toolPositions = tools.map((tool, i) =>
        mesh.position.clone()
          .add(new THREE.Vector3(-1/2 + 1/tools.length/2 + i/tools.length, -0.5, 0).applyQuaternion(mesh.quaternion))
      );
      let closestToolIndex = -1;
      let closestToolDistance = menuToolPosition.distanceTo(position);
      for (let i = 0; i < tools.length; i++) {
        const distance = toolPositions[i].distanceTo(position);
        if (distance < closestToolDistance) {
          closestToolIndex = i;
          closestToolDistance = distance;
        }
      }
      if (closestToolIndex === -1) {
        selectedWeapon = 'menu';
      } else {
        selectedWeapon = tools[closestToolIndex];
      }
      lastDown = true;
    } else {
      if (lastDown) {
        if (selectedWeapon === 'menu') {
          selectMenu();
        } else {
          selectTool(selectedWeapon);
        }
      }
      lastDown = false;
    }
    if (selectedWeapon !== lastSelectedWeapon) {
      const htmlString = _makeToolsString(tools, selectedWeapon);
      uiRenderer.render(htmlString, canvasWidth, canvasHeight)
        .then(result => {
          // ctx.drawImage(result.data, 0, 0);
          texture.image = result.data;
          texture.needsUpdate = true;
          // mesh.visible = true;

          // anchors = result.anchors;
          // console.log(anchors);
        });
    }
    lastSelectedWeapon = selectedWeapon;
  };
  mesh.update(null);

  return mesh;
};
const makeDetailsMesh = (cubeMesh, onrun, onbake, onadd, onremove, onclose) => {
  const worldWidth = 1;
  const worldHeight = 0.5;
  const canvasWidth = uiSize;
  const canvasHeight = uiSize*0.5;
  const geometry = _flipUvs(new THREE.PlaneBufferGeometry(worldWidth, worldHeight))
    // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0));
  const texture = new THREE.Texture(
    null,
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
    // transparent: true,
    // alphaTest: 0.7,
  });
  const mesh = new THREE.Mesh(geometry, material);
  // mesh.visible = false;
  mesh.frustumCulled = false;

  const highlightMesh = makeHighlightMesh();
  mesh.add(highlightMesh);
  // mesh.highlightMesh = highlightMesh;

  let anchors = [];
  mesh.update = () => {
    const htmlString = _makeDetailsString();
    uiRenderer.render(htmlString, canvasWidth, canvasHeight)
      .then(result => {
        // ctx.drawImage(result.data, 0, 0);
        texture.image = result.data;
        texture.needsUpdate = true;
        // mesh.visible = true;

        anchors = result.anchors;
        // console.log(anchors);
      });
  };
  // let currentMesh = null;
  // let currentAnchor = null;
  // const intersects = [];
  // const localIntersections = [];
  mesh.intersect = localIntersections => {
    highlightMesh.visible = false;

    let currentAnchor = null;
    const [{point, face, uv, object}] = localIntersections;
    cubeMesh.position.copy(point);
    cubeMesh.quaternion.setFromUnitVectors(localVector.set(0, 0, 1), localVector2.copy(face.normal).applyQuaternion(object.quaternion));
    cubeMesh.visible = true;

    localVector2D.copy(uv);
    // localVector2D.y = 1 - localVector2D.y;
    localVector2D.x *= canvasWidth;
    localVector2D.y *= canvasHeight;

    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const {top, bottom, left, right, width, height} = anchor;
      if (localVector2D.x >= left && localVector2D.x < right && localVector2D.y >= top && localVector2D.y < bottom) {
        currentAnchor = anchor;

        highlightMesh.position.x = -worldWidth/2 + (left + width/2) / canvasWidth * worldWidth;
        highlightMesh.position.y = worldHeight/2 - (top + height/2) / canvasHeight * worldHeight;
        highlightMesh.scale.x = width / canvasWidth * worldWidth;
        highlightMesh.scale.y = height / canvasHeight * worldHeight;
        highlightMesh.visible = true;
        break;
      }
    }
    return currentAnchor;
  };
  mesh.click = anchorSpec => {
    const {anchor} = anchorSpec;
    if (anchor) {
      switch (anchor.id) {
        case 'run-button': {
          onrun(anchorSpec);
          break;
        }
        case 'bake-button': {
          onbake(anchorSpec);
          break;
        }
        case 'add-button': {
          onadd(anchorSpec);
          break;
        }
        case 'remove-button': {
          onremove(anchorSpec);
          break;
        }
        case 'close-button': {
          onclose();
          break;
        }
      }
    }
  };
  mesh.update();

  return mesh;
};
const makeTradeMesh = (cubeMesh, ontrade, onclose) => {
  const worldWidth = 1;
  const worldHeight = 0.5;
  const canvasWidth = uiSize;
  const canvasHeight = uiSize*0.5;
  const geometry = _flipUvs(new THREE.PlaneBufferGeometry(worldWidth, worldHeight))
    // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0));
  const texture = new THREE.Texture(
    null,
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
    // transparent: true,
    // alphaTest: 0.7,
  });
  const mesh = new THREE.Mesh(geometry, material);
  // mesh.visible = false;
  mesh.frustumCulled = false;

  const highlightMesh = makeHighlightMesh();
  mesh.add(highlightMesh);
  // mesh.highlightMesh = highlightMesh;

  let ftAmount = 0;
  let ftBalance = 0;

  let anchors = [];
  mesh.update = () => {
    const htmlString = _makeTradeString(ftAmount, ftBalance);
    uiRenderer.render(htmlString, canvasWidth, canvasHeight)
      .then(result => {
        // ctx.drawImage(result.data, 0, 0);
        texture.image = result.data;
        texture.needsUpdate = true;
        // mesh.visible = true;

        anchors = result.anchors;
        // console.log(anchors);
      });
  };
  // let currentMesh = null;
  // let currentAnchor = null;
  // const intersects = [];
  // const localIntersections = [];
  mesh.intersect = localIntersections => {
    highlightMesh.visible = false;

    let currentAnchor = null;
    const [{point, face, uv, object}] = localIntersections;
    cubeMesh.position.copy(point);
    cubeMesh.quaternion.setFromUnitVectors(localVector.set(0, 0, 1), localVector2.copy(face.normal).applyQuaternion(object.quaternion));
    cubeMesh.visible = true;

    localVector2D.copy(uv);
    // localVector2D.y = 1 - localVector2D.y;
    localVector2D.x *= canvasWidth;
    localVector2D.y *= canvasHeight;

    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const {top, bottom, left, right, width, height} = anchor;
      if (localVector2D.x >= left && localVector2D.x < right && localVector2D.y >= top && localVector2D.y < bottom) {
        currentAnchor = anchor;

        highlightMesh.position.x = -worldWidth/2 + (left + width/2) / canvasWidth * worldWidth;
        highlightMesh.position.y = worldHeight/2 - (top + height/2) / canvasHeight * worldHeight;
        highlightMesh.scale.x = width / canvasWidth * worldWidth;
        highlightMesh.scale.y = height / canvasHeight * worldHeight;
        highlightMesh.visible = true;
        break;
      }
    }
    return currentAnchor;
  };
  mesh.click = anchorSpec => {
    const {anchor} = anchorSpec;
    if (anchor) {
      switch (anchor.id) {
        case 'notch-down': {
          ftAmount--;
          ftAmount = Math.max(ftAmount, 0);
          mesh.update();
          break;
        }
        case 'notch-up': {
          ftAmount++;
          ftAmount = Math.min(ftAmount, ftBalance);
          mesh.update();
          break;
        }
        case 'trade-button': {
          ontrade(ftAmount);
          break;
        }
        case 'close-button': {
          onclose();
          break;
        }
      }
    }
  };
  mesh.getBalance = () => ftBalance;
  mesh.setBalance = newBalance => {
    if (newBalance !== ftBalance) {
      ftBalance = newBalance;
      ftAmount = Math.min(ftBalance, ftAmount);
      mesh.update();
    }
  };
  mesh.update();

  return mesh;
}; */
const makePopupMesh = () => {
  const worldWidth = 1;
  const worldHeight = 0.5;
  const canvasWidth = uiSize;
  const canvasHeight = uiSize*0.5;
  const geometry = _flipUvs(new THREE.PlaneBufferGeometry(worldWidth, worldHeight))
    // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0));
  const texture = new THREE.Texture(
    null,
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

  class PopupMessage {
    constructor(text, endTime) {
      this.text = text;
      this.endTime = endTime;
    }
  }

  const messages = [];
  let needsUpdate = false;
  // let anchors = [];
  mesh.update = () => {
    // const now = Date.now();
    // messages = messages.filter(message => message.endTime > now);
    if (needsUpdate) {
      if (messages.length > 0) {
        const text = messages.map(message => message.text).join('\n');
        const htmlString = _makePopupString(text);
        uiRenderer.render(htmlString, canvasWidth, canvasHeight)
          .then(result => {
            // ctx.drawImage(result.data, 0, 0);
            texture.image = result.data;
            texture.needsUpdate = true;
            // mesh.visible = true;

            // anchors = result.anchors;
            // console.log(anchors);
          });
        console.log('visible');
        mesh.visible = true;
      } else {
        mesh.visible = false;
      }
      needsUpdate = false;
    }
  };
  // let currentMesh = null;
  // let currentAnchor = null;
  // const intersects = [];
  // const localIntersections = [];
  mesh.intersect = localIntersections => {
    highlightMesh.visible = false;

    let currentAnchor = null;
    const [{point, face, uv, object}] = localIntersections;
    cubeMesh.position.copy(point);
    cubeMesh.quaternion.setFromUnitVectors(localVector.set(0, 0, 1), localVector2.copy(face.normal).applyQuaternion(object.quaternion));
    cubeMesh.visible = true;

    localVector2D.copy(uv);
    // localVector2D.y = 1 - localVector2D.y;
    localVector2D.x *= canvasWidth;
    localVector2D.y *= canvasHeight;

    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const {top, bottom, left, right, width, height} = anchor;
      if (localVector2D.x >= left && localVector2D.x < right && localVector2D.y >= top && localVector2D.y < bottom) {
        currentAnchor = anchor;

        highlightMesh.position.x = -worldWidth/2 + (left + width/2) / canvasWidth * worldWidth;
        highlightMesh.position.y = worldHeight/2 - (top + height/2) / canvasHeight * worldHeight;
        highlightMesh.scale.x = width / canvasWidth * worldWidth;
        highlightMesh.scale.y = height / canvasHeight * worldHeight;
        highlightMesh.visible = true;
        break;
      }
    }
    return currentAnchor;
  };
  mesh.addMessage = text => {
    const message = new PopupMessage(text);
    messages.push(message);
    needsUpdate = true;
    return message;
  };
  mesh.removeMessage = message => {
    messages.splice(messages.indexOf(message), 1);
    needsUpdate = true;
    return message;
  };
  // mesh.update();

  return mesh;
};
const makeColorsMesh = (cubeMesh, colors, oncolorchange) => {
  const worldWidth = 0.2;
  const worldHeight = 0.2/2;
  const canvasWidth = uiSize;
  const canvasHeight = uiSize/2;
  const geometry = _flipUvs(
    new THREE.PlaneBufferGeometry(worldWidth, worldHeight)
     // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0))
  );
  const texture = new THREE.Texture(
    null,
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
    // transparent: true,
    // alphaTest: 0.7,
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
  const selectedColors = [0, 1];
  mesh.update = () => {
    const htmlString = _makeColorsString(colors, selectedColors);
    uiRenderer.render(htmlString, canvasWidth, canvasHeight)
      .then(result => {
        // imageData.data.set(result.data);
        // ctx.putImageData(imageData, 0, 0);
        // ctx.drawImage(result.data, 0, 0);
        texture.image = result.data;
        texture.needsUpdate = true;
        mesh.visible = true;

        anchors = result.anchors;
        // console.log(anchors);
      });
  };
  mesh.intersect = localIntersections => {
    highlightMesh.visible = false;

    let currentAnchor = null;
    const [{point, face, uv, object}] = localIntersections;
    cubeMesh.position.copy(point);
    cubeMesh.quaternion.setFromUnitVectors(localVector.set(0, 0, 1), localVector2.copy(face.normal).applyQuaternion(object.quaternion));
    cubeMesh.visible = true;

    localVector2D.copy(uv);
    // localVector2D.y = 1 - localVector2D.y;
    localVector2D.x *= canvasWidth;
    localVector2D.y *= canvasHeight;

    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const {top, bottom, left, right, width, height} = anchor;
      if (localVector2D.x >= left && localVector2D.x < right && localVector2D.y >= top && localVector2D.y < bottom) {
        currentAnchor = anchor;

        highlightMesh.position.x = -worldWidth/2 + (left + width/2) / canvasWidth * worldWidth;
        highlightMesh.position.y = worldHeight/2 - (top + height/2) / canvasHeight * worldHeight;
        highlightMesh.scale.x = width / canvasWidth * worldWidth;
        highlightMesh.scale.y = height / canvasHeight * worldHeight;
        highlightMesh.visible = true;
        break;
      }
    }
    return currentAnchor;
  };
  mesh.click = anchorSpec => {
    const {anchor} = anchorSpec;
    // console.log('click', anchor);
    const match = anchor && anchor.id.match(/^color-([0-9]+)-([0-9]+)$/);
    if (match) {
      const index = parseInt(match[1], 10);
      const color = parseInt(match[2], 10);
      selectedColors[index] = color;
      mesh.update();
      oncolorchange(selectedColors);
    }
    // currentMesh && currentMesh.click(currentAnchor);
  };
  mesh.update();

  return mesh;
};
/* const makeInventoryMesh = (cubeMesh, onscroll) => {
  const worldWidth = 0.2;
  const worldHeight = 0.2/2;
  const canvasWidth = uiSize;
  const canvasHeight = uiSize/2;
  const geometry = _flipUvs(new THREE.PlaneBufferGeometry(worldWidth, worldHeight));
    // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, uiWorldSize / 2, 0));
  const texture = new THREE.Texture(
    null,
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

  const highlightMesh = makeHighlightMesh();
  mesh.add(highlightMesh);
  // mesh.highlightMesh = highlightMesh;

  const scrollbarMesh = (() => {
    const fullW = worldWidth/2;
    const arrowW = fullW/10;
    const wrapInnerW = fullW - arrowW*2;
    const scrollbarW = fullW/40;
    const geometry = new THREE.PlaneBufferGeometry(scrollbarW, 1)
      .applyMatrix4(new THREE.Matrix4().makeTranslation(-fullW + scrollbarW/2 + wrapInnerW, -1/2, 0.001));
    const material = new THREE.MeshBasicMaterial({
      color: 0xffa726,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  })();
  mesh.add(scrollbarMesh)

  let anchors = [];
  let scrollFactor = 0.2;
  let scrollbarHeight = 0.15;
  mesh.scrollY = deltaY => {
    scrollFactor += deltaY/10000;
    scrollFactor = Math.min(Math.max(scrollFactor, 0), 1);
    mesh.updateScroll();
  };
  mesh.scrollUp = () => {
    scrollFactor -= scrollbarHeight/(1 - scrollbarHeight);
    scrollFactor = Math.min(Math.max(scrollFactor, 0), 1);
    mesh.updateScroll();
  };
  mesh.scrollDown = () => {
    scrollFactor += scrollbarHeight/(1 - scrollbarHeight);
    scrollFactor = Math.min(Math.max(scrollFactor, 0), 1);
    mesh.updateScroll();
  };
  mesh.update = () => {
    // console.log('update', scrollFactor, scrollbarHeight);
    const htmlString = _makeInventoryString();
    uiRenderer.render(htmlString, canvasWidth, canvasHeight)
      .then(result => {
        // ctx.drawImage(result.data, 0, 0);
        texture.image = result.data;
        texture.needsUpdate = true;
        // mesh.visible = true;

        anchors = result.anchors;
        // console.log(anchors);
      });
  };
  mesh.updateScroll = () => {
    scrollbarMesh.position.y = worldHeight/2 - scrollFactor*(1-scrollbarHeight)*worldHeight;
    scrollbarMesh.scale.y = scrollbarHeight*worldHeight;
    onscroll(scrollFactor);
  };

  // let currentMesh = null;
  // let currentAnchor = null;
  mesh.intersect = localIntersections => {
    highlightMesh.visible = false;

    let currentAnchor = null;
    let [{point, face, uv, object}] = localIntersections;
    cubeMesh.position.copy(point);
    cubeMesh.quaternion.setFromUnitVectors(localVector.set(0, 0, 1), localVector2.copy(face.normal).applyQuaternion(object.quaternion));
    cubeMesh.visible = true;

    localVector2D.copy(uv);
    // localVector2D.y = 1 - localVector2D.y;
    localVector2D.x *= canvasWidth;
    localVector2D.y *= canvasHeight;

    // const anchors = mesh.getAnchors();
    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const {top, bottom, left, right, width, height} = anchor;
      if (localVector2D.x >= left && localVector2D.x < right && localVector2D.y >= top && localVector2D.y < bottom) {
        // currentMesh = mesh;
        currentAnchor = anchor;

        highlightMesh.position.x = -worldWidth/2 + (left + width/2) / canvasWidth * worldWidth;
        highlightMesh.position.y = worldHeight/2 - (top + height/2) / canvasHeight * worldHeight;
        highlightMesh.scale.x = width / canvasWidth * worldWidth;
        highlightMesh.scale.y = height / canvasHeight * worldHeight;
        highlightMesh.visible = true;
        break;
      }
    }
    return currentAnchor;
  };
  mesh.click = anchorSpec => {
    // console.log('click', anchor);
    const {anchor, uv} = anchorSpec;
    if (anchor) {
      if (anchor.id === 'scrollbar') {
        // console.log('got uv', uv.y);
        scrollFactor = uv.y;
        mesh.updateScroll();
      } else if (anchor.id === 'arrow-up') {
        mesh.scrollUp();
      } else if (anchor.id === 'arrow-down') {
        mesh.scrollDown();
      }
    }
    // currentMesh && currentMesh.click(currentAnchor);
  };
  // Promise.resolve()
    // .then(() => {
      mesh.update();
      mesh.updateScroll();
    // });

  return mesh;
};

const intersects = [];
const intersectUi = (raycaster, meshes) => {
  meshes = meshes.filter(mesh => mesh.visible);
  // mesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
  raycaster.intersectObjects(meshes, false, intersects);
  if (intersects.length > 0) {
    const [{object, point, uv}] = intersects;
    const anchor = object.intersect(intersects);
    intersects.length = 0;
    return {
      object,
      point,
      anchor,
      uv,
    };
  } else {
    return null;
  }
}; */

const blackMaterial = new THREE.MeshBasicMaterial({color: 0x333333});
const blueMaterial = new THREE.MeshBasicMaterial({color: 0x42a5f5});
const makeButtonMesh = (text, font = './GeosansLight.ttf', size = 0.1) => {  
  const textMesh = makeTextMesh(text, font, size);
  textMesh._needsSync = true;
  textMesh.sync(() => {
    const renderInfo = textMesh.textRenderInfo;
    const [x1, y1, x2, y2] = renderInfo.totalBounds;
    const w = x2 - x1;
    const h = y2 - y1;
    
    const outlineGeometry = BufferGeometryUtils.mergeBufferGeometries([
      new THREE.RingBufferGeometry(size*0.6, size*0.6 * 1.1, 8, 8, Math.PI/2, Math.PI),
      new THREE.RingBufferGeometry(size*0.6, size*0.6 * 1.1, 8, 8, -Math.PI/2, Math.PI)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(w, 0, 0)),
      new THREE.PlaneBufferGeometry(1, 1)
        .applyMatrix4(new THREE.Matrix4().makeScale(w, size*0.6 * 0.1, 1))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(w/2, size*0.6 + size*0.6*0.1/2, 0)),
      new THREE.PlaneBufferGeometry(1, 1)
        .applyMatrix4(new THREE.Matrix4().makeScale(w, size*0.6 * 0.1, 1))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(w/2, -size*0.6 - size*0.6*0.1/2, 0))
    ]);
    outlineGeometry.computeBoundingBox();

    textMesh.geometry.boundingBox = outlineGeometry.boundingBox.clone();
    textMesh.geometry.boundingBox.min.z = -0.01;
    textMesh.geometry.boundingBox.max.z = 0.01;
    
    const outlineMesh = new THREE.Mesh(outlineGeometry, blackMaterial);
    textMesh.add(outlineMesh);
  });

  textMesh.geometry.boundingBox = new THREE.Box3();
  
  return textMesh;
};
const makeArrowMesh = () => {
  const rightArrowShape = new THREE.Shape();
  (function rightArrow(ctx) {
    const size = 0.05;
    const thickness = 0.02;
    ctx.moveTo(-size, size);
    ctx.lineTo(-size + thickness, size);
    ctx.lineTo(thickness, 0);
    ctx.lineTo(-size + thickness, -size);
    ctx.lineTo(-size, -size);
    ctx.lineTo(0, 0);
  })(rightArrowShape);
  const rightArrowGeometry = new THREE.ShapeBufferGeometry(rightArrowShape);
  rightArrowGeometry.computeBoundingBox();
  rightArrowGeometry.boundingBox.min.z = -0.01;
  rightArrowGeometry.boundingBox.max.z = 0.01;
  const mesh = new THREE.Mesh(rightArrowGeometry, blackMaterial);
  return mesh;
};
const makeCornersMesh = () => {
  const cornersShape = new THREE.Shape();
  (function corners(ctx) {
    const size = 0.03;
    ctx.moveTo(-size, size);
    ctx.lineTo(size*2, size);
    ctx.lineTo(size*2, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, -size*2);
    ctx.lineTo(-size, -size*2);
  })(cornersShape);
  const cornerGeometry = new THREE.ShapeBufferGeometry(cornersShape);
  const cornersGeometry = BufferGeometryUtils.mergeBufferGeometries([
    cornerGeometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(-0.5, 0.5, 0)),
    cornerGeometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI/2)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, 0.5, 0)),
    cornerGeometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI/2*2)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, -0.5, 0)),
    cornerGeometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI/2*3)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(-0.5, -0.5, 0))
  ]);
  cornersGeometry.computeBoundingBox();
  cornersGeometry.boundingBox.min.z = -0.01;
  cornersGeometry.boundingBox.max.z = 0.01;
  const cornerMesh = new THREE.Mesh(cornersGeometry, blackMaterial);
  return cornerMesh;
};
const makeTextInput = (text, placeholder = '', font = './GeosansLight.ttf', size = 0.1, width = 1) => {
  const textInput = new THREE.Object3D();

  let textMesh = makeTextMesh(text, font, size);
  textMesh.position.x = -width/2;
  
  const underlineGeometry = new THREE.PlaneBufferGeometry(1, 0.01)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(0, -size/2, 0));
  const underlineMesh = new THREE.Mesh(underlineGeometry, blackMaterial);
  textInput.add(underlineMesh);
  
  const caretGeometry = new THREE.PlaneBufferGeometry(0.01, 0.08)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(-width/2 + 0.01/2, 0, 0));
  const caretMesh = new THREE.Mesh(caretGeometry, blackMaterial);
  textInput.add(caretMesh);

  const backgroundGeometry = new THREE.PlaneBufferGeometry(1, 1)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(width/2, 0, -0.01));
  const backgroundMesh = new THREE.Mesh(backgroundGeometry, blueMaterial);
  backgroundMesh.visible = false;
  textInput.add(backgroundMesh);

  textInput.geometry = {
    boundingBox: new THREE.Box3(
      new THREE.Vector3(0, -size/2, 0.01),
      new THREE.Vector3(width, size/2, 0.01)
    ),
  };

  textInput.add(textMesh);

  textInput.caretIndex = text.length;
  textInput.selectRange = [0, 0];
  textInput.getText = () => textMesh.text;
  textInput.setText = async (s, caretIndex, shift) => {
    textInput.remove(textMesh);
    textMesh = makeTextMesh(s, font, size);
    textMesh.position.x = -width/2;
    textInput.add(textMesh);

    const oldCaretIndex = textInput.caretIndex;
    textInput.caretIndex = caretIndex;

    if (shift) {
      if (caretIndex < oldCaretIndex) {
        if (textInput.selectRange[0] === oldCaretIndex) {
          textInput.selectRange[0] = caretIndex;
        } else if (textInput.selectRange[1] === oldCaretIndex) {
          textInput.selectRange[1] = caretIndex;
        }
      } else if (caretIndex > oldCaretIndex) {
        if (textInput.selectRange[1] === oldCaretIndex) {
          textInput.selectRange[1] = caretIndex;
        } else if (textInput.selectRange[0] === oldCaretIndex) {
          textInput.selectRange[0] = caretIndex;
        }
      }
    } else {
      textInput.selectRange[0] = caretIndex;
      textInput.selectRange[1] = caretIndex;
    }
    
    await new Promise((accept, reject) => {
      textMesh._needsSync = true;
      textMesh.sync(accept);
    });

    const renderInfo = textMesh.textRenderInfo;
    const {caretPositions, totalBounds} = renderInfo;
    caretMesh.position.x = s.length > 0 ? (caretIndex*3 < caretPositions.length ? caretPositions[caretIndex*3] : totalBounds[totalBounds.length - 2]) : 0;

    const selectWidth = textInput.selectRange[1] - textInput.selectRange[0];
    if (selectWidth > 0) {
      const {glyphBounds} = renderInfo;
      const x1 = textInput.selectRange[0] !== 0 ? glyphBounds[(textInput.selectRange[0] - 1)*4 + 2] : 0;
      const x2 = textInput.selectRange[1] !== 0 ? glyphBounds[(textInput.selectRange[1] - 1)*4 + 2] : 0;
      const w = x2 - x1;
      backgroundMesh.position.x = -width/2 + x1;
      backgroundMesh.scale.x = w;
      backgroundMesh.scale.y = size;
      backgroundMesh.visible = true;
    } else {
      backgroundMesh.visible = false;
    }
  };

  return textInput;
};
const makeTabs = (tabs, size = 0.08, width = 1) => {
  const object = new THREE.Object3D();

  const loadPromise = makePromise();

  const widths = [];
  (async () => {
    let offset = 0;
    for (const tab of tabs) {
      const textMesh = makeTextMesh(tab, undefined, size);
      await new Promise((accept, reject) => {
        textMesh._needsSync = true;
        textMesh.sync(accept);
      });
      {
        const renderInfo = textMesh.textRenderInfo;
        const [x1, y1, x2, y2] = renderInfo.totalBounds;
        const w = x2 - x1;
        const h = y2 - y1;
        
        textMesh.position.x = -width/2 + offset;

        offset += w;
        
        widths.push(offset);
      }
      object.add(textMesh);
    }
    
    backgroundMesh.visible = true;

    loadPromise.accept();
  })();

  const backgroundGeometry = new THREE.PlaneBufferGeometry(1, 1)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(1/2, 0, -0.01));
  const backgroundMesh = new THREE.Mesh(backgroundGeometry, blueMaterial);
  backgroundMesh.visible = false;
  object.add(backgroundMesh);

  let selectedTabIndex = 0;
  let enabled = false;
  object.select = index => {
    selectedTabIndex = index;

    _updateBackgroundMesh();
    
    object.ontabchange && object.ontabchange(selectedTabIndex);
  };
  object.selectOffset = offset => {
    let index = selectedTabIndex + offset;
    if (index < 0) {
      index += tabs.length;
    }
    if (index >= tabs.length) {
      index -= tabs.length;
    }
    object.select(index);
  };
  object.getEnabled = () => enabled;
  object.setEnabled = newEnabled => {
    enabled = newEnabled;
    _updateBackgroundMesh();
  };
  const _updateBackgroundMesh = async () => {
    await loadPromise;

    if (enabled) {
      const selectedTabOffset = selectedTabIndex === 0 ? 0 : widths[selectedTabIndex - 1];
      const selectedTabWidth = selectedTabIndex === 0 ? widths[0] : (widths[selectedTabIndex] - widths[selectedTabIndex - 1]);
      backgroundMesh.position.x = -width/2 + selectedTabOffset;
      backgroundMesh.scale.set(selectedTabWidth, size, 1);
      backgroundMesh.visible = true;
    } else {
      backgroundMesh.visible = false;
    }
  };
  _updateBackgroundMesh();

  return object;
};
const makeItem = (previewUrl, text, size = 0.1, width = 1, buttons = []) => {
  const object = new THREE.Object3D();

  const cornersMesh = makeCornersMesh();
  cornersMesh.position.x = -width/2 + size/2;
  cornersMesh.scale.setScalar(size);
  object.add(cornersMesh);
  
  const textMesh = makeTextMesh(text, undefined, size/2);
  textMesh.position.x = -width/2 + size + size/4;
  textMesh.position.y = size/4;
  object.add(textMesh);

  const loadPromise = makePromise();

  const widths = [];
  const buttonsOffset = buttons.length * width/2*0.3;
  (async () => {
    let offset = 0;

    for (const button of buttons) {
      const buttonMesh = makeButtonMesh(button, undefined, size/2);
      buttonMesh.position.x = buttonsOffset + offset;
      object.add(buttonMesh);
      
      await new Promise((accept, reject) => {
        buttonMesh._needsSync = true;
        buttonMesh.sync(accept);
      });
      {
        const renderInfo = textMesh.textRenderInfo;
        const [x1, y1, x2, y2] = renderInfo.totalBounds;
        const w = x2 - x1;
        const h = y2 - y1;

        offset += w;
          
        widths.push(offset);
      }
    }
    loadPromise.accept();
  })();

  const backgroundGeometry = new THREE.PlaneBufferGeometry(1, 1)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(1/2, 0, -0.01));
  const backgroundMesh = new THREE.Mesh(backgroundGeometry, blueMaterial);
  backgroundMesh.scale.y = size/2;
  backgroundMesh.visible = false;
  object.add(backgroundMesh);

  let horizontalIndex = -1;
  const _updateBackgroundMesh = async () => {
    await loadPromise;

    if (horizontalIndex !== -1) {
      const selectedButtonOffset = horizontalIndex === 0 ? 0 : widths[horizontalIndex - 1];
      const selectedButtonWidth = horizontalIndex === 0 ? widths[0] : (widths[horizontalIndex] - widths[horizontalIndex - 1]);
      backgroundMesh.position.x = buttonsOffset + selectedButtonOffset;
      backgroundMesh.scale.set(selectedButtonWidth, size, 1);
      backgroundMesh.visible = true;
    } else {
      backgroundMesh.visible = false;
    }
  };
  _updateBackgroundMesh();

  object.select = index => {
    horizontalIndex = index;
    _updateBackgroundMesh();
  };
  object.selectOffset = offset => {
    object.select(Math.min(Math.max(horizontalIndex + offset, 0), buttons.length - 1));
  };
  object.enter = () => {
    object.onenter && object.onenter(horizontalIndex);
  };
  object.onenter = null;

  return object;
};
const makeScrollbar = (slots = 4, totalSlots = 20, size = 0.1, width = 1) => {
  const barWidth = 0.01;
  const barHeight = slots * size;
  const scrollbarGeometry = new THREE.PlaneBufferGeometry(barWidth, barHeight)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(width/2 - barWidth/2, -barHeight/2 + size/2, 0));
  const scrollbarMesh = new THREE.Mesh(scrollbarGeometry, blackMaterial);
  return scrollbarMesh;
};

export {
  makeCubeMesh,
  /* makeUiMesh,
  makeUiFullMesh, */
  makeTextMesh,
  makePopoverMesh,
  // makeToolsMesh,
  // makeDetailsMesh,
  // makeTradeMesh,
  makePopupMesh,
  // makeInventoryMesh,
  makeColorsMesh,
  // makeIconMesh,
  // makeMenuMesh,
  // intersectUi,
  // makeWristMenu,
  makeHighlightMesh,
  makeRayMesh,
  makeRigCapsule,
  makeButtonMesh,
  makeArrowMesh,
  makeCornersMesh,
  makeTextInput,
  makeTabs,
  makeItem,
  makeScrollbar,
};
