import * as THREE from './three.module.js';
import {rigManager} from './rig.js';
import {scene} from './app-object.js';
import {Sky} from './Sky.js';
import {world} from './world.js';
import {GuardianMesh} from './land.js';
import minimap from './minimap.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localBox = new THREE.Box3();

const blueColor = 0x42a5f5;
const greenColor = 0xaed581;

let skybox;
{
  const effectController = {
    turbidity: 2,
    rayleigh: 3,
    mieCoefficient: 0.2,
    mieDirectionalG: 0.9999,
    inclination: 0, // elevation / inclination
    azimuth: 0, // Facing front,
    // exposure: renderer.toneMappingExposure
  };
  const sun = new THREE.Vector3();
  function update() {
    var uniforms = skybox.material.uniforms;
    uniforms.turbidity.value = effectController.turbidity;
    uniforms.rayleigh.value = effectController.rayleigh;
    uniforms.mieCoefficient.value = effectController.mieCoefficient;
    uniforms.mieDirectionalG.value = effectController.mieDirectionalG;

    // effectController.azimuth = (0.05 + ((Date.now() / 1000) * 0.1)) % 1;
    effectController.azimuth = 0.25;
    var theta = Math.PI * (effectController.inclination - 0.5);
    var phi = 2 * Math.PI * (effectController.azimuth - 0.5);

    sun.x = Math.cos(phi);
    sun.y = Math.sin(phi) * Math.sin(theta);
    sun.z = Math.sin(phi) * Math.cos(theta);

    uniforms.sunPosition.value.copy(sun);
  }
  skybox = new Sky();
  skybox.scale.setScalar(1000);
  skybox.update = update;
  skybox.update();
  scene.add(skybox);
}
const universeSpecs = [{
	name: 'Erithor',
  extents: [
    0, 0, -10 - 4,
    10, 3, -4,
  ],
}];
const worldObjects = universeSpecs.map(spec => {
  const guardianMesh = GuardianMesh(spec.extents, blueColor);
  guardianMesh.name = spec.name;
  const worldObject = minimap.addWorld(spec.extents);
  guardianMesh.worldObject = worldObject;
  scene.add(guardianMesh);
  return guardianMesh;
});

let currentWorld = null;
const lastCoord = new THREE.Vector3(0, 0, 0);
const locationIcon = document.getElementById('location-icon');
const locationLabel = document.getElementById('location-label');
const _getCurrentCoord = (p, v) => v.set(
  Math.floor(p.x),
  Math.floor(p.y),
  Math.floor(p.z),
);
const update = () => {
  skybox.position.copy(rigManager.localRig.inputs.hmd.position);
  skybox.update();

  const _parseUniverseSpec = spec => localBox.set(localVector.fromArray(spec.extents, 0), localVector2.fromArray(spec.extents, 3));
  const intersectionIndex = universeSpecs.findIndex(spec =>
  	_parseUniverseSpec(spec)
  	  .containsPoint(rigManager.localRig.inputs.hmd.position)
  );
  const intersection = universeSpecs[intersectionIndex];
  if (intersection) {
    const newWorld = worldObjects[intersectionIndex];
    if (newWorld !== currentWorld) {
    	currentWorld = newWorld;

	    const objects = world.getObjects();
	    for (const object of objects) {
	      world.removeObject(object.instanceId);
	    }

	    const u = `https://avaer.github.io/physicscube/index.js`;
	    const center = _parseUniverseSpec(intersection).getCenter(localVector);
	    world.addObject(u, null, center, new THREE.Quaternion());
	  }
  } else {
  	currentWorld = null;
  }

  for (const worldObject of worldObjects) {
    worldObject.material.uniforms.uColor.value.setHex(blueColor);
  }
  if (currentWorld) {
  	currentWorld.material.uniforms.uColor.value.setHex(greenColor);
  }

  _getCurrentCoord(rigManager.localRig.inputs.hmd.position, localVector);
  if (!localVector.equals(lastCoord)) {
  	locationIcon.classList.toggle('highlight', !!intersection);
  	locationLabel.classList.toggle('highlight', !!intersection);
    locationLabel.innerText = (currentWorld ? currentWorld.name : 'The Void') + ` @${localVector.x},${localVector.z}`;
    lastCoord.copy(localVector);
  }
};

export {
  update,
};