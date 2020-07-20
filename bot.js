import * as THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import {
  planet,
  Subparcel,
  SubparcelObject,
} from './planet.js';
import {
  SUBPARCEL_SIZE,
  PLANET_OBJECT_SLOTS,
} from './constants.js';

function* gen() {
  for(;;) {
    const subparcel = planet.getSubparcel(14, 29, 16);
    const subparcel2 = subparcel.clone();
    const position = new THREE.Vector3(
      subparcel2.x*SUBPARCEL_SIZE,
      subparcel2.y*SUBPARCEL_SIZE + SUBPARCEL_SIZE-3,
      subparcel2.z*SUBPARCEL_SIZE,
    );
    const quaternion = new THREE.Quaternion();
    const build = subparcel2.addBuild('floor', position, quaternion);
    new Uint8Array(subparcel.data).set(new Uint8Array(subparcel2.data));
    subparcel.reload();
    subparcel.update();
    yield;
    subparcel2.removeBuild(build);
    new Uint8Array(subparcel.data).set(new Uint8Array(subparcel2.data));
    subparcel.reload();
    subparcel.update();
    yield;
  }
}

export class Bot {
  constructor() {
    const f = gen();
    this.interval = setInterval(() => {
      f.next();
    }, 1000);
  }
}