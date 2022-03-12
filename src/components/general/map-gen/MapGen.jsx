import * as THREE from 'three';
import React, { useState, useEffect, useRef } from 'react';
// import classnames from 'classnames';
// import {world} from '../../../../world.js';
// import webaverse from '../../../../webaverse.js';
import {registerIoEventHandler, unregisterIoEventHandler} from '../../../IoHandler.jsx';
import {getRenderer} from '../../../../renderer.js';
import game from '../../../../game.js';
import {world} from '../../../../world.js';
import cameraManager from '../../../../camera-manager.js';
import {Text} from 'troika-three-text';
import alea from '../../../../alea.js';
import easing from '../../../../easing.js';
import styles from './map-gen.module.css';

const names = `\
Aurora's Grove
Aurora's Glade
Aurora's Gully
Phantom SpooKs
Anima Mundi
Anima Animae
Blackglow
Trickster's Run
Winner's Target
Persephone's Garden
Cocoon Of Dreams
The Writer's Refuge
Arches Of The Sky
Gestalt's Mind Mine
Heavy Iron Mountain
The Clone Gambit
Saito's Lab
The Cull
The Outsides
The Black Lodge
The Aperture
Nobody's Place
The Undertow
Last Shelter
Symbiotic Sector
Reticulated Red
Heavenly Halcyon
Gunner's Creed
The Verge
Dusk Edge
Ghostie's Pie
Nulled Out
The Square
Psychedelic Swamp
The Hilt
Nostalgic Software Incubated
Locus Event
The Descend
Juggernaut Slope
The Dregs
Balaeric Black
Etherian Archon
The Ditch
Spice Borrent
Deep Storage Area
Walk Of Peace
Last Days
Loser's Legacy
Eastern Brink
Apocrypha Down
Neko No Mori
Neko's Dream
The System Bus
Littlesprout
May's Garden
Murky Damps
Northern Brink
The Antechamber
White Shade
Nihilanth's Corpus
Apex Ophelia
Cloudstrike Operations
Haggard Harrows
Redhart
Technologic's Ascent
Ocean of Black
Spirit Space
Harpy's Devouring
The Black Box
Robot Child's Playground
Minty Meadow
Spectral Intake
Popsickle Ravine
Bone Shield
The Asp Warren
Adventure's Start
The Spurt
Imaginarium Herbararium
Hazy Daze
Luminary Middle School
Robo-Petting Zoo
Phoenix Fountain
Noodle's Nook
Pariah's Reef
Cloud Province
Soul's Land
Totem Of Uncertainty
The Crumble
First Gate
Final Passage
Echo 7
Litta's Lab
The Cloisters
Derpy's Domain
Lumin Lycoris
Kincraft School
Rising Tides
Stormlands
Third Gate
The Borrowed
The Breach
Neuraloid Fissure
The Gamer's Gate
Aquarius Watering Hole
Artificial Asylum
Bloodsap
Fourth Wall Breaks
Hollow Moon
Vault Of The Sumner
Whisper Coven
Cliffside Camp
Habilis Succulum
Emerson's Wish
Arikibo
Permanent Shrine
Croft's Cradle
King's Sword
Summit No Suri
Laser Redeemers HQ
Fractal Fighters Guild
Reticent Canvas
Tragedy Triangle
The Undernet
Professor Uzuki's Lab
Drowned Mosses
Grovius Green
Earthcraft
Data Refuge
Esper's Hope
Rotting Garden
Anima Dormitor
Crash Site
The New View
Broken Ancient
Spicy Nights
Second Gate
Augmented Systematics Incorporated
The Spike
Berrick's Pax
Greenhart
Western Brink
The Verdants
Owl's Wisdom
Citadel Cap
Critical Cogent 6
Wink Of Time
Crystal Keep
Crystal Caves
Blind Woman's Curse
New Ophelia
Razorback Ridge
Debugging Den
Queen Ann's Forgiveness
Radiant Energies
Speed City
Brimming Waters
Ruined Ophelia
Southern Brink
Reverse Cthonia
The Gyre
Neo Nokio
Altruist's Adjuvant
The Spine Thorns
Bluehart
Market Of Good Wares
Rage Quit Planet
Luna's Light
The Diggers
The Change
The Veil
Battered Moon Brigade
Annexxion V
Eden Of Lore
Avaian Gorge
Sieve Of The Sea
Meeko Kuni Official
Corporeal Edge Arena
Pulse Of The Land
Ocean of White
The Junction
Smoothie's Corner
Abandoned Home
Kenichi's Lab
Tomekeeper's Tower
Bancore
The Quiets
The Oubliette
Yuki's Last Stand
The Slums
Ultraviolet Botanicals
The Loft
The Great Hall
Tokei Masu
Beach of the Gods
Digital Dunes
Loom Of Fate
Ouroboros Speculator
Griefer's Paradise
The Twins
Neko's Whisk
Wicked Yell
Robot's Revolution
Twilight's Reckoning
Old Fall
New Fall
Dawnfall
Duskfall
The Forge
Phansys
Yorishibe's Blocks
Final Fortress
Yggdrasil Alpha
Dank Depths
Akuma's Dojo
Cubie Cuties Online
Werewitch Club
Pegasus Dive
The Glassed
Nihon City
The Arcade
Ghosts River
Raven's Reach
Windloft Hills
Falcons Roost
The Second Station
Blob Farm
Coding Den
Orbule Of Insanity
Cosplay Realities
Ocean of Red
Bonus Stage
Lightmare Academy
Wolfspaw
Pixelscape
Riftbloom
Brimiscent Blue
Python's Gaze
Sky Limits
The Processor's Prison
Heart's Blessing
Woods Of Woe
Baby Robot Plains
The Merge
Witchy Woods
The Honor Sectum
For Sarge
Psiadic Pinnacle
Crimsonhold
Never Nether
The Crunch
The Cracks
Goofball Heights
Asahi Light
The Bunkers
Therian Intersect
Maria's Memory
Overgrowth High
Neon Soultraps
The Barrier
Sunken Citadel
The Collectivity
Novo Neuralia
Father's Landing
Fantasy Jumper
Pandemonium Rogu
The Whispule
Bog Of Blackwatch
Skyscraper Save
First Terminal
Heretic Gallows
Rodentia's Revenge
Veinrune
Sentient Storage
Cherrypaper Factory
The Aftermath Wastes
Faunic World
Rising Sun
The Ganic Corps
Sakura Tower
Blackhart
Wakaranai Zen
Ocean of Blue
Ocean of Green
Untitled
Flowery Floss
You Know Who
Dimension Test
Basilisk's Eye
Labyrinth of Octagons
Transient Borealis
Resurrection Hospital
The Aravent
Post Calm
Winged White
Myst Raine
Classified Quest Area
The Lighthouse
Kintaro's Palace
Rhythm Of The Rails
Huntress Widow
Limit Break Zone
Spinsilk
Machine Slice
Scarlet Shore
Behind The Scenes
Dreadtech Labs
Ester's Spiral
Wanderer's Rest
Dragonboom
The Regain
Bowbrace Range
Nanopasture
Life Lens
Deconstruction Site
White Mesa
Q-Games Inc
Principle of Surprise
Willow's Wail
Magic Island
Wizard Circle
Mindcrusher Source
Mindbreaker Source
Mindweaver Source
Ube Ranch
Burning Waters
Shibi Seikatsu
Flowing Faes
Hunter's Hunt 
Soldier's March
Fakes House
Dreamscrape
Codex of Creation
Juri's Revenant
Dawn's Garden
5th District Resistance
Abyssal Depths
Color Burst
Black Shade
The Stoneyard
Ruins of Betrayed
Swordplant
Big Dendron
The Obelisk
Furi Ruriko
Best Buds Hangout
Elder Rave
Club Fun
Golden Sunburst
Real Ghosts
Festive Foyer
Sugarvine Grotto
Nihonium
The Conservatory
Pillar Of Spring
Breath Of Field
Tidal Basin
Goldenrod Way
Camphor
Frozen Foothills
Hivemind Hacks
Cypress Garden
Burnt Sienna
Private Joke
The Tombs
Bugged Out
Chroma Castle
The Parley
Garden of Geometry
Spiral Garden
The Pits
Tartarus Traps
Second Star
The Cataclyst Seal
Rotten Apple
White Out
The Spiral
Scanner's Hideaway
Final State
The Locker
Dead Drop
Crystal Court
Phaedra Drifts
The Lure
Spritewood Estates
Startscrape Apartments
Junglebloom Village
Ankou's Pass
Beggars Bazaar
The Collapse
The Detour
Overloader Complex
The Crossing
Besieged Base
The Repository
The Seeker's Sanctum
Hero's End
The Den
Eternal Storage
The Containment
Holy Ground
Floating Forest
Reanimated Realm
No Land
The Tainted
The White Flag
The Black Flag
The Rainbow Flag
Aeon's Remains
The Gateway
The Alpha
The Omega
Epiphany
Sivergleam
Bella's Hill
Haunter's Hold
Ghoul's Gulch
The Gutter
Pixie Gathering
Lilypad Lane
Nectar Lush
The Nest
Seraphim Dust
The Stacks
The Heap`.split('\n');

// const border = 2;
const numBlocks = 32;
const chunkSize = 512;
const voxelSize = chunkSize / numBlocks;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localVector4D = new THREE.Vector4();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localArray = [];
// const localColor = new THREE.Color();
const localRaycaster = new THREE.Raycaster();

const downQuaternion = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -Math.PI / 2,
);

const cubicBezier = easing(0, 1, 0, 1);

function makeRng() {
  const a = Array.from(arguments);
  const seed = a.join(':');
  const rng = alea(seed);
  return rng;
}
function shuffle(array, rng = Math.random) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(rng() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

class Block extends THREE.Vector3 {
  constructor(x, y) {
    super(x, y, 0);
    
    this.walls = {
      left: false,
      right: false,
      up: false,
      down: false,
    };
    this.exitTarget = false;
    this.centerTarget = false;
    this.path = false;
    this.splinePoint = false;
    this.neighbors = [];
  }
  static TYPE_INDICES = (() => {
    let iota = 0;
    return {
      exit: ++iota,
      center: ++iota,
      spline: ++iota,
      path: ++iota,
    };
  })();
  static COLORS = {
    exit: '#00F',
    center: '#F00',
    spline: '#080',
    path: '#666',
    default: '#000',
  };
  /* static INDEX_COLOR_MAP = (() => {
    let map = {};
    for (let key in Block.COLORS) {
      map[Block.TYPE_INDICES[key]] = Block.COLORS[key];
    }
    return map;
  })(); */
  getType() {
    if (this.exitTarget) {
      return 'exit';
    } else if (this.centerTarget) {
      return 'exit';
    } else if (this.splinePoint) {
      return 'spline'
    } else if (this.path) {
      return 'path';
    } else {
      return 'default';
    }
  }
  toColorString() {
    const type = this.getType();
    return Block.COLORS[type] ?? Block.COLORS.default;
  }
  toUint8() {
    const type = this.getType();
    return Block.TYPE_INDICES[type];
  }
}

const sides = [
  'left',
  'right',
  'up',
  'down',
];
/* const sideDeltas = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
}; */
const sideOffsets = {
  left: [0, 0],
  right: [1, 0],
  up: [0, 0],
  down: [0, 1],
};
const sideCrossAxes = {
  left: [0, 1],
  right: [0, 1],
  up: [1, 0],
  down: [1, 0],
};

//

const generateMap = (x, y) => {
  // generate blocks
  const blocks = new Array(numBlocks * numBlocks);

  const rng = makeRng('map', x, y);
  const r = () => -1 + 2 * rng();

  // blocks
  for (let y = 0; y < numBlocks; y++) {
    for (let x = 0; x < numBlocks; x++) {
      const index = x + y * numBlocks;
      const block = new Block(x, y);
      blocks[index] = block;
    }
  }

  // exits
  const pathCandidates = [];
  const numExits = 2 + Math.floor(rng() * (2 + 1));
  const localExits = shuffle(sides.slice(), rng).slice(0, numExits);
  for (const side of localExits) {
    let [ox, oy] = sideOffsets[side];
    ox *= numBlocks - 1;
    oy *= numBlocks - 1;

    const [cx, cy] = sideCrossAxes[side];
    const v = Math.floor(rng() * numBlocks);

    const x = ox + v * cx;
    const y = oy + v * cy;

    const block = blocks[x + y * numBlocks];
    block.exitTarget = true;
    
    pathCandidates.push(block);
  }

  // centers
  const numCenters = Math.floor(rng() * (2 + 1));
  for (let i = 0; i < numCenters; i++) {
    const x = 1 + Math.floor(rng() * (numBlocks - 2));
    const y = 1 + Math.floor(rng() * (numBlocks - 2));

    const block = blocks[x + y * numBlocks];
    block.centerTarget = true;

    pathCandidates.push(block);
  }

  const _connectBlocks = (block1, block2) => {
    const distance = Math.ceil(block1.distanceTo(block2));
    const numSplinePoints = Math.max(Math.floor(distance * 0.2), 3);
    const splinePoints = Array(numSplinePoints);

    localQuaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        block1,
        block2,
        localVector.set(0, 1, 0),
      )
    );

    for (let i = 0; i < numSplinePoints; i++) {
      const v = i / (numSplinePoints - 1);

      const point = localVector
        .copy(
          localVector2.set(block1.x, 0, block1.y)
        )
        .lerp(
          localVector3.set(block2.x, 0, block2.y),
          v
        );

      let minDistance = Math.min(
        point.distanceTo(localVector2),
        point.distanceTo(localVector3),
      );

      localVector2.set(r() * minDistance, 0, 0);
      point.add(
        localVector2
          .applyQuaternion(localQuaternion)
      );
    
      const x = Math.round(point.x);
      const y = Math.round(point.z);
      if (x >= 0 && x < numBlocks && y >= 0 && y < numBlocks) {
        splinePoints[i] = point.clone();

        const index = x + y * numBlocks;
        const block = blocks[index];
        block.splinePoint = true;
      } else {
        i--;
        continue;
      }

      block1.neighbors.push(block2);
      block2.neighbors.push(block1);
    }
    const curve = new THREE.CatmullRomCurve3(splinePoints);
    const lengths = curve.getLengths(numSplinePoints);
    let lengthSum = 0;
    for (let i = 0; i < lengths.length; i++) {
      lengthSum += lengths[i];
    }
    const curveLength = lengthSum;
    
    const numPoints = Math.ceil(curveLength) * 3;
    const points = curve.getPoints(numPoints);
    for (let i = 0; i < numPoints; i++) {
      const point = points[i];

      for (const dx of [-1, 1]) {
        const x = Math.round(point.x);
        const y = Math.round(point.z);
        if (x >= 0 && x < numBlocks && y >= 0 && y < numBlocks) {
          const index = x + y * numBlocks;
          const block = blocks[index];
          block.path = true;
        }
      }
    }
  };

  const _getUnconnectedExitTargetSpecs = () => {
    return pathCandidates.map(block => {
      const map = new Map();
      const startEntry = {
        block,
        depth: 0,
      };
      map.set(block, startEntry);
      let foundExit = false;
      let deepestEntry = startEntry;

      const _recurse = (block, depth = 0) => {
        for (const neighbor of block.neighbors) {
          if (!map.has(neighbor)) {
            const neighborEntry = {
              block: neighbor,
              depth,
            };
            map.set(neighbor, neighborEntry);
            
            if (neighbor.exitTarget) {
              foundExit = true;
            }
            if (depth > deepestEntry.depth) {
              deepestEntry = map.get(neighbor);
            }
            _recurse(neighbor, depth + 1);
          }
        }
      };
      _recurse(block);

      if (!foundExit) {
        return {
          map,
          startEntry,
          deepestEntry,
        };
      } else {
        return null;
      }
    }).filter(m => m !== null);
  };
  let unconnectedExitTargetCandidates;
  while ((unconnectedExitTargetCandidates = _getUnconnectedExitTargetSpecs()).length > 0) {
    const exitTargetCandidateIndex = Math.floor(rng() * unconnectedExitTargetCandidates.length);
    const {map, startEntry, deepestEntry} = unconnectedExitTargetCandidates[exitTargetCandidateIndex];

    const unseenPathCandidates = pathCandidates.filter(pathCandidate => {
      return !map.has(pathCandidate);
    }).sort((a, b) => {
      return a.distanceTo(deepestEntry.block) - b.distanceTo(deepestEntry.block);
    });
    /* if (unseenPathCandidates.length === 0) {
      console.warn('no candidate to go to');
      debugger;
    } */
    _connectBlocks(deepestEntry.block, unseenPathCandidates[0]);
  }
  return blocks;
};
/* const renderChunk = (canvas, blocks) => {
  const {ctx} = canvas;
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111';
  ctx.fillRect(border, border, canvas.width - 2 * border, canvas.height - 2 * border);

  for (let y = 0; y < numBlocks; y++) {
    for (let x = 0; x < numBlocks; x++) {
      const block = blocks[x + y * numBlocks];

      let fillStyle = '#000';
      if (block.exitTarget) {
        fillStyle = '#00F';
      } else if (block.centerTarget) {
        fillStyle = '#F00';
      } else if (block.splinePoint) {
        fillStyle = '#080';
      } else if (block.path) {
        fillStyle = '#666';
      }
      ctx.fillStyle = fillStyle;
      ctx.fillRect(x * voxelSize + border, y * voxelSize + border, voxelSize - border*2, voxelSize - border*2);
    }
  }
}; */

/* class Chunk {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.imageBitmap = null;
    this.readyState = 'pending';

    this.loadPromise = (async () => {
      const chunkBlocks = generateMap(this.x, this.y);

      const {ctx} = Chunk.cachedCanvas;
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      renderChunk(Chunk.cachedCanvas, chunkBlocks);
    
      this.imageBitmap = await createImageBitmap(Chunk.cachedCanvas);
      this.readyState = 'done';
    })();
  }
  static cachedCanvas = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = chunkSize;
    canvas.height = chunkSize;

    const ctx = canvas.getContext('2d');
    canvas.ctx = ctx;

    return canvas;
  })();
  waitForLoad() {
    return this.loadPromise;
  }
} */

const planeGeometry = new THREE.PlaneBufferGeometry(numBlocks, numBlocks)
  .applyMatrix4(
    new THREE.Matrix4()
      .makeRotationFromQuaternion(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
      )
  );
const vertexShader = `\
  varying vec2 vUv;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
  }
`;
const planeFragmentShader = `\
  uniform float iTime;
  uniform sampler2D map;
  uniform vec2 chunkCoords;
  uniform float uHover;
  uniform float uSelect;
  varying vec2 vUv;

  const vec3 color1 = vec3(${new THREE.Color(0x66bb6a).toArray().join(', ')});
  const vec3 color2 = vec3(${new THREE.Color(0x9ccc65).toArray().join(', ')});
  const vec3 color3 = vec3(${new THREE.Color(0xd4e157).toArray().join(', ')});
  const vec3 color4 = vec3(${new THREE.Color(0x9ccc65).toArray().join(', ')});

  bool isInRange(float v, float e) {
    return abs(v - e) <= 0.1/255.;
  }

  void main() {
    vec3 c;
    float r = texture2D(map, vUv).r;
    if (isInRange(r, ${(Block.TYPE_INDICES.exit / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(Block.COLORS.exit).toArray().map(n => n.toFixed(8)).join(', ')});
    } else if (isInRange(r, ${(Block.TYPE_INDICES.center / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(Block.COLORS.center).toArray().map(n => n.toFixed(8)).join(', ')});
    } else if (isInRange(r, ${(Block.TYPE_INDICES.spline / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(Block.COLORS.spline).toArray().map(n => n.toFixed(8)).join(', ')});
    } else if (isInRange(r, ${(Block.TYPE_INDICES.path / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(Block.COLORS.path).toArray().map(n => n.toFixed(8)).join(', ')});
    }
    gl_FragColor.rgb = c;

    // voxel border
    vec2 voxelUv = mod(vUv * ${numBlocks.toFixed(8)}, 1.);
    const float limit = 0.075;
    if (
      voxelUv.x <= limit || voxelUv.x >= (1. - limit) ||
      voxelUv.y <= limit || voxelUv.y >= (1. - limit)
    ) {
      gl_FragColor.rgb = vec3(${new THREE.Color(0x111111).toArray().map(n => n.toFixed(8)).join(', ')});
    }

    // chunk border
    float limit2 = limit/${numBlocks.toFixed(8)};
    if (
      vUv.x <= limit2 || vUv.x >= (1. - limit2) ||
      vUv.y <= limit2 || vUv.y >= (1. - limit2)
    ) {
      gl_FragColor.rgb = vec3(${new THREE.Color(0x181818).toArray().map(n => n.toFixed(8)).join(', ')});
    }
    
    gl_FragColor.gb += vUv * 0.2;
    
    if (uSelect > 0.) {
      gl_FragColor.rgb = mix(
        gl_FragColor.rgb,
        mix(
          mix(color1, color2, vUv.x),
          mix(color3, color4, vUv.x),
          vUv.y
        ),
        0.5
      );
    }

    float y = -vUv.x + uHover * 2.;
    if (vUv.y < y) {
      gl_FragColor.rgb += 0.3;
    }

    gl_FragColor.a = 1.;
  }
`;
const textFragmentShader = `\
  uniform float opacity;

  void main() {
    gl_FragColor = vec4(1., 1., 1., opacity);
  }
`;
const _makeChunkMesh = (x, y) => {
  const chunkBlocks = generateMap(x, y);
  const data = new Uint8Array(chunkBlocks.length);
  for (let i = 0; i < chunkBlocks.length; i++) {
    data[i] = chunkBlocks[i].toUint8();
  }
  const dataTexture = new THREE.DataTexture(
    data,
    numBlocks,
    numBlocks,
    THREE.RedFormat,
    THREE.UnsignedByteType
  );
  dataTexture.needsUpdate = true;
  
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: planeFragmentShader,
    uniforms: {
      iTime: {
        value: 0,
        needsUpdate: false,
      },
      uHover: {
        value: 0,
        needsUpdate: false,
      },
      uSelect: {
        value: 0,
        needsUpdate: false,
      },
      map: {
        value: dataTexture,
        needsUpdate: true,
      },
      chunkCoords: {
        value: new THREE.Vector2(x, y),
        needsUpdate: true,
      },
    },
    // transparent: true,
    // opacity: 0.5,
    // side: THREE.DoubleSide, 
  });
  const mesh = new THREE.Mesh(planeGeometry, material);
  mesh.position.set(x * numBlocks, 0, y * numBlocks);
  mesh.updateMatrixWorld();
  mesh.x = x;
  mesh.y = y;

  const _makeTextMaterial = hovered => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: textFragmentShader,
      uniforms: {
        opacity: {
          value: hovered ? 1. : 0.3,
          needsUpdate: true,
        },
      },
      // transparent: true,
      // opacity: 0.5,
      // side: THREE.DoubleSide, 
    });
  };

  let textMesh;
  {
    const rng = makeRng('name', x, y);

    textMesh = new Text();
    const materials = [
      _makeTextMaterial(false),
      _makeTextMaterial(true),
    ];
    textMesh.material = materials[+false];
    textMesh.text = names[Math.floor(rng() * names.length)];
    textMesh.font = './fonts/Plaza Regular.ttf';
    textMesh.fontSize = 2;
    textMesh.color = 0xFFFFFF;
    textMesh.anchorX = 'left';
    textMesh.anchorY = 'bottom';
    textMesh.letterSpacing = 0.1;
    // textMesh.frustumCulled = false;
    textMesh.sync(() => {
      let [x, y, w, h] = textMesh.textRenderInfo.blockBounds;
      // console.log('got text render info', w, h);
      // console.log('got sync', x, y, w, h);
      /* x *= 2;
      y *= 2;
      w *= 2;
      h *= 2; */
      w += 1;
      h += 1;
      // h = 2;
      // y = -0.1;
      // y = 0;
      labelMesh.position.set(
        x - numBlocks / 2 + w / 2,
        1,
        y - numBlocks / 2 - h / 2
      );
      labelMesh.scale.set(w, 1, h);
      labelMesh.updateMatrixWorld();
    });
    /* await new Promise(accept => {
      textMesh.sync(accept);
    }); */
    const textOffset = 0.5;
    textMesh.position.set(
      -numBlocks / 2 + textOffset,
      1,
      -numBlocks / 2 - textOffset
    );
    textMesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    mesh.add(textMesh);
    textMesh.updateWorldMatrix();
    let highlight = false;
    textMesh.setHighlight = newHighlight => {
      if (newHighlight !== highlight) {
        highlight = newHighlight;
        textMesh.material = materials[+highlight];
      }
    };
  }

  let labelMesh;
  {
    const labelGeometry = new THREE.PlaneBufferGeometry(1, 1)
      .applyMatrix4(
        new THREE.Matrix4().makeRotationFromQuaternion(
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
        )
      );
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.visible = false;
    mesh.add(labelMesh);
    labelMesh.updateMatrixWorld();
  }
  
  let hovered = false;
  let lastHoveredTime = -Infinity;
  let lastUnhoveredTime = -Infinity;
  mesh.setHovered = newHovered => {
    hovered = newHovered;
    textMesh.setHighlight(hovered || selected);
  };
  let selected = false;
  mesh.setSelected = newSelected => {
    selected = newSelected;
    textMesh.setHighlight(hovered || selected);
    labelMesh.visible = selected;
  };
  mesh.update = (timestamp, timeDiff) => {
    const t = timestamp - (hovered ? lastUnhoveredTime : lastHoveredTime);
    const tS = t / 1000;
    const v = cubicBezier(tS);
    material.uniforms.uHover.value = hovered ? v : 1-v;
    material.uniforms.uHover.needsUpdate = true;

    material.uniforms.uSelect.value = selected ? 1 : 0;
    material.uniforms.uSelect.needsUpdate = true;

    // console.log('set hovered', t);

    if (hovered) {
      lastHoveredTime = timestamp;
    } else {
      lastUnhoveredTime = timestamp;
    }
  };

  return mesh;
};

export const MapGen = ({
  app,
}) => {
    const [width, setWidth] = useState(window.innerWidth);
    const [height, setHeight] = useState(window.innerHeight); 
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(new THREE.Vector3(0, 0, 0));
    const [scale, setScale] = useState(1);
    const [mouseState, setMouseState] = useState(null);
    const [scene, setScene] = useState(() => new THREE.Scene());
    const [camera, setCamera] = useState(() => new THREE.OrthographicCamera());
    const [chunks, setChunks] = useState([]);
    const [hoveredObject, setHoveredObject] = useState(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const [chunkCache, setChunkCache] = useState(new Map());
    const canvasRef = useRef();

    const getChunksInRange = () => {
      const chunks = [];
      for (let y = -height/2 - chunkSize; y < height/2 + chunkSize; y += chunkSize) {
        for (let x = -width/2 - chunkSize; x < width/2 + chunkSize; x += chunkSize) {
          const ix = Math.round((x - position.x) / chunkSize);
          const iy = Math.round((y - position.z) / chunkSize);

          const key = `${ix}:${iy}`;
          let chunk = chunkCache.get(key);
          if (!chunk) {
            chunk = _makeChunkMesh(ix, iy);
            scene.add(chunk);
            chunkCache.set(key, chunk);
          }
          chunks.push(chunk);
        }
      }
      return chunks;
    };

    // open
    useEffect(() => {
      function keydown(e) {
        switch (e.which) {
          case 77: { // M
            const newOpen = !open;
            
            newOpen && window.dispatchEvent( new CustomEvent( 'CloseAllMenus', { detail: { dispatcher: 'MapGen' } } ) );
            
            if (newOpen && cameraManager.pointerLockElement) {
              cameraManager.exitPointerLock();
            } else if (!newOpen && !cameraManager.pointerLockElement) {
              cameraManager.requestPointerLock();
            }
            
            setOpen(newOpen);

            return false;
          }
          default: {
            return true;
          }
        }
      }
      registerIoEventHandler('keydown', keydown);
      return () => {
        unregisterIoEventHandler('keydown', keydown);
      };
    }, [open]);

    // close open conflicts
    useEffect(() => {
      const handleOnFocusLost = () => {

        if (open) {

          setOpen(false);
        
        }

      };
      window.addEventListener('CloseAllMenus', handleOnFocusLost);
      
      return () => {
        window.removeEventListener('CloseAllMenus', handleOnFocusLost);
      };
    }, [open]);

    // resize
    useEffect(() => {
      function resize(e) {
        setWidth(window.innerWidth);
        setHeight(window.innerHeight);
      }
      window.addEventListener('resize', resize);
      return () => {
        window.removeEventListener('resize', resize);
      };
    }, [width, height]);

    // mousemove
    useEffect(() => {
      function mouseMove(e) {
        if (mouseState) {
          const dx = e.clientX - mouseState.x;
          const dy = e.clientY - mouseState.y;

          setPosition(new THREE.Vector3(
            position.x + dx,
            0,
            position.z + dy
          ));

          setMouseState({
            x: e.clientX,
            y: e.clientY,
            moved: true,
          });
        } else {
          const width = window.innerWidth;
          const height = window.innerHeight;
          const renderer = getRenderer();
          const pixelRatio = renderer.getPixelRatio();
          const mouse = localVector2D.set(
            (e.clientX / pixelRatio / width) * 2 - 1,
            - (e.clientY / pixelRatio / height) * 2 + 1
          );
          localRaycaster.setFromCamera(mouse, camera);

          localArray.length = 0;
          const intersections = localRaycaster.intersectObjects(scene.children, false, localArray);
          if (intersections.length > 0) {
            // window.intersections = intersections;
            const {object} = intersections[0];

            const chunks = getChunksInRange();
            for (const chunk of chunks) {
              chunk.setHovered(chunk === object);
            }

            setHoveredObject(object);
          } else {
            setHoveredObject(null);
          }
        }
      }
      // listen on document to handle mouse move outside of window
      document.addEventListener('mousemove', mouseMove);
      return () => {
        document.removeEventListener('mousemove', mouseMove);
      };
    }, [mouseState]);

    // wheel
    useEffect(() => {
      function wheel(e) {
        // const {deltaY} = e;
        // console.log('wheel', e, e.deltaY, e.deltaX);

        // const dx = e.deltaX / 150;
        // const dy = e.deltaY / 300;
        
        const oldScale = scale;
        const newScale = Math.min(Math.max(scale * (1 + e.deltaY * 0.001), 0.01), 20);
        const scaleFactor = newScale / oldScale;
        // console.log('scale', newScale, oldScale, scaleFactor);
        
        localMatrix.compose(
          position,
          downQuaternion,
          localVector2.setScalar(scaleFactor)
        )
          .premultiply(
            localMatrix2.makeTranslation(-position.x, 0, -position.z)
          )
          .premultiply(
            localMatrix2.makeScale(scaleFactor, scaleFactor, scaleFactor)
          )
          .premultiply(
            localMatrix2.makeTranslation(position.x, 0, position.z)
          )
          .decompose(localVector, localQuaternion, localVector2);
      
        setPosition(localVector.clone());
        setScale(newScale);
      }
      document.addEventListener('wheel', wheel);
      return () => {
        document.removeEventListener('wheel', wheel);
      };
    }, [mouseState, position.x, position.z, scale]);

    // click
    useEffect(() => {
      function click(e) {
        if (open) {
          return false;
        } else {
          return true;
        }
      }
      function mouseUp(e) {
        if (open) {
          if (mouseState && !mouseState.moved && hoveredObject) {
            const newSelectedObject = selectedObject === hoveredObject ? null : hoveredObject;

            for (const chunk of chunks) {
              chunk.setSelected(chunk === newSelectedObject);
            }

            setSelectedObject(newSelectedObject);
          }
          
          setMouseState(null);
          return false;
        } else {
          return true;
        }
      }
      registerIoEventHandler('click', click);
      registerIoEventHandler('mouseup', mouseUp);
      return () => {
        unregisterIoEventHandler('click', click);
        unregisterIoEventHandler('mouseup', mouseUp);
      };
    }, [open, mouseState, hoveredObject]);

    // update chunks
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas && open) {
        const newChunks = getChunksInRange();

        const renderer = getRenderer();
        const pixelRatio = renderer.getPixelRatio();

        camera.position.set(-position.x / voxelSize, 1, -position.z / voxelSize);
        camera.quaternion.copy(downQuaternion);
        camera.scale.setScalar(pixelRatio * scale);
        camera.updateMatrixWorld();
        
        camera.left = -(width / voxelSize) / 2;
        camera.right = (width / voxelSize) / 2;
        camera.top = (height / voxelSize) / 2;
        camera.bottom = -(height / voxelSize) / 2;
        camera.near = -10;
        camera.far = 10;
        camera.updateProjectionMatrix();

        setChunks(newChunks);
      }
    }, [canvasRef, open, width, height, position.x, position.z, scale]);

    // render
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas && open) {
        const ctx = canvas.getContext('2d');

        async function render(e) {
          const {timestamp, timeDiff} = e.data;
          const renderer = getRenderer();
          
          // push state
          const oldViewport = renderer.getViewport(localVector4D);

          for (const chunk of chunks) {
            chunk.update(timestamp, timeDiff);
          }

          renderer.setViewport(0, 0, width, height);
          // renderer.setClearColor(0xFF0000, 1);
          renderer.clear();
          renderer.render(scene, camera);

          ctx.drawImage(renderer.domElement, 0, 0);

          // pop state
          renderer.setViewport(oldViewport);
        }
        world.appManager.addEventListener('frame', render);
        return () => {
          world.appManager.removeEventListener('frame', render);
        };
      }
    }, [canvasRef, open, width, height, chunks]);

    function mouseDown(e) {
      e.preventDefault();
      e.stopPropagation();

      setMouseState({
        x: e.clientX,
        y: e.clientY,
        moved: false,
      });
    }

    return (
        <div className={styles.mapGen}>
            {open ? (
                <canvas
                  width={width}
                  height={height}
                  className={styles.canvas}
                  onMouseDown={mouseDown}
                  ref={canvasRef}
                />
            ) : null}
            
        </div>
    );
};