import * as THREE from './three.module.js';
import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import {rigManager} from './rig.js';
import {scene} from './app-object.js';
import {Sky} from './Sky.js';
import {world} from './world.js';
import {GuardianMesh} from './land.js';
import weaponsManager from './weapons-manager.js';
import minimap from './minimap.js';
import {makeTextMesh} from './vr-ui.js';

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
const _makeLabelMesh = text => {
  const w = 2;
  const h = 0.3;
  const textMesh = makeTextMesh(text, undefined, h, 'center', 'middle');
  textMesh.color = 0xFFFFFF;
  textMesh.sync();
  {
    const geometry = new THREE.CircleBufferGeometry(h/2, 32);
    const img = new Image();
    img.src = `http://127.0.0.1:3000/assets/logo-circle.svg`;
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      texture.needsUpdate = true;
    };
    img.onerror = err => {
      console.warn(err.stack);
    };
    const texture = new THREE.Texture(img);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const avatarMesh = new THREE.Mesh(geometry, material);
    avatarMesh.position.x = -w/2;
    avatarMesh.position.y = -0.02;
    textMesh.add(avatarMesh);
  }
  {
    const roundedRectShape = new THREE.Shape();
    ( function roundedRect( ctx, x, y, width, height, radius ) {
      ctx.moveTo( x, y + radius );
      ctx.lineTo( x, y + height - radius );
      ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
      /* ctx.lineTo( x + radius + indentWidth, y + height );
      ctx.lineTo( x + radius + indentWidth + indentHeight, y + height - indentHeight );
      ctx.lineTo( x + width - radius - indentWidth - indentHeight, y + height - indentHeight );
      ctx.lineTo( x + width - radius - indentWidth, y + height ); */
      ctx.lineTo( x + width - radius, y + height );
      ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
      ctx.lineTo( x + width, y + radius );
      ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
      ctx.lineTo( x + radius, y );
      ctx.quadraticCurveTo( x, y, x, y + radius );
    } )( roundedRectShape, 0, 0, w, h, h/2 );

    const extrudeSettings = {
      steps: 2,
      depth: 0,
      bevelEnabled: false,
      /* bevelEnabled: true,
      bevelThickness: 0,
      bevelSize: 0,
      bevelOffset: 0,
      bevelSegments: 0, */
    };
    const geometry = BufferGeometryUtils.mergeBufferGeometries([
      new THREE.CircleBufferGeometry(0.13, 32)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-w/2, -0.02, -0.01)).toNonIndexed(),
      new THREE.ExtrudeBufferGeometry( roundedRectShape, extrudeSettings )
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-w/2, -h/2 - 0.02, -0.02)),
    ]);
    const material2 = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const nametagMesh2 = new THREE.Mesh(geometry, material2);
    textMesh.add(nametagMesh2);
  }
  return textMesh;
};
const worldObjects = universeSpecs.map(spec => {
  const guardianMesh = GuardianMesh(spec.extents, blueColor);
  guardianMesh.name = spec.name;
  const worldObject = minimap.addWorld(spec.extents);
  guardianMesh.worldObject = worldObject;
  scene.add(guardianMesh);

  const labelMesh = _makeLabelMesh('Erithor');
  labelMesh.position.x = (spec.extents[0]+spec.extents[3])/2;
  labelMesh.position.y = spec.extents[4] + 1;
  labelMesh.position.z = (spec.extents[2]+spec.extents[5])/2;
  guardianMesh.add(labelMesh);

  return guardianMesh;
});

let currentWorld = null;
const lastCoord = new THREE.Vector3(0, 0, 0);
// const locationIcon = document.getElementById('location-icon');
// const locationLabel = document.getElementById('location-label');
const _getCurrentCoord = (p, v) => v.set(
  Math.floor(p.x),
  Math.floor(p.y),
  Math.floor(p.z),
);
const update = () => {
  skybox.position.copy(rigManager.localRig.inputs.hmd.position);
  skybox.update();

  const oldWorld = currentWorld;

  const _parseUniverseSpec = spec => localBox.set(localVector.fromArray(spec.extents, 0), localVector2.fromArray(spec.extents, 3));
  const intersectionIndex = universeSpecs.findIndex(spec =>
  	_parseUniverseSpec(spec)
  	  .containsPoint(rigManager.localRig.inputs.hmd.position)
  );
  const intersection = universeSpecs[intersectionIndex];
  if (intersection) {
    currentWorld = worldObjects[intersectionIndex];
  } else {
  	currentWorld = null;
  }

  /* if (currentWorld !== oldWorld) {
    const objects = world.getObjects();
    for (const object of objects) {
      world.removeObject(object.instanceId);
    }

    if (currentWorld) {
      const u = `https://avaer.github.io/physicscube/index.js`;
      const center = _parseUniverseSpec(intersection).getCenter(localVector);
      world.addObject(u, null, center, new THREE.Quaternion());
    }
  } */

  for (const worldObject of worldObjects) {
    worldObject.material.uniforms.uColor.value.setHex(blueColor);
  }
  if (currentWorld) {
  	currentWorld.material.uniforms.uColor.value.setHex(greenColor);
  }

  _getCurrentCoord(rigManager.localRig.inputs.hmd.position, localVector);
  if (!localVector.equals(lastCoord)) {
    weaponsManager.setWorld(localVector, currentWorld);
    lastCoord.copy(localVector);
  }
};

export {
  update,
};