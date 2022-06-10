import * as THREE from 'three';

import metaversefile from 'metaversefile';
const {useApp, useFrame, useCleanup, useLoaders, usePhysics} = metaversefile;

export default e => {
  const app = useApp();
  const physics = usePhysics();

  const srcUrl = ${this.srcUrl};

  const root = app;

  const physicsIds = [];
  const staticPhysicsIds = [];
  e.waitUntil((async () => {
    let o;
    try {
      o = await new Promise((accept, reject) => {
        const {voxLoader} = useLoaders();
        voxLoader.load(srcUrl, accept, function onprogress() {}, reject);
      });
      // startMonetization(instanceId, monetizationPointer, ownerAddress);
    } catch(err) {
      console.warn(err);
    }
    
    root.add(o);
      
    const _addPhysics = async () => {
      const mesh = o;
      
      let physicsMesh = null;
      let physicsBuffer = null;
      /* if (physics_url) {
        if (files && _isResolvableUrl(physics_url)) {
          physics_url = files[_dotifyUrl(physics_url)];
        }
        const res = await fetch(physics_url);
        const arrayBuffer = await res.arrayBuffer();
        physicsBuffer = new Uint8Array(arrayBuffer);
      } else { */
        mesh.updateMatrixWorld();
        physicsMesh = physics.convertMeshToPhysicsMesh(mesh);
        physicsMesh.position.copy(mesh.position);
        physicsMesh.quaternion.copy(mesh.quaternion);
        physicsMesh.scale.copy(mesh.scale);

      // }
      
      if (physicsMesh) {
        root.add(physicsMesh);
        physicsMesh.updateMatrixWorld();
        const physicsId = physics.addGeometry(physicsMesh);
        root.remove(physicsMesh);
        physicsIds.push(physicsId);
        staticPhysicsIds.push(physicsId);
      }
      if (physicsBuffer) {
        const physicsId = physics.addCookedGeometry(physicsBuffer, mesh.position, mesh.quaternion, mesh.scale);
        physicsIds.push(physicsId);
        staticPhysicsIds.push(physicsId);
      }
      /* for (const componentType of runComponentTypes) {
        const componentIndex = components.findIndex(component => component.type === componentType);
        if (componentIndex !== -1) {
          const component = components[componentIndex];
          const componentHandler = componentHandlers[component.type];
          const unloadFn = componentHandler.run(mesh, componentIndex);
          componentUnloadFns.push(unloadFn);
        }
      } */
    };
    if (app.getComponent('physics')) {
      _addPhysics();
    }
    
    o.traverse(o => {
      if (o.isMesh) {
        o.frustumCulled = false;
      }
    });
  })());
  
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });
  
  return root;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'vox';
export const components = ${this.components};