import * as THREE from 'three';
/* import {GLTFLoader, BufferGeometryUtils} from 'three';
import geometryManager from './geometry-manager.js';
import cameraManager from './camera-manager.js';
import uiManager from './ui-manager.js';
import ioManager from './io-manager.js';
import {loginManager} from './login.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import * as universe from './universe.js';
import {rigManager} from './rig.js';
// import {rigAuxManager} from './rig-aux.js';
import {buildMaterial} from './shaders.js';
import {makeTextMesh} from './vr-ui.js';
import activateManager from './activate-manager.js';
import dropManager from './drop-manager.js';
import {teleportMeshes} from './teleport.js';
import {appManager, renderer, scene, orthographicScene, camera, dolly} from './app-object.js';
import {inventoryAvatarScene, inventoryAvatarCamera, inventoryAvatarRenderer, update as inventoryUpdate} from './inventory.js';
import buildTool from './build-tool.js';
import * as notifications from './notifications.js';
import * as popovers from './popovers.js';
import messages from './messages.js';
import {getExt, bindUploadFileButton, updateGrabbedObject} from './util.js';
import {baseUnit, maxGrabDistance, storageHost, worldsHost} from './constants.js';
import fx from './fx.js'; */

let possessed = false;
const controlsManager = {
  setPossessed(newPossessed) {
    possessed = newPossessed;
  },
  isPossessed() {
    return possessed;
  },
  update() {
    // nothing
  },
};
export default controlsManager;