throw new Error('lol');
import * as THREE from 'three';
import Avatar from './avatars/avatars.js';
import {rigManager} from './rig.js';
// import {RigAux} from './rig-aux.js';
// import runtime from './runtime.js';
import {addDefaultLights} from './util.js';

const localVector = new THREE.Vector3();
const localRaycaster = new THREE.Raycaster();

export const inventorySpecs = [
  {
    id: 1,
    start_url: "https://ipfs.exokit.org/QmWgij93j5oU9SHGtGcKATJVsQ5ZEarqjg3bZDZMxXLdjF/model.vrm",
    preview_url: "https://preview.exokit.org/QmWgij93j5oU9SHGtGcKATJVsQ5ZEarqjg3bZDZMxXLdjF.vrm/preview.png",
    title: "Anime Flowrider Custom 2012 Edition",
    description: "The flyest specs in the new world for a space crusier.",
    hash: "Qmc9ZW6gbbWQ5MFxYCcmX1FSyPaL5DjDWCKZmw7aQJD8k9"
  },
  {
    id: 2,
    start_url: "https://avaer.github.io/cat-in-hat/manifest.json",
    preview_url: "https://preview.exokit.org/[https://avaer.github.io/cat-in-hat/cat-in-hat.glb]/preview.png",
    title: "The Darkest Path down the Mountain",
    description: "Not as safe place for any traveler to be walking.",
    hash: "QmRhfxErxohS6igkWMZdci2drLnyU6EBDZig2NuDEM7Mck"
  },
  {
    id: 3,
    start_url: "https://avaer.github.io/sword/manifest.json",
    preview_url: "https://preview.exokit.org/[https://avaer.github.io/sword/sword.glb]/preview.png",
    title: "Where the Wild Ones go.",
    description: "Take yourself out on a medieval cruise liner with many fancy feasts.",
    hash: "QmVmVnFEZqoUvQLAcc4h71rEVeSSj4REFQZrBRqVBTgVSp"
  },
  {
    id: 4,
    start_url: "https://avaer.github.io/dragon-pet/manifest.json",
    preview_url: "https://preview.exokit.org/[https://avaer.github.io/dragon-pet/dragon.glb]/preview.png",
    title: "From Here to Nowhere.",
    description: "derp derp da derp is the lerp mang.",
    hash: "Qmc9ZW6gbbWQ5MFxYCcmX1FSyPaL5DjDWCKZmw7aQJD8k9"
  },
  {
    id: 5,
    start_url: "https://avaer.github.io/dragon-mount/manifest.json",
    preview_url: "https://preview.exokit.org/[https://avaer.github.io/dragon-mount/dragon.glb]/preview.png",
    title: "Webaverse Crystal of Destiny",
    description: "Only the legendary have access to such a device.",
    hash: "QmRhfxErxohS6igkWMZdci2drLnyU6EBDZig2NuDEM7Mck"
  },
  {
    id: 6,
    start_url: "https://avaer.github.io/dragon-fly/manifest.json",
    preview_url: "https://preview.exokit.org/[https://avaer.github.io/dragon-fly/dragon-fly.glb]/preview.png",
    title: "Cat",
    description: "A feline.",
    hash: "QmVmVnFEZqoUvQLAcc4h71rEVeSSj4REFQZrBRqVBTgVSp"
  },
];

const equipSpecs = {
  leftHand: null,
  rightHand: null,
  head: null,
  body: null,
  legs: null,
  pet: null,
  mount: null,
};
const equipPreviewObjects = (() => {
  const result = {};
  for (const k in equipSpecs) {
    result[k] = null;
  }
  return result;
})();
const equipComponents = JSON.parse(JSON.stringify(equipPreviewObjects));

const _loadEquipPreview = async key => {
  const inventorySpec = equipSpecs[key];
  const {start_url} = inventorySpec;

  const contentId = start_url;
  const o = await runtime.loadFile({
    url: start_url,
    name: start_url,
  }, {
    contentId,
  });
  o.useAux && o.useAux(avatarMesh.rig.aux);
  equipPreviewObjects[key] = o;

  const components = o.getComponents ? o.getComponents() : [];
  equipComponents[key] = [];
  for (let componentIndex = 0; componentIndex < components.length; componentIndex++) {
    const component = components[componentIndex];
    const {type} = component;
    switch (type) {
      case 'wear': {
        const auxComponent = await rigManager.localRig.aux.addWearable({
          id: rigManager.localRig.aux.getNextId(),
          contentId: start_url,
          componentIndex,
        });
        equipComponents[key].push({
          type,
          auxComponent,
        });
        break;
      }
      case 'pet': {
        const auxComponent = await rigManager.localRig.aux.addPet({
          id: rigManager.localRig.aux.getNextId(),
          contentId: start_url,
          componentIndex,
        });
        equipComponents[key].push({
          type,
          auxComponent,
        });
        break;
      }
      case 'sit': {
        const auxComponent = await rigManager.localRig.aux.addSittable({
          id: rigManager.localRig.aux.getNextId(),
          contentId: start_url,
          componentIndex,
        });
        equipComponents[key].push({
          type,
          auxComponent,
        });
        break;
      }
    }
  }
};
const _unloadEquipPreview = key => {
  const o = equipPreviewObjects[key];
  if (o) {
    o.destroy();

    const specs = equipComponents[key];
    for (const spec of specs) {
      const {type} = spec;
      switch (type) {
        case 'wear': {
          rigManager.localRig.aux.removeWearable(spec.auxComponent);
          break;
        }
        case 'pet': {
          rigManager.localRig.aux.removePet(spec.auxComponent);
          break;
        }
        case 'sit': {
          rigManager.localRig.aux.removeSittable(spec.auxComponent);
          break;
        }
      }
    }
  }
};

const inventoryAvatarScene = new THREE.Scene();
const inventoryAvatarCamera = new THREE.PerspectiveCamera();
const inventoryAvatarRenderer = (() => {
  let canvas = document.getElementById('inventory-avatar') || undefined;
  let context = canvas && canvas.getContext('webgl2', {
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: false,
    xrCompatible: true,
  });
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    antialias: true,
    alpha: true,
    // preserveDrawingBuffer: false,
  });
  const w = 400;
  const h = 590;
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.autoClear = false;
  renderer.sortObjects = false;
  
  inventoryAvatarCamera.aspect = w/h;
  inventoryAvatarCamera.near = 0.1;
  inventoryAvatarCamera.far = 100;
  inventoryAvatarCamera.updateProjectionMatrix();

  return renderer;
})();
addDefaultLights(inventoryAvatarScene);

const planeMesh = new THREE.Mesh(new THREE.CylinderBufferGeometry(1, 1, 0.1).applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -0.1/2)), new THREE.MeshBasicMaterial({
  color: 0x333333,
}));
planeMesh.position.set(0, -0.2, -2.5);
inventoryAvatarScene.add(planeMesh);


let avatarMeshLoaded = false;
let avatarMesh = null;
let targetPoint = new THREE.Vector3(0, 0, 0);
const initialAvatarPosition = new THREE.Vector3(0, 1.3, -2.5);
const _loadAvatarMesh = async () => {
  const url = `https://webaverse.github.io/assets/male.vrm`;
  const name = 'male.vrm';
  avatarMesh = await runtime.loadFile({
    url,
    name,
  }, {
    contentId: url,
  });
  if (mesh) {
    avatarMesh.name = 'avatarMesh';
    const rig = new Avatar(avatarMesh.raw, {
      fingers: true,
      hair: true,
      visemes: true,
      debug: false,
    });
    rig.aux = new RigAux({
      rig,
      scene: inventoryAvatarScene,
    });
    rig.model.rig = rig;
    
    inventoryAvatarScene.add(rig.model);
  }
};
const _ensureAvatarMesh = () => {
  if (!avatarMeshLoaded) {
    avatarMeshLoaded = true;
    _loadAvatarMesh();
  }
};

const inventoryMenuEl = document.getElementById('inventory-menu');
const inventoryAvatarEl = document.getElementById('inventory-avatar');
const equipSlotsEl = document.getElementById('equip-slots');
const inventorySlotsEl = document.getElementById('inventory-slots');

const bindInterface = () => {
  if (equipSlotsEl && inventorySlotsEl) {
    const inventorySpecToImg = inventorySpec => {
      const img = document.createElement('img');
      img.src = inventorySpec.preview_url;
      img.classList.add('item');
      return img;
    };
    {
      let equipSpecIndex = 0;
      for (const rowEl of equipSlotsEl.children) {
        for (const slotEl of rowEl.children) {
          const key = slotEl.getAttribute('slot');
          const index = equipSpecIndex++;
          
          const _clear = () => {
            const localChildren = Array.from(slotEl.children);
            for (const childEl of localChildren) {
              if (childEl.classList.contains('item')) {
                slotEl.removeChild(childEl);
              }
            }
          };
          
          slotEl.addEventListener('dragover', e => {
            e.preventDefault();
          });
          slotEl.addEventListener('drop', e => {
            const s = e.dataTransfer.getData('application/json');
            const j = JSON.parse(s);
            if (avatarMesh) {
              if (j._inventorySrc) {
                const inventorySpec = j.spec;
                equipSpecs[key] = inventorySpec;
                _loadEquipPreview(key);

                _clear();

                const img = inventorySpecToImg(inventorySpec);
                slotEl.appendChild(img);
              } else if (j._equipmentSrc) {
                const inventorySpec = j.value;
                equipSpecs[key] = inventorySpec;
                _loadEquipPreview(key);

                const img = inventorySpecToImg(inventorySpec);
                slotEl.appendChild(img);
              }
            }
          });
          slotEl.addEventListener('dragstart', e => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/json', JSON.stringify({
              value: equipSpecs[key],
              _equipmentSrc: true,
            }));
          });
          slotEl.addEventListener('dragend', e => {
            equipSpecs[key] = null;
            _unloadEquipPreview(key);
            _clear();
          });
        }
      }
    }
    {
      let inventorySpecIndex = 0;
      for (const rowEl of inventorySlotsEl.children) {
        if (inventorySpecIndex < inventorySpecs.length) {
          for (const slotEl of rowEl.children) {
            if (inventorySpecIndex < inventorySpecs.length) {
              const inventorySpec = inventorySpecs[inventorySpecIndex++];

              const img = inventorySpecToImg(inventorySpec);
              slotEl.appendChild(img);

              slotEl.addEventListener('dragstart', e => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('application/json', JSON.stringify({
                  _inventorySrc: true,
                  spec: inventorySpec,
                }));
              });
            } else {
              break;
            }
          }
        } else {
          break;
        }
      }
    }
  }
};

const _isOpen = () => !!inventoryMenuEl && inventoryMenuEl.classList.contains('open');
const toggle = () => {
  inventoryMenuEl.classList.toggle('open');
  document.exitPointerLock();
};

window.addEventListener('mousemove', e => {
  if (_isOpen()) {
    const boundingBox = inventoryAvatarRenderer.domElement.getBoundingClientRect();

    const mouse = new THREE.Vector2();
    mouse.x = ((e.clientX - (boundingBox.left)) / boundingBox.width) * 2 - 1;
    mouse.y = - ((e.clientY - boundingBox.top) / boundingBox.height) * 2 + 1;
    if (isFinite(mouse.x) && isFinite(mouse.y)) {
      // console.log('box', mouse.toArray());
      localRaycaster.setFromCamera(mouse, inventoryAvatarCamera);

      if (avatarMesh) {
        targetPoint = new THREE.Vector3(0, inventoryAvatarCamera.position.y, -1.5).applyQuaternion(
          new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, -1),
            localRaycaster.ray.direction
          )
        );
        // cubeMesh.position.copy(targetPoint);

        avatarMesh.rig.inputs.hmd.position.copy(initialAvatarPosition)
          .add(new THREE.Vector3(mouse.x * 0.03, mouse.y * 0.1, 0));
        avatarMesh.rig.inputs.hmd.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(
          avatarMesh.rig.inputs.hmd.position,
          targetPoint,
          new THREE.Vector3(0, 1, 0)
        ));
      }
    }
  }
});

const update = () => {
  if (_isOpen()) {
    _ensureAvatarMesh();

    inventoryAvatarCamera.position.set(0, 0.8, 0);

    avatarMesh = inventoryAvatarScene.getObjectByName('avatarMesh');
    if (avatarMesh) {
      // avatarMesh.rig.inputs.hmd.position.copy(initialAvatarPosition);
      /* avatarMesh.rig.inputs.hmd.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 0, 1)
      ); */
      {
        avatarMesh.rig.inputs.leftGamepad.position.copy(avatarMesh.rig.inputs.hmd.position).add(localVector.set(-0.25, -0.3, 0.1));
        const direction = targetPoint.clone().sub(avatarMesh.rig.inputs.leftGamepad.position).normalize();
        avatarMesh.rig.inputs.leftGamepad.position.add(new THREE.Vector3(direction.x*0.5, direction.y*0.5, direction.z*0.25));
        avatarMesh.rig.inputs.leftGamepad.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          direction,
          new THREE.Vector3(0, 1, 0)
        ))//.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2));
        // avatarMesh.rig.inputs.leftGamepad.grip = 1;
        // avatarMesh.rig.inputs.leftGamepad.pointer = 1;
        // avatarMesh.rig.inputs.leftGamepad.enabled = true;
      }
      {
        avatarMesh.rig.inputs.rightGamepad.position.copy(avatarMesh.rig.inputs.hmd.position).add(localVector.set(0.25, -0.8, 0.05));
        const direction = targetPoint.clone().sub(avatarMesh.rig.inputs.rightGamepad.position).normalize();
        // avatarMesh.rig.inputs.rightGamepad.position.add(direction.clone().multiplyScalar(0.3));
        avatarMesh.rig.inputs.rightGamepad.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, 1)
        ));
        // avatarMesh.rig.inputs.rightGamepad.grip = 1;
        // avatarMesh.rig.inputs.rightGamepad.pointer = 1;
        // avatarMesh.rig.inputs.rightGamepad.enabled = true;
      }
      inventoryAvatarRenderer.render(inventoryAvatarScene, inventoryAvatarCamera);

      const timeDiff = 0.01;
      avatarMesh.rig.update(timeDiff);
      avatarMesh.rig.aux.update(timeDiff);
    }
  }
};

export {
  inventoryAvatarScene,
  inventoryAvatarCamera,
  inventoryAvatarRenderer,
  bindInterface,
  toggle,
  update,
};