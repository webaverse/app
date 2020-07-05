import * as THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import {XRPackage} from './run.js';
import {TextMesh} from './textmesh-standalone.esm.js'

const apiHost = 'https://ipfs.exokit.org/ipfs';

let dragMesh = null;

const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localRaycater = new THREE.Raycaster();

const makeTextMesh = (text = '', fontSize = 1, anchorX = 'left', anchorY = 'middle') => {
  const textMesh = new TextMesh();
  textMesh.text = text;
  textMesh.font = './GeosansLight.ttf';
  textMesh.fontSize = fontSize;
  textMesh.color = 0x000000;
  textMesh.anchorX = anchorX;
  textMesh.anchorY = anchorY;
  textMesh.frustumCulled = false;
  textMesh.sync();
  return textMesh;
};

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

    const textMesh = makeTextMesh(name, size*0.1);
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

      /* (async () => {
        const u = await p.getScreenshotImageUrl();
        const res = await fetch(u);
        const ab = await res.arrayBuffer();
        const uint8Array = new Uint8Array(ab);
        const gif = parseGIF(uint8Array);
        const frames = decompressFrames(gif, true);
      })(); */

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

      const textMesh = makeTextMesh(name, size*0.05);
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

      /* (async () => {
        const u = await p.getScreenshotImageUrl();
        const res = await fetch(u);
        const ab = await res.arrayBuffer();
        const uint8Array = new Uint8Array(ab);
        const gif = parseGIF(uint8Array);
        const frames = decompressFrames(gif, true);
      })(); */

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

      const textMesh = makeTextMesh(name, size*0.05);
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
              /* (async () => {
                const {dataHash, matrix} = dragMesh;
                const p = await XRPackage.download(dataHash);
                await _addPackage(p, matrix);
              })();
              scene.remove(dragMesh);
              dragMesh = null; */
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
};

export {
  makeTextMesh,
  makeWristMenu,
  makeHighlightMesh,
  makeRayMesh,
}