import * as THREE from './three.module.js';
import Avatar from './avatars/avatars.js';
import {RigAux} from './rig-aux.js';
import runtime from './runtime.js';

const inventorySpecs = [
  {
    "start_url": "https://ipfs.exokit.org/QmWgij93j5oU9SHGtGcKATJVsQ5ZEarqjg3bZDZMxXLdjF.vrm",
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

{
  let inventorySpecIndex = 0;
  const inventorySlotsEl = document.getElementById('inventory-slots');
  for (const rowEl of inventorySlotsEl.children) {
    if (inventorySpecIndex < inventorySpecs.length) {
      for (const slotEl of rowEl.children) {
        if (inventorySpecIndex < inventorySpecs.length) {
          const inventorySpec = inventorySpecs[inventorySpecIndex++];

          {          
            const img = document.createElement('img');
            img.src = inventorySpec.preview_url;
            img.classList.add('item');
            img.setAttribute('draggable', '');
            slotEl.appendChild(img);
          }

          
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
(async () => {
  const url = `https://webaverse.github.io/assets/male.vrm`;
  const name = 'male.vrm';
  const mesh = await runtime.loadFile({
    url,
    name,
  });
  if (mesh) {
    mesh.name = 'avatarMesh';
    const localRig = new Avatar(mesh.raw, {
      fingers: true,
      hair: true,
      visemes: true,
      debug: false //!o,
    });
    localRig.aux = new RigAux(localRig);
    localRig.model.rig = localRig;
    
    inventoryAvatarScene.add(localRig.model);
  }
})();

export {
  inventoryAvatarScene,
  inventoryAvatarCamera,
  inventoryAvatarRenderer,
};