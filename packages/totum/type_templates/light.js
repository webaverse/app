import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useCleanup, /*usePhysics, */ useWorld} = metaversefile;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

export default e => {
  const app = useApp();

  const srcUrl = ${this.srcUrl};
  
  const worldLights = app;
  app.light = null;

  const addShadows = (light, params) => {
    light.castShadow = true; 
    if (typeof params[1] === 'number') {
      light.shadow.mapSize.width = params[1]; 
      light.shadow.mapSize.height = params[1]; 
    }
    if (typeof params[2] === 'number') {
      light.shadow.camera.near = params[2];
    }
    if (typeof params[3] === 'number') {
      light.shadow.camera.far = params[3];
    }
    if (typeof params[0] === 'number') {
      light.shadow.camera.left = params[0];
      light.shadow.camera.right = -params[0];
      light.shadow.camera.top = params[0];
      light.shadow.camera.bottom = -params[0];
    }
    if (typeof params[4] === 'number') {
      light.shadow.bias = params[4];
    }
    if (typeof params[5] === 'number') {
      light.shadow.normalBias = params[5];
    }
    
    light.shadow.camera.initialLeft = light.shadow.camera.left;
    light.shadow.camera.initialRight = light.shadow.camera.right;
    light.shadow.camera.initialTop = light.shadow.camera.top;
    light.shadow.camera.initialBottom = light.shadow.camera.bottom;
    
    // light.params = params;
    // console.log("Added shadows for:", light, "with params:", params);
  };

  let json = null;
  e.waitUntil((async () => {
    const res = await fetch(srcUrl);
    json = await res.json();

    _render();
  })());

  const lightTrackers = [];
  const lightTargets = [];
  const _render = () => {
    if (json !== null) {
      let {lightType, args, position, shadow} = json;
      const light = (() => {
        switch (lightType) {
          case 'ambient': {
            return new THREE.AmbientLight(
              new THREE.Color().fromArray(args[0]).multiplyScalar(1/255).getHex(),
              args[1]
            );
          }
          case 'directional': {
            return new THREE.DirectionalLight(
              new THREE.Color().fromArray(args[0]).multiplyScalar(1/255).getHex(),
              args[1]
            );
          }
          case 'point': {
            return new THREE.PointLight(
              new THREE.Color().fromArray(args[0]).multiplyScalar(1/255).getHex(),
              args[1],
              args[2],
              args[3]
            );
          }
          case 'spot': {
            return new THREE.SpotLight(
              new THREE.Color().fromArray(args[0]).multiplyScalar(1/255).getHex(),
              args[1],
              args[2],
              args[3],
              args[4],
              args[5]
            );
          }
          case 'rectArea': {
            return new THREE.RectAreaLight(
              new THREE.Color().fromArray(args[0]).multiplyScalar(1/255).getHex(),
              args[1],
              args[2],
              args[3]
            );
          }
          case 'hemisphere': {
            return new THREE.HemisphereLight(
              new THREE.Color().fromArray(args[0]).multiplyScalar(1/255).getHex(),
              new THREE.Color().fromArray(args[1]).multiplyScalar(1/255).getHex(),
              args[2]
            );
          }
          default: {
            return null;
          }
        }
      })();
      if (light) {
        light.lastAppMatrixWorld = new THREE.Matrix4();
        light.plane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, -1, 0), app.position);

        if (lightType === 'directional' || lightType === 'point' || lightType === 'spot') {
          if (Array.isArray(shadow)) {
            addShadows(light, shadow);
          }
        }
        
        const lightTracker = new THREE.Object3D();
        lightTracker.name = 'LightTracker';
        if (Array.isArray(position)) {
          lightTracker.position.fromArray(position);
        } else {
          lightTracker.position.set(0, 0, 0);
        }
        light.position.set(0, 0, 0);
        lightTracker.add(light);
        lightTracker.light = light;
        
        worldLights.add(lightTracker);
        lightTrackers.push(lightTracker)
        if (light.target) {
          worldLights.add(light.target);
          lightTargets.push(light.target);
        }
        lightTracker.updateMatrixWorld(true);
        
        app.light = lightTracker;
      } else {
        console.warn('invalid light spec:', json);
      }
    }
  };

  useFrame(() => {
    if (lightTrackers.length > 0) {
      for (const lightTracker of lightTrackers) {
        const {light} = lightTracker;
        if (!light.lastAppMatrixWorld.equals(app.matrixWorld)) {
          light.position.copy(app.position);
          // light.quaternion.copy(app.quaternion);
          if (light.target) {
            light.quaternion.setFromRotationMatrix(
              new THREE.Matrix4().lookAt(
                light.position,
                light.target.position,
                localVector.set(0, 1, 0),
              )
            );
          }
          light.scale.copy(app.scale);
          light.matrix.copy(app.matrix);
          light.matrixWorld.copy(app.matrixWorld);
          light.lastAppMatrixWorld.copy(app.matrixWorld);
          light.updateMatrixWorld();
        }
      }

      const localPlayer = useLocalPlayer();
      for (const lightTracker of lightTrackers) {
        const {light} = lightTracker;
        if (light.isDirectionalLight) {
          light.plane.setFromNormalAndCoplanarPoint(localVector.set(0, 0, -1).applyQuaternion(light.shadow.camera.quaternion), light.shadow.camera.position);
          const planeTarget = light.plane.projectPoint(localPlayer.position, localVector);
          // light.updateMatrixWorld();
          const planeCenter = light.shadow.camera.position.clone();
          
          const x = planeTarget.clone().sub(planeCenter)
            .dot(localVector2.set(1, 0, 0).applyQuaternion(light.shadow.camera.quaternion));
          const y = planeTarget.clone().sub(planeCenter)
            .dot(localVector2.set(0, 1, 0).applyQuaternion(light.shadow.camera.quaternion));
          
          light.shadow.camera.left = x + light.shadow.camera.initialLeft;
          light.shadow.camera.right = x + light.shadow.camera.initialRight;
          light.shadow.camera.top = y + light.shadow.camera.initialTop;
          light.shadow.camera.bottom = y + light.shadow.camera.initialBottom;
          light.shadow.camera.updateProjectionMatrix();
          light.updateMatrixWorld();
        }
      }
    }
  });

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'light';
export const components = ${this.components};