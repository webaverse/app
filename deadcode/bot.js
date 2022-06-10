import * as THREE from './three.module.js';
import {
  world,
  Subparcel,
  SubparcelObject,
} from './world.js';
import {
  SUBPARCEL_SIZE,
  PLANET_OBJECT_SLOTS,
} from './constants.js';

function * gen() {
  for (;;) {
    const subparcel = world.getSubparcel(14, 29, 16);
    const subparcel2 = subparcel.clone();
    const position = new THREE.Vector3(
      subparcel2.x * SUBPARCEL_SIZE,
      subparcel2.y * SUBPARCEL_SIZE + SUBPARCEL_SIZE - 3,
      subparcel2.z * SUBPARCEL_SIZE,
    );
    const quaternion = new THREE.Quaternion();
    const center = new THREE.Vector3(SUBPARCEL_SIZE / 2, SUBPARCEL_SIZE / 2, SUBPARCEL_SIZE / 2);
    const radius = 3;
    const maxDistance = Math.sqrt(radius * radius * 3);
    subparcel2.setCube(center.x, center.y, center.z, radius, (x, y, z) => {
      const p = new THREE.Vector3(x, y, z);
      return maxDistance - center.distanceTo(p);
    });
    const build = subparcel2.addBuild('floor', position, quaternion);
    new Uint8Array(subparcel.data).set(new Uint8Array(subparcel2.data));
    subparcel.reload();
    subparcel.update();
    yield;
    subparcel2.clearCube(center.x, center.y, center.z, radius);
    subparcel2.removeBuild(build);
    new Uint8Array(subparcel.data).set(new Uint8Array(subparcel2.data));
    subparcel.reload();
    subparcel.update();
    yield;
  }
}

export class Bot {
  constructor() {
    return;
    const f = gen();
    this.interval = setInterval(() => {
      f.next();
    }, 1000);
  }
}
