import * as THREE from './three.module.js';
import Avatar from './avatars/avatars.js';
import {RigAux} from './rig-aux.js';
import runtime from './runtime.js';

const inventorySpecs = [
  {
    "start_url": "https://ipfs.exokit.org/QmWgij93j5oU9SHGtGcKATJVsQ5ZEarqjg3bZDZMxXLdjF/model.vrm",
    "preview_url": "https://preview.exokit.org/QmWgij93j5oU9SHGtGcKATJVsQ5ZEarqjg3bZDZMxXLdjF.vrm/preview.png",
  },
  {
    "start_url": "https://avaer.github.io/cat-in-hat/manifest.json",
    "preview_url": "https://preview.exokit.org/[https://avaer.github.io/cat-in-hat/cat-in-hat.glb]/preview.png",
  },
  {
    "start_url": "https://avaer.github.io/sword/manifest.json",
    "preview_url": "https://preview.exokit.org/[https://avaer.github.io/sword/sword.glb]/preview.png",
  },
  {
    "start_url": "https://avaer.github.io/dragon-pet/manifest.json",
    "preview_url": "https://preview.exokit.org/[https://avaer.github.io/dragon-pet/dragon.glb]/preview.png",
  },
  {
    "start_url": "https://avaer.github.io/dragon-mount/manifest.json",
    "preview_url": "https://preview.exokit.org/[https://avaer.github.io/dragon-mount/dragon.glb]/preview.png",
  },
  {
    "start_url": "https://avaer.github.io/dragon-fly/manifest.json",
    "preview_url": "https://preview.exokit.org/[https://avaer.github.io/dragon-fly/dragon-fly.glb]/preview.png",
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

const _loadEquipPreview = async key => {
  const inventorySpec = equipSpecs[key];
  const {start_url} = inventorySpec;

  const o = await runtime.loadFile({
    url: start_url,
    name: start_url,
  });
  o.position.set(-5, 0, -5);
  o.contentId = start_url;
  o.useAux && o.useAux(avatarMesh.rig.aux);
};
const _unloadEquipPreview = key => {
};

const inventorySpecToImg = inventorySpec => {
  const img = document.createElement('img');
  img.src = inventorySpec.preview_url;
  img.classList.add('item');
  return img;
};
{
  let equipSpecIndex = 0;
  const equipSlotsEl = document.getElementById('equip-slots');
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
  const inventorySlotsEl = document.getElementById('inventory-slots');
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

// XXX
let avatarMesh = null;
(async () => {
  const url = `https://webaverse.github.io/assets/male.vrm`;
  const name = 'male.vrm';
  avatarMesh = await runtime.loadFile({
    url,
    name,
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
})();

export {
  inventoryAvatarScene,
  inventoryAvatarCamera,
  inventoryAvatarRenderer,
};