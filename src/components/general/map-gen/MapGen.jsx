import * as THREE from 'three';
import React, { useState, useEffect, useRef } from 'react';
// import classnames from 'classnames';
// import {world} from '../../../../world.js';
// import webaverse from '../../../../webaverse.js';
import alea from '../../../../alea.js';
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
The Heap`;

const numChunks = 32;
const mapSize = 512;
const chunkSize = mapSize / numChunks;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localVector4D = new THREE.Vector4();
const localMatrix = new THREE.Matrix4();
const localColor = new THREE.Color();

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
}

const sides = [
  'left',
  'right',
  'up',
  'down',
];
const sideDeltas = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};
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

export const MapGen = ({
  app,
}) => {
    const [epoch, setEpoch] = useState(0);
    const canvasRef = useRef();

    useEffect(() => {
      function maphackchange(e) {
        setEpoch(epoch + 1)
      }
      app.addEventListener('maphackchange', maphackchange);
      return () => {
        app.removeEventListener('maphackchange', maphackchange);
      };
    }, [epoch]);

    useEffect(() => {
      if (canvasRef.current) {
        // generate blocks
        const blocks = new Array(numChunks * numChunks);
        {
          const rng = alea('lol' + epoch);
          const r = () => -1 + 2 * rng();

          // blocks
          for (let y = 0; y < numChunks; y++) {
            for (let x = 0; x < numChunks; x++) {
              const index = x + y * numChunks;
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
            ox *= numChunks - 1;
            oy *= numChunks - 1;

            const [cx, cy] = sideCrossAxes[side];
            const v = Math.floor(rng() * numChunks);

            const x = ox + v * cx;
            const y = oy + v * cy;

            const block = blocks[x + y * numChunks];
            block.exitTarget = true;
            
            pathCandidates.push(block);
          }

          // centers
          const numCenters = Math.floor(rng() * (2 + 1));
          for (let i = 0; i < numCenters; i++) {
            const x = 1 + Math.floor(rng() * (numChunks - 2));
            const y = 1 + Math.floor(rng() * (numChunks - 2));

            const block = blocks[x + y * numChunks];
            block.centerTarget = true;

            pathCandidates.push(block);
          }

          const _connectBlocks = (block1, block2) => {
            const distance = Math.ceil(block1.distanceTo(block2));
            const numSplinePoints = Math.max(Math.floor(distance * 0.2), 3);
            const splinePoints = Array(numSplinePoints);
            // const point = new THREE.Vector3(0, 0, 0);
            // const direction = new THREE.Vector3(0, 0, -1);

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

              // const distanceRange = distance * 0.5;
              let minDistance = Math.min(
                point.distanceTo(localVector2),
                point.distanceTo(localVector3),
                // distanceRange,
              );
              // minDistance *= 0.5;

              localVector2.set(r() * minDistance, 0, 0);
              // console.log('offset', localVector2.x);
              point.add(
                localVector2
                  .applyQuaternion(localQuaternion)
              );

              // point.add(localVector.copy(direction).multiplyScalar(segmentLength));
            
              const x = Math.round(point.x);
              const y = Math.round(point.z);
              if (x >= 0 && x < numChunks && y >= 0 && y < numChunks) {
                splinePoints[i] = point.clone();

                const index = x + y * numChunks;
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
            // curve.updateArcLengths();
            const lengths = curve.getLengths(numSplinePoints);
            let lengthSum = 0;
            for (let i = 0; i < lengths.length; i++) {
              lengthSum += lengths[i];
            }
            const curveLength = lengthSum;
            
            const numPoints = Math.ceil(curveLength) * 3;
            // console.log('num points', numSplinePoints, curveLength, numPoints);
            const points = curve.getPoints(numPoints);
            // const frenetFrames = curve.computeFrenetFrames(numPoints);
            // const {tangents, normals, binormals} = frenetFrames;
            // const lengths = curve.getLengths(numPoints);
            for (let i = 0; i < numPoints; i++) {
              const point = points[i];
              /* const tangent = tangents[i];
              localQuaternion.setFromRotationMatrix(
                localMatrix.lookAt(
                  localVector.set(0, 0, 0),
                  tangent,
                  localVector2.set(0, 1, 0),
                )
              ); */
              /* const normal = normals[i];
              const binormal = binormals[i];
              const length = lengths[i]; */

              for (const dx of [-1, 1]) {
                const x = Math.round(point.x);
                const y = Math.round(point.z);
                if (x >= 0 && x < numChunks && y >= 0 && y < numChunks) {
                  const index = x + y * numChunks;
                  const block = blocks[index];
                  block.path = true;
                }
              }
            }
          };

          // paths
          /* const unconnectedPathCandidates = pathCandidates.slice();
          while (unconnectedPathCandidates.length > 0) {
            let localPathCandidates = unconnectedPathCandidates;
            if (localPathCandidates.length === 0) {
              debugger;
            }
            const index1 = Math.floor(rng() * localPathCandidates.length);
            const block1 = localPathCandidates[index1];
            localPathCandidates.splice(index1, 1);

            const localPathCandidates2 = pathCandidates.filter(pathCandidate => {
              return pathCandidate !== block1 && pathCandidate.neighbors.indexOf(block1) === -1;
            });
            if (localPathCandidates2.length === 0) {
              debugger;
            }
            localPathCandidates2.sort((a, b) => {
              return a.distanceTo(block1) - b.distanceTo(block1);
            });
            const index2 = 0;
            const block2 = localPathCandidates2[index2];

            _connectBlocks(block1, block2);
          } */

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
        }

        // draw map
        {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          ctx.fillStyle = '#111';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const border = 2;
          for (let y = 0; y < numChunks; y++) {
            for (let x = 0; x < numChunks; x++) {
              const block = blocks[x + y * numChunks];

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
              ctx.fillRect(x * chunkSize + border, y * chunkSize + border, chunkSize - border*2, chunkSize - border*2);
            }
          }
        }
      }
    }, [canvasRef, epoch]);

    return (
        <div className={styles.mapGen}>
            {epoch > 0 ? (
                <canvas width={mapSize} height={mapSize} className={styles.canvas} ref={canvasRef} />
            ) : null}
            
        </div>
    );
};