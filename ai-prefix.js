import * as THREE from 'three';
const {Vector3, Quaternion, Euler, Matrix4, Object3D, Texture} = THREE;
import World from './world.js';

const world = new World();
/**
 * App class
 * @description Represents an object in the world
 */
class App extends Object3D {
  /** Create an app.
   * @param {Object} spec - app specification
   * @param {string} spec.name - human friendly app name
   * @param {string} spec.start_url - URL to load content from
   * @param {string} spec.type - the file type extension of `start_url`
   * @param {Object[]} spec.components - the components for this app which 
   */
  constructor() {}
  /* Activate the app */
  activate() {}
  /* Damage the app.
   * @param {number} dmg - HP to hit for. Apps have 100 HP.
   */
  hit(dmg) {}
}

/* Command: Add a model from https://example.com/model.glb */
const app = new App({
  name: 'Model',
  start_url: 'https://example.com/model.glb',
  type: 'glb',
});
const p = useLocalPlayer();
app.position.copy(p.position);
app.quaternion.copy(p.quaternion);
useWorld().add(app);

/* Command: remove the street */
const world = useWorld();
const streetApp = world.apps.find(app => /street/i.test(app.name));
world.remove(streetApp);

/* Command: log the position of the street */
const street = useWorld().apps.find(app => /street/i.test(app.name));
console.log(street.position.toArray().join(', '));

/* Command: color all models red */
useWorld().getAppsByType(['glb', 'vrm']).forEach(app => app.traverse(o => {
  if (o.material?.color) {
    o.material.color.setHex(0xFF0000);
  }
}));

/* Command: remove all textures */
useWorld().apps.forEach(app => app.traverse(o => {
  if (o.material?.map) {
    o.material.map = new Texture();
  }
}));

/* Command: copy the entire scene to offset (+1 +2 -1) with all objects facing forward */
const world = useWorld();
for (const app of world.apps) {
  const app2 = app.clone();
  app2.position.add(new Vector3(1, 2, -1));
  app2.quaternion.set(0, 0, 0, 1);
  world.add(app2);
}

/* Command: bring the sword to me */
const sword = useWorld().getAppByName('sword');
const p = useLocalPlayer();
sword.position.copy(p.position).add(new Vector3(0, 0, -1).applyQuaternion(p.quaternion));

/* Command: equip the closest wearable */
const p = useLocalPlayer();
const sword = useWorld().getAppsByComponent('wear').reduce((a, b) => b.distanceTo(p.position) < a.distanceTo(p.position) ? b : a);
sword.activate();

/* Command: find the closest IPFS app and move it to me */
const ipfsApp = useWorld().apps.find(app => /^ipfs:/.test(app.start_url));
const p = useLocalPlayer();
ipfsApp.position.copy(p.position).add(new Vector3(0, 0, -1).applyQuaternion(p.quaternion));

/* Command: pose the sword 1m left, 0.5m above, 2m behind the dragon */
const world = useWorld();
const dragonApp = world.getAppByName('dragon');
const swordApp = world.getAppByName('sword');
swordApp.position.copy(dragonApp.position).add(new Vector3(-1, 0.5, 2));
swordApp.quaternion.copy(dragonApp.quaternion);

/* Command: clone the character 3m above the original, facing downwards */
const world = useWorld();
const chara = world.getAppsByType('vrm')[0];
const charaCopy = chara.clone();
charaCopy.position.y += 3;
charaCopy.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI/2);
world.add(charaCopy);

/* Command: make the dragon smoothly follow 2m behind me */
m.import(m.module(`\
const follower = useWorld().getAppByName('dragon');
useFrame(() => {
  const p = useLocalPlayer();
  const euler = new Euler().setFromQuaternion(p.quaternion);
  euler.x = 0;
  euler.z = 0;
  const targetPos = p.position.clone().add(new Vector3(0, 0, 2).applyEuler(euler));
  const lastPos = follower.position.clone();
  follower.position.lerp(targetPos, 0.1);
  follower.quaternion.setFromUnitVectors(new Vector3(0, 0, -1), follower.position.clone().sub(lastPos).normalize());
});
`));

/* Command: download nearest html */
const htmlApp = useWorld().getAppsByType('html')[0];
download(htmlApp.start_url);

/* Command: Activate the chest and spawn a loot object (./loot.js) with random upwards velocity when activated. */
const chest = useWorld().getAppByName('chest');
const r = () => -0.5+Math.random()*2;
chest.addEventListener('activate', e => {
  const loot = new App({start_url: './loot.js'});
  loot.position.copy(chest);
  loot.velocity.set(r(), 0.5 + Math.random()*0.5, r());
});
chest.activate();

/* Command: Ride the nearest vehicle */
const p = useLocalPlayer();
const ridable = useWorld().getAppsByComponent('mount').reduce((a, b) => b.distanceTo(p.position) < a.distanceTo(p.position) ? b : a);
ridable.activate();

/* Command: teleport forward 5 meters, wait a quarter second, then teleport up 2 meters */
const p = useLocalPlayer();
teleportTo(p.position.clone().add(new Vector3(0, 0, -5).applyQuaternion(p.quaternion)), p.quaternion);
setTimeout(() => {
  teleportTo(p.position.clone().add(new Vector3(0, 2, 0)), p.quaternion);
}, 1000/4);

/* Command: find a mirror and look at it if found */
const mirror = useWorld().getAppByName('mirror');
if (mirror) {
  const p = useLocalPlayer();
  teleportTo(p.position, new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), mirror.position.clone().sub(p.position).normalize()));
}

/* Command: Load a rocket from ./rocket.glb which moves around with slightly changing velocity every frame. Spawns explosions (./explosion.glb) every half a second. */
m.import(m.module(`\
import m from 'metaversefile';
const rocket = new App({
  name: 'rocket with explosions'
  start_url: './rocket.glb',
});
const r = () => -0.5+Math.random()*2;
const velocity = new Vector3(r(), r(), r());
const world = useWorld();
world.add(rocket);
let lastTimestamp = performance.now();
useFrame(({timestamp, timeDiff}) => {
  rocket.position.add(velocity.clone().multiplyScalar(timeDiff));
  velocity.add(new Vector3(r(), r(), r()).multiplyScalar(0.05)).normalize();
  if ((timestamp - lastTimestamp) > 1000/2) {
    const explosion = new App({
      name: 'explosion'
      start_url: './explosion.glb',
    });
    explosion.position.copy(rocket.position);
    explosion.quaternion.copy(rocket.quaternion);
    world.add(explosion);
    lastTimestamp = timestamp;
  }
});
`));

/* Command: damage nearest model for 30 hp */
const p = useLocalPlayer();
const model = useWorld().getAppsByType(['glb', 'vrm']).reduce((a, b) => b.distanceTo(p.position) < a.distanceTo(p.position) ? b : a);
model.hit(30);

/* Command: load rainbow dash from ipfs hash QmPZJULb8wAui3TUBPwPHGWG1Xngb1QyDJeJSmkQeexs8J. IPFS hashes start with Q */
const ipfsObject = new App({
  name: 'rainbow dash',
  start_url: 'ipfs://QmPZJULb8wAui3TUBPwPHGWG1Xngb1QyDJeJSmkQeexs8J',
});
useWorld().add(ipfsObject);

/* Command: Load Ethereum token (contractAddress tokenId)=(0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b 7). Ethereum addresses start with 0x */
const ethObject = new App({
  name: 'token',
  start_url: 'eth://0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b/7',
});
useWorld().add(ethObject);

/* Command: make the island move slowly upward in the scene. also make it 0.3m right every 2.1 seconds */
m.import(m.module(`\
import m from 'metaversefile';
const island = useWorld().getAppByName('island');
let lastTimestamp = performance.now();
useFrame(({timestamp}) => {
  island.position.y += 0.01;
  if ((timestamp - lastTimestamp) >= 2.1*1000) {
    island.position.x += 0.3;
    lastTimestamp = timestamp;
  }
});
`));

/* Command: make a ball model (https://example.com/ball.glb) oscillate up and down in the scene */
m.import(m.module(`\
import m from 'metaversefile';
const ball = new App({
  name: 'ball',
  start_url: 'https://example.com/ball.glb',
  type: 'glb',
});
const world = useWorld();
world.add(ball);
useFrame(({timestamp}) => {
  world.position.y = Math.sin((timestamp%1000)/1000*Math.PI*2);
});
`));

/* Command: move the ball away from me each frame */
m.import(m.module(`\
import m from 'metaversefile';
const b = useWorld().getAppByName('ball');
useFrame(({timestamp}) => {
  b.position.add(b.position.clone().sub(useLocalPlayer().position).normalize().multiplyScalar(0.02));
});
`));

/* Command: move the ball each frame: right to left for 0.5s, then left to right for 0.5s */
m.import(m.module(`\
import m from 'metaversefile';
const ballApp = useWorld().getAppByName('ball');
useFrame(({timestamp}) => {
  if ((timestamp % 1000) < 1000/2)) {
    ballApp.position.x -= 0.02;
  } else {
    ballApp.position.x += 0.02;
  }
});
`));

/* Command: use useFrame to rotate the poster clockwise at 3 rotations per second */
m.import(m.module(`\
import m from 'metaversefile';
const poster = useWorld().getAppByName('poster');
const axis = new Vector3(0, 1, 0);
useFrame(({timestamp}) => {
  const deltaTime = 1000/3;
  poster.quaternion.setFromAxisAngle(axis, (timestamp%delta)/delta*Math.PI*2);
});
`));

/* Command: 