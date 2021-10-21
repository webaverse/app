import * as THREE from 'three';
const {Vector3, Quaternion, Euler, Matrix4, Box3, Object3D, Texture} = THREE;
import {useLocalPlayer, createApp, addApp, removeApp, getAppByName, getAppsByType, getAppsByTypes, getAppsByComponent} from 'metaversefile';

/* Command: Add a model from https://example.com/model.glb */
const m = createApp({
  name: 'Model',
  start_url: 'https://example.com/model.glb',
  type: 'glb',
  in_front: true,
});
addApp(m);

/* Command: Open https://discord.com/ */
const discord = createApp({
  start_url: 'https://discord.com/',
  in_front: true,
});
addApp(discord);

/* Command: remove the street */
const streetApp = apps.find(app => /street/i.test(app.name));
removeApp(streetApp);
streetApp.destroy();

/* Command: log the position of the street */
const street = apps.find(app => /street/i.test(app.name));
console.log(street.position.toArray().join(', '));

/* Command: color all models red */
getAppsByTypes(['glb', 'vrm']).forEach(app => app.traverse(o => {
  if (o.material?.color) {
    o.material.color.setHex(0xFF0000);
  }
}));

/* Command: remove all textures */
apps.forEach(app => app.traverse(o => {
  if (o.material?.map) {
    o.material.map = new Texture();
  }
}));

/* Command: copy the entire scene to offset (+1 +2 -1) with all objects facing forward (identity quaternion) */
for (const app of apps) {
  const app2 = app.clone();
  app2.position.add(new Vector3(1, 2, -1));
  app2.quaternion.identity();
  addApp(app2);
}

/* Command: Bring the sword to me, the local player. Copy the sword position and quaternion. Offset the position 1.5 meters in front of me. */
const sword = getAppByName('sword');
const p = useLocalPlayer();
sword.position.copy(p.position).add(new Vector3(0, 0, -1.5).applyQuaternion(p.quaternion));
sword.quaternion.copy(p.quaternion);

/* Command: put the rock on the floor in front of me */
const rock = getAppByName('rock');
const p2 = useLocalPlayer();
rock.position.copy(p2.position).add(new Vector3(0, 0, -2).applyQuaternion(p2.quaternion));
rock.position.y = 0;

/* Command: set grass z += 2 */
getAppByName('grass').position.z += 2;

/* Command: equip the closest wearable */
const p3 = useLocalPlayer();
const sword = getAppsByComponent('wear').reduce((a, b) => b.distanceTo(p3.position) < a.distanceTo(p3.position) ? b : a);
sword.activate();

/* Command: Find the closest IPFS app and make a copy of it. Add the copy in front of me. */
const ipfsApp = apps.find(app => /^ipfs:/.test(app.start_url));
const p4 = useLocalPlayer();
const ipfsAppClone = ipfsApp.clone();
ipfsAppClone.position.copy(p4.position).add(new Vector3(0, 0, -1).applyQuaternion(p4.quaternion));
addApp(ipfsAppClone);

/* Command: pose the sword 1m left, 0.5m above, 2m behind the dragon */
const dragonApp = getAppByName('dragon');
const swordApp = getAppByName('sword');
swordApp.position.copy(dragonApp.position).add(new Vector3(-1, 0.5, 2));
swordApp.quaternion.copy(dragonApp.quaternion);

/* Command: Make a character face downward: set the quaternion to 90 degrees around the x axis. */
const chara = getAppsByType('vrm')[0];
chara.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI/2);

/* Command: make the dragon smoothly follow 2m behind me */
metaversefile.load(createModule(`\
const follower = getAppByName('dragon');
useFrame(() => {
  const p = useLocalPlayer();
  const euler = new Euler().setFromQuaternion(p.quaternion);
  euler.x = euler.z = 0;
  const targetPos = p.position.clone().add(new Vector3(0, 0, 2).applyEuler(euler));
  const lastPos = follower.position.clone();
  follower.position.lerp(targetPos, 0.1);
  follower.quaternion.setFromUnitVectors(new Vector3(0, 0, -1), follower.position.clone().sub(lastPos).normalize());
});
`));

/* Command: download nearest html */
const htmlApp = getAppsByType('html')[0];
download(htmlApp.start_url);

/* Command: When the chest is activated, spawn a loot object (./loot.js) above the chest. */
const chest = getAppByName('chest');
chest.addEventListener('activate', e => {
  const loot = createApp({start_url: './loot.js'});
  loot.position.copy(chest.position).app(new Vector3(0, 1, 0));
  addApp(loot);
});

/* Command: Ride the nearest vehicle. */
const p5 = useLocalPlayer();
const ridable = getAppsByComponent('mount').reduce((a, b) => b.distanceTo(p5.position) < a.distanceTo(p5.position) ? b : a);
ridable.activate();

/* Command: Rotate the cat -90 degrees (-pi/2 radians) in the y axis. */
getAppByName('cat').quaternion.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0)), -Math.PI/2);

/* Command: teleport forward 10 meters (10m) */
const p6 = useLocalPlayer();
p6.position.add(new Vector3(0, 0, -10).applyQuaternion(p6.quaternion));

/* Command: teleport me backward 1.2 meters (1.2m) */
const p7 = useLocalPlayer();
p7.position.add(new Vector3(0, 0, 1.2).applyQuaternion(p7.quaternion));

/* Command: Teleport me left .2 meters (.2m). */
const p8 = useLocalPlayer();
p8.position.add(new Vector3(-.2, 0, 0).applyQuaternion(p8.quaternion));

/* Command: Teleport me up 2 meters (2m). */
useLocalPlayer().position.add(new Vector3(0, 2, 0));

/* Command: teleport 1.2m above and 1.3m in front of the terrain */
const terrain = getAppByName('terrain');
useLocalPlayer().position.copy(terrain.position).add(new Vector3(0, 1.2, 1.3));

/* Command: look at (face towards) the mirror */
const mirror = getAppByName('mirror');
const p = useLocalPlayer();
p.quaternion.setFromRotationMatrix(new Matrix4().lookAt(p.position, mirror.position, new Vector3(0, 1, 0)));

/* Command: Move/place/put the sun .5m in front of the moon. To do that, copy the position and quaternion and add the offset vector. */
const sun = getAppByName('sun');
const moon = getAppByName('moon');
sun.position.copy(moon.position).add(new Vector3(0, 0, -.5).applyQuaternion(moon.quaternion));
sun.quaternion.copy(moon.quaternion);

/* Command: male character looks at the emerald */
getAppByName('male').lookAt(getAppByName('emerald').position);

/* Command: Spawn explosions (./explosion.glb) at random positions within 9.2 meters of me every half a second (500ms). */
metaversefile.load(createModule(`\
const r = () => (-0.5+Math.random())*2;
let lastTimestamp = performance.now();
useFrame(({timestamp, timeDiff}) => {
  if ((timestamp - lastTimestamp) > 1000/2) {
    const p = useLocalPlayer();
    const explosion = createApp({
      name: 'explosion'
      start_url: './explosion.glb',
    });
    explosion.position.copy(p.position).add(new Vector3(r(), r(), r()).multiplyScalar(9.2));
    addApp(explosion);
    lastTimestamp = timestamp;
  }
});
`));

/* Command: damage nearest model for 30 hp */
const p = useLocalPlayer();
const model = getAppsByTypes(['glb', 'vrm']).reduce((a, b) => b.distanceTo(p.position) < a.distanceTo(p.position) ? b : a);
model.hit(30);

/* Command: load rainbow dash from ipfs hash QmPZJULb8wAui3TUBPwPHGWG1Xngb1QyDJeJSmkQeexs8J. IPFS hashes start with Q */
const ipfsObject = createApp({
  name: 'rainbow dash',
  start_url: 'ipfs://QmPZJULb8wAui3TUBPwPHGWG1Xngb1QyDJeJSmkQeexs8J',
  in_front: true,
});
addApp(ipfsObject);

/* Command: Load Ethereum token (contractAddress tokenId)=(0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b 7). Ethereum addresses start with 0x */
const ethObject = createApp({
  name: 'token',
  start_url: 'eth://0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b/7',
  in_front: true,
});
addApp(ethObject);

/* Command: make the island move slowly upward in the scene. also make it 0.3m right every 2.1 seconds */
metaversefile.load(createModule(`\
const island = getAppByName('island');
let lastTimestamp = performance.now();
useFrame(({timestamp}) => {
  island.position.y += 0.01;
  if ((timestamp - lastTimestamp) >= 2.1*1000) {
    island.position.x += 0.3;
    lastTimestamp = timestamp;
  }
});
`));

/* Command: make a ball model (https://example.com/ball.glb) that moves up and down in the scene in a sine wave */
metaversefile.load(createModule(`\
const ball = createApp({
  name: 'ball',
  start_url: 'https://example.com/ball.glb',
  type: 'glb',
  in_front: true,
});
addApp(ball);
useFrame(({timestamp}) => {
  ball.position.y = Math.sin((timestamp%1000)/1000*Math.PI*2);
});
`));

/* Command: move the ball away from me each frame */
metaversefile.load(createModule(`\
const b = getAppByName('ball');
useFrame(({timestamp}) => {
  b.position.add(b.position.clone().sub(useLocalPlayer().position).normalize().multiplyScalar(0.02));
});
`));

/* Command: move the ball each frame: right to left for 0.5s, then left to right for 0.5s */
metaversefile.load(createModule(`\
const ballApp = getAppByName('ball');
useFrame(({timestamp}) => {
  if ((timestamp % 1000) < 1000/2)) {
    ballApp.position.x -= 0.02;
  } else {
    ballApp.position.x += 0.02;
  }
});
`));

/* Command: use useFrame to rotate the poster clockwise at 3 rotations per second */
metaversefile.load(createModule(`\
const poster = getAppByName('poster');
const axis = new Vector3(0, 1, 0);
useFrame(({timestamp}) => {
  const dt = 1000/3;
  poster.quaternion.setFromAxisAngle(axis, (timestamp%dt)/dt*Math.PI*2);
});
`));

/* Command: 