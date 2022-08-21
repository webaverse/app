import * as THREE from 'three';
import React, {useState, useEffect, useRef, useContext} from 'react';
import classnames from 'classnames';
import metaversefile from 'metaversefile';
// import {world} from '../../../../world.js';
// import webaverse from '../../../../webaverse.js';
import {registerIoEventHandler, unregisterIoEventHandler} from '../io-handler';
import {MiniHup} from '../../../MiniHup.jsx';
// import {RpgText} from '../../../RpgText.jsx';
import {getRenderer, rootScene, scene, sceneLowPriority} from '../../../../renderer.js';
import game from '../../../../game.js';
import {world} from '../../../../world.js';
import universe from '../../../../universe.js';
import cameraManager from '../../../../camera-manager.js';
import story from '../../../../story.js';
// import raycastManager from '../../../../raycast-manager.js';
import {snapshotMapChunk} from '../../../../scene-cruncher.js';
import {Text} from 'troika-three-text';
// import alea from '../../../../alea.js';
// import easing from '../../../../easing.js';
import musicManager from '../../../../music-manager.js';
import {buildMaterial} from '../../../../shaders.js';
import {chatManager} from '../../../../chat-manager.js';
import physicsManager from '../../../../physics-manager.js';
import {
  makeRng,
  // numBlocksPerChunk,
  // voxelPixelSize,
  chunkWorldSize,
  placeNames,
  // MapBlock,
  createMapChunk,
  createMapChunkMesh,
} from '../../../../procgen/procgen.js';
import styles from './map-gen.module.css';
import {AppContext} from '../../app';
const {useLocalPlayer, useLoreAIScene} = metaversefile;

//

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
// const localVectorX = new THREE.Vector3();
// const localVectorX2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localVector4D = new THREE.Vector4();
const localMatrix = new THREE.Matrix4();
// const localMatrix2 = new THREE.Matrix4();
// const localArray = [];
// const localColor = new THREE.Color();
const localRaycaster = new THREE.Raycaster();
const localPlane = new THREE.Plane();

//

const fakeGeometry = new THREE.BufferGeometry();
const forwardDirection = new THREE.Vector3(0, 0, -1);
const oneVector = new THREE.Vector3(1, 1, 1);
const zeroVector = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);
const downQuaternion = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -Math.PI / 2,
);
const renderY = 60;

//

const seed = 'lol';
const physicsInstance = 'map';
const physicsScene = physicsManager.getScene(physicsInstance);

const voxelPixelSize = 16;

//

const vertexShader = `\
  varying vec2 vUv;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
  }
`;

const textFragmentShader = `\
  uniform float opacity;

  void main() {
    gl_FragColor = vec4(1., 1., 1., opacity);
  }
`;
const _makeChunkMesh = (x, y) => {
  const mapChunk = createMapChunk(undefined, x, y);
  const {blocks} = mapChunk;
  const data = new Uint8Array(blocks.length);
  for (let i = 0; i < blocks.length; i++) {
    data[i] = blocks[i].toUint8();
  }

  const mesh = createMapChunkMesh(x, y, data);
  mesh.position.set(x * chunkWorldSize, 0, y * chunkWorldSize);
  mesh.updateMatrixWorld();

  const rng = makeRng('name', x, y);
  const name = placeNames[Math.floor(rng() * placeNames.length)];
  mesh.name = name;
  mesh.x = x;
  mesh.y = y;

  const _makeTextMaterial = hovered => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: textFragmentShader,
      uniforms: {
        opacity: {
          value: hovered ? 1.0 : 0.3,
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
    textMesh = new Text();
    const materials = [
      _makeTextMaterial(false),
      _makeTextMaterial(true),
    ];
    textMesh.material = materials[+false];
    textMesh.text = name;
    textMesh.font = './fonts/Plaza Regular.ttf';
    textMesh.fontSize = 8;
    textMesh.color = 0xFFFFFF;
    textMesh.anchorX = 'left';
    textMesh.anchorY = 'bottom';
    textMesh.letterSpacing = 0.1;
    // textMesh.frustumCulled = false;
    textMesh.sync(() => {
      let [x, y, w, h] = textMesh.textRenderInfo.blockBounds;
      w += 1;
      h += 1;
      labelMesh.position.set(
        x - chunkWorldSize / 2 + w / 2,
        1,
        y + chunkWorldSize / 2 - h / 2,
      );
      labelMesh.scale.set(w, 1, h);
      labelMesh.updateMatrixWorld();
    });
    /* await new Promise(accept => {
      textMesh.sync(accept);
    }); */
    const textOffset = 0.5;
    textMesh.position.set(
      -chunkWorldSize / 2 + textOffset,
      1,
      chunkWorldSize / 2 - textOffset,
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
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
        ),
      );
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.visible = false;
    mesh.add(labelMesh);
    labelMesh.updateMatrixWorld();
  }

  mesh.setHovered = (setHovered => function() {
    setHovered.apply(this, arguments);
    textMesh.setHighlight(mesh.hovered || mesh.selected);
  })(mesh.setHovered);
  mesh.setSelected = (setSelected => function() {
    setSelected.apply(this, arguments);
    textMesh.setHighlight(mesh.hovered || mesh.selected);
    labelMesh.visible = mesh.selected;
  })(mesh.setSelected);

  return mesh;
};

export const MapGen = () => {
  const {state, setState} = useContext(AppContext);
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  // const [position, setPosition] = useState(() => new THREE.Vector3(0, 100, 0));
  // const [quaternion, setQuaternion] = useState(() => downQuaternion.clone());
  // const [target, setTarget] = useState(() => position.clone().add(new THREE.Vector3(0, 0, -10).applyQuaternion(quaternion)));
  // const [scale, setScale] = useState(1);
  const [mouseState, setMouseState] = useState(null);
  const [mapScene, setMapScene] = useState(() => new THREE.Scene());
  const [camera, setCamera] = useState(() => {
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10 * 1000);
    camera.position.y = 100;
    camera.quaternion.copy(downQuaternion);
    camera.updateMatrixWorld();
    return camera;
  });
    // const [chunks, setChunks] = useState([]);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [lastSelectTime, setLastSelectTime] = useState(-Infinity);
  // const [chunkCache, setChunkCache] = useState(new Map());
  const [text, setText] = useState('');
  const [firedropMeshApp, setFiredropMeshApp] = useState(null);
  const [haloMeshApp, setHaloMeshApp] = useState(null);
  const [silksMeshApp, setSilksMeshApp] = useState(null);
  const [cometMeshApp, setCometMeshApp] = useState(null);
  const [flareMeshApp, setFlareMeshApp] = useState(null);
  const [magicMeshApp, setMagicMeshApp] = useState(null);
  const [limitMeshApp, setLimitMeshApp] = useState(null);
  const [terrainApp, setTerrainApp] = useState(null);
  const [hoveredPhysicsMesh, setHighlightPhysicsMesh] = useState(null);
  const [selectedPhysicsMesh, setSelectedPhysicsMesh] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const [hoveredPhysicsObject, setHoveredPhysicsObject] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPhysicsObject, setSelectedPhysicsObject] = useState(null);

  const [animation, setAnimation] = useState(null);

  const canvasRef = useRef();

  //

  const open = state.openedPanel === 'MapGenPanel';
  const selectedObjectName = selectedObject ? selectedObject.name : '';

  // const renderer = getRenderer();
  // const pixelRatio = renderer.getPixelRatio();
  const pixelRatio = window.devicePixelRatio;

  //

  /* useEffect(() => {
        if (open) {
            musicManager.playCurrentMusicName('overworld', {
                repeat: true,
            });
        } else { musicManager.stopCurrentMusic(); }
    }, [open]); */

  //

  const stopPropagation = event => {
    event.stopPropagation();
  };

  const getRenderPosition = () => {
    return camera.position.clone()
      .add(new THREE.Vector3(0, 0, -16).applyQuaternion(camera.quaternion))
      .toArray();
  };
  const _updateTerrainApp = () => {
    if (terrainApp) {
      const renderPosition = getRenderPosition();
      terrainApp.setComponent('renderPosition', renderPosition);
    }
  };
  const setPosition = p => {
    camera.position.copy(p);
    camera.updateMatrixWorld();

    _updateTerrainApp();
  };
  const setQuaternion = q => {
    camera.quaternion.copy(q);
    camera.updateMatrixWorld();

    _updateTerrainApp();
  };
  // const updateCamera = () => {
  //   debugger;
  //   const renderer = getRenderer();
  //   // const pixelRatio = renderer.getPixelRatio();

  //   setPosition(position);
  //   setQuaternion(quaternion);
  //   // camera.scale.setScalar(pixelRatio * scale);
  //   // camera.updateMatrixWorld();

  //   /* camera.left = -(width / voxelPixelSize) / 2;
  //     camera.right = (width / voxelPixelSize) / 2;
  //     camera.top = (height / voxelPixelSize) / 2;
  //     camera.bottom = -(height / voxelPixelSize) / 2;
  //     camera.near = 0;
  //     camera.far = 10 * 1000;
  //     camera.updateProjectionMatrix(); */
  // };
  /* const getChunksInRange = () => {
      const chunks = [];
      const bottomLeft = localVectorX.set(-1, 1, 0)
        .unproject(camera)
      const topRight = localVectorX2.set(1, -1, 0)
        .unproject(camera);

      for (let y = bottomLeft.z; y < topRight.z; y += chunkWorldSize) {
        for (let x = bottomLeft.x; x < topRight.x; x += chunkWorldSize) {
          const ix = Math.round(x / chunkWorldSize);
          const iy = Math.round(y / chunkWorldSize);

          const key = `${ix}:${iy}`;
          let chunk = chunkCache.get(key);
          if (!chunk) {
            chunk = _makeChunkMesh(ix, iy);
            mapScene.add(chunk);
            chunkCache.set(key, chunk);
          }
          chunks.push(chunk);
        }
      }

      return chunks;
    }; */
  const setRaycasterFromEvent = (raycaster, e) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // const renderer = getRenderer();
    // const pixelRatio = renderer.getPixelRatio();
    const mouse = localVector2D.set(
      (e.clientX / width) * 2 - 1,
      -(e.clientY / height) * 2 + 1,
    );
    raycaster.setFromCamera(mouse, camera);
  };
  const selectObject = () => {
    const now = performance.now();
    const timeDiff = now - lastSelectTime;
    const newSelectedObject = (selectedObject === hoveredObject && timeDiff > 200) ? null : hoveredObject;

    const chunks = []; // TODO: replace this with getChunksInRange

    let selectedChunk = null;
    for (const chunk of chunks) {
      const selected = chunk === newSelectedObject;
      chunk.setSelected(selected);
      if (selected) {
        selectedChunk = chunk;
      }
    }

    setSelectedObject(newSelectedObject);
    setSelectedChunk(selectedChunk);
    setLastSelectTime(now);

    if (newSelectedObject) {
      (async () => {
        const localPlayer = useLocalPlayer();
        const aiScene = useLoreAIScene();
        const comment = await aiScene.generateLocationComment(selectedChunk.name);
        const message = `${selectedChunk.name}. ${comment}`;
        const preloadedMessage = localPlayer.voicer.preloadMessage(message);
        await chatManager.waitForVoiceTurn(() => {
          setText(message);
          return localPlayer.voicer.start(preloadedMessage);
        });
        setText('');
      })();
    }
  };

  const _addHacks = () => {
    // open
    useEffect(() => {
      function handleKeyUp(event) {
        if (game.inputFocused()) return true;

        switch (event.which) {
          case 74: { // J
            if (!firedropMeshApp) {
              const localPlayer = useLocalPlayer();
              const position = localPlayer.position.clone()
                .add(new THREE.Vector3(0, 0, -3).applyQuaternion(localPlayer.quaternion));

              const firedropMeshApp = metaversefile.createApp({
                position,
              });
              (async () => {
                const {modules} = metaversefile.useDefaultModules();
                const m = modules.firedrop;
                await firedropMeshApp.addModule(m);
              })();
              scene.add(firedropMeshApp);

              setFiredropMeshApp(firedropMeshApp);
            } else {
              firedropMeshApp.parent.remove(firedropMeshApp);
              firedropMeshApp.destroy();

              setFiredropMeshApp(null);
            }

            return false;
          }

          case 75: { // K
            if (!haloMeshApp) {
              const haloMeshApp = metaversefile.createApp();
              (async () => {
                const {modules} = metaversefile.useDefaultModules();
                const m = modules.halo;
                await haloMeshApp.addModule(m);
              })();
              scene.add(haloMeshApp);

              setHaloMeshApp(haloMeshApp);
            } else {
              haloMeshApp.parent.remove(haloMeshApp);
              haloMeshApp.destroy();

              setHaloMeshApp(null);
            }

            return false;
          }

          case 76: { // L
            if (!silksMeshApp) {
              const silksMeshApp = metaversefile.createApp();
              (async () => {
                const {modules} = metaversefile.useDefaultModules();
                const m = modules.silks;
                await silksMeshApp.addModule(m);
              })();
              scene.add(silksMeshApp);

              setSilksMeshApp(silksMeshApp);
            } else {
              silksMeshApp.parent.remove(silksMeshApp);
              silksMeshApp.destroy();

              setSilksMeshApp(null);
            }

            return false;
          }

          case 80: { // P
            if (!cometMeshApp) {
              const cometMeshApp = metaversefile.createApp();
              (async () => {
                const {modules} = metaversefile.useDefaultModules();
                const m = modules.comet;
                await cometMeshApp.addModule(m);
              })();
              scene.add(cometMeshApp);
              const localPlayer = useLocalPlayer();
              cometMeshApp.position.copy(localPlayer.position)
                .add(new THREE.Vector3(0, 3, -3).applyQuaternion(localPlayer.quaternion));
              localEuler.setFromQuaternion(localPlayer.quaternion, 'YXZ');
              localEuler.x = 0;
              localEuler.z = 0;
              cometMeshApp.quaternion.setFromEuler(localEuler);
              cometMeshApp.updateMatrixWorld();

              setCometMeshApp(cometMeshApp);
            } else {
              cometMeshApp.parent.remove(cometMeshApp);
              cometMeshApp.destroy();

              setCometMeshApp(null);
            }

            return false;
          }

          case 186: { // ;
            if (!flareMeshApp) {
              const flareMeshApp = metaversefile.createApp();
              (async () => {
                const {modules} = metaversefile.useDefaultModules();
                const m = modules.flare;
                await flareMeshApp.addModule(m);
              })();
              scene.add(flareMeshApp);

              setFlareMeshApp(flareMeshApp);
            } else {
              flareMeshApp.parent.remove(flareMeshApp);
              flareMeshApp.destroy();

              setFlareMeshApp(null);
            }

            return false;
          }
          case 222: { // '
            (async () => {
              const chunkWorldSize = new THREE.Vector3(64, 64, 64);
              const chunkWorldResolution = new THREE.Vector2(2048, 2048);
              const chunkWorldDepthResolution = new THREE.Vector2(256, 256);

              const localPlayer = useLocalPlayer();
              const mesh = snapshotMapChunk(
                rootScene,
                localPlayer.position,
                chunkWorldSize,
                chunkWorldResolution,
                chunkWorldDepthResolution,
              );
              scene.add(mesh);
            })();

            return false;
          }

          case 188: { // ,
            if (!magicMeshApp) {
              const magicMeshApp = metaversefile.createApp();
              (async () => {
                const {modules} = metaversefile.useDefaultModules();
                const m = modules.magic;
                await magicMeshApp.addModule(m);
              })();
              sceneLowPriority.add(magicMeshApp);

              setMagicMeshApp(magicMeshApp);
            } else {
              magicMeshApp.parent.remove(magicMeshApp);
              magicMeshApp.destroy();

              setMagicMeshApp(null);
            }

            return false;
          }

          case 190: { // .
            if (!limitMeshApp) {
              const limitMeshApp = metaversefile.createApp();
              (async () => {
                const {modules} = metaversefile.useDefaultModules();
                const m = modules.limit;
                await limitMeshApp.addModule(m);
              })();
              sceneLowPriority.add(limitMeshApp);

              setLimitMeshApp(limitMeshApp);
            } else {
              limitMeshApp.parent.remove(limitMeshApp);
              limitMeshApp.destroy();

              setLimitMeshApp(null);
            }

            return false;
          }

          case 77: { // M
            // if (state.openedPanel === 'MapGenPanel') {
            //   setState({openedPanel: null});

            //   if (!cameraManager.pointerLockElement) {
            //     cameraManager.requestPointerLock();
            //   }
            // } else {
            //   if (cameraManager.pointerLockElement) {
            //     cameraManager.exitPointerLock();
            //   }

            //   setState({openedPanel: 'MapGenPanel'});
            // }

            return false;
          }

          case 219: { // [
            story.startCinematicIntro();

            return false;
          }
        }

        return true;
      }

      registerIoEventHandler('keyup', handleKeyUp);

      return () => {
        unregisterIoEventHandler('keyup', handleKeyUp);
      };
    }, [state.openedPanel, firedropMeshApp, haloMeshApp, silksMeshApp, cometMeshApp, flareMeshApp, magicMeshApp, limitMeshApp]);
  };
  _addHacks();

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
      // console.log('mouse move', !!mouseState);
      if (mouseState) {
        const totalX = mouseState.startX - e.clientX;
        const totalY = mouseState.startY - e.clientY;

        // console.log('move button', e.button, e.buttons, e);
        if (
          !!(mouseState.buttons & 1) || // left click
            (e.shiftKey && !!(mouseState.buttons & 4)) // shift + right click
        ) {
          const {forwardTarget} = mouseState;

          const backDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion);
          localPlane.setFromNormalAndCoplanarPoint(backDirection, forwardTarget);

          const oldEvent = {
            clientX: mouseState.x,
            clientY: mouseState.y,
          };
          setRaycasterFromEvent(localRaycaster, oldEvent);

          const startIntersectionPoint = localRaycaster.ray.intersectPlane(localPlane, localVector);

          setRaycasterFromEvent(localRaycaster, e);
          const endIntersectionPoint = localRaycaster.ray.intersectPlane(localPlane, localVector2);

          if (startIntersectionPoint && endIntersectionPoint) {
            const intersectionDelta = endIntersectionPoint.clone().sub(startIntersectionPoint);
            const p = camera.position.clone()
              .sub(intersectionDelta);
            setPosition(p);
          }

          /* const p = position.clone()
              .add(new THREE.Vector3(-dx, dy, 0).applyQuaternion(quaternion));
            setPosition(p); */
        } else if (mouseState.buttons & 4) { // middle click
          // setRaycasterFromEvent(localRaycaster, e);

          // const dx = e.movementX;
          // const dy = e.movementY;

          const {startPosition, startQuaternion, forwardTarget} = mouseState;
          // const offset = startPosition.clone().sub(forwardTarget);
          // const offsetNegative = offset.clone().negate();
          /* const target = position.clone()
              .add(offset.clone().applyQuaternion(quaternion)); */
          // localEuler.setFromQuaternion(quaternion, 'YXZ');
          localEuler.setFromQuaternion(startQuaternion, 'YXZ');
          localEuler.x += totalY * Math.PI * 2 * 0.001;
          localEuler.y += totalX * Math.PI * 2 * 0.001;
          localQuaternion.setFromEuler(localEuler);
          // .multiply(startQuaternion);

          const d = startPosition.distanceTo(forwardTarget);

          const p = forwardTarget.clone()
            .add(
              new THREE.Vector3(0, 0, d)
                .applyQuaternion(localQuaternion),
            );
          const q = localQuaternion.clone(); /* new THREE.Quaternion().setFromRotationMatrix(
              localMatrix.lookAt(
                p,
                forwardTarget,
                upVector
              )
            ); */

          setPosition(p);
          setQuaternion(q);
        } else if (mouseState.buttons & 2) { // right click
          /* const p = position.clone();
            const q = quaternion.clone();

            setPosition(p);
            setQuaternion(q); */
        }

        setMouseState({
          x: e.clientX,
          y: e.clientY,
          // totalX,
          // totalY,
          startX: mouseState.startX,
          startY: mouseState.startY,
          buttons: mouseState.buttons,
          startPosition: mouseState.startPosition,
          startQuaternion: mouseState.startQuaternion,
          forwardTarget: mouseState.forwardTarget,
          moved: true,
        });
      } else {
        let physicsObject = null;
        let hoveredPoint = null;

        // console.log('try hit', !!terrainApp, !!hoveredPhysicsMesh);
        if (terrainApp) {
          setRaycasterFromEvent(localRaycaster, e);

          localQuaternion.setFromUnitVectors(forwardDirection, localRaycaster.ray.direction);
          const raycastResult = physicsScene.raycast(localRaycaster.ray.origin, localQuaternion);
          if (raycastResult) {
            // window.raycastResult = raycastResult;
            const physicsId = raycastResult.objectId;
            const physicsObjects = terrainApp.getPhysicsObjects();
            physicsObject = physicsObjects.find(physicsObject => physicsObject.physicsId === physicsId);
            if (physicsObject) {
              hoveredPoint = new THREE.Vector3().fromArray(raycastResult.point);
            }
          }
        }

        setHoveredPhysicsObject(physicsObject);
        setHoveredPoint(hoveredPoint);

        /* localArray.length = 0;
          const intersections = localRaycaster.intersectObjects(mapScene.children, false, localArray);
          if (intersections.length > 0) {
            const {object} = intersections[0];

            for (const chunk of chunks) {
              chunk.setHovered(chunk === object);
            }

            setHoveredObject(object);
          } else {
            setHoveredObject(null);
          } */
      }
    }
    // listen on document to handle mouse move outside of window
    document.addEventListener('mousemove', mouseMove);
    return () => {
      document.removeEventListener('mousemove', mouseMove);
    };
  }, [
    mouseState,
    /* chunks, */
    terrainApp,
    // position.x, position.y, position.z,
    // quaternion.x, quaternion.y, quaternion.z, quaternion.w,
    // target.x, target.y, target.z,
    // scale,
  ]);

  // physics objects
  useEffect(() => {
    if (hoveredPhysicsMesh) {
      if (hoveredPhysicsObject) {
        const {physicsMesh} = hoveredPhysicsObject;
        const timestamp = performance.now();

        hoveredPhysicsMesh.geometry = physicsMesh.geometry;
        hoveredPhysicsMesh.matrixWorld.copy(physicsMesh.matrixWorld)
          .decompose(hoveredPhysicsMesh.position, hoveredPhysicsMesh.quaternion, hoveredPhysicsMesh.scale);

        hoveredPhysicsMesh.material.uniforms.uTime.value = (timestamp % 1500) / 1500;
        hoveredPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
        hoveredPhysicsMesh.material.uniforms.uColor.value.setHex(buildMaterial.uniforms.uColor.value.getHex());
        hoveredPhysicsMesh.material.uniforms.uColor.needsUpdate = true;
        hoveredPhysicsMesh.visible = true;
        hoveredPhysicsMesh.updateMatrixWorld();
      } else {
        hoveredPhysicsMesh.visible = false;
      }
    }
  }, [hoveredPhysicsMesh, hoveredPhysicsObject]);

  useEffect(() => {
    if (selectedPhysicsMesh) {
      if (selectedPhysicsObject) {
        const {physicsMesh} = selectedPhysicsObject;
        const timestamp = performance.now();

        selectedPhysicsMesh.geometry = physicsMesh.geometry;
        selectedPhysicsMesh.matrixWorld.copy(physicsMesh.matrixWorld)
          .decompose(selectedPhysicsMesh.position, selectedPhysicsMesh.quaternion, selectedPhysicsMesh.scale);

        selectedPhysicsMesh.material.uniforms.uTime.value = (timestamp % 1500) / 1500;
        selectedPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
        selectedPhysicsMesh.material.uniforms.uColor.value.setHex(0x66bb6a);
        selectedPhysicsMesh.material.uniforms.uColor.needsUpdate = true;
        selectedPhysicsMesh.visible = true;
        selectedPhysicsMesh.updateMatrixWorld();
      } else {
        selectedPhysicsMesh.visible = false;
      }
    }
  }, [selectedPhysicsMesh, selectedPhysicsObject]);

  // wheel
  useEffect(() => {
    if (state.openedPanel === 'MapGenPanel') {
      function wheel(e) {
        if (!mouseState) {
          setRaycasterFromEvent(localRaycaster, e);
          // localRaycaster.ray.origin.multiplyScalar(voxelPixelSize);

          /* const target = localRaycaster.ray.origin.clone()
              .add(localRaycaster.ray.direction.clone().multiplyScalar(3)); */

          const backDirection = localRaycaster.ray.direction.clone()
            .multiplyScalar(-1);
            // console.log('got back direction', backDirection.toArray().join(','));
          const p = camera.position.clone()
            .add(backDirection.clone().multiplyScalar(e.deltaY * 0.1));
          setPosition(p);

          /* const oldScale = scale;
            const newScale = Math.min(Math.max(scale * (1 + e.deltaY * 0.001), 0.01), 20);
            const scaleFactor = newScale / oldScale;

            localMatrix.compose(
              position,
              downQuaternion,
              localVector2.setScalar(scaleFactor)
            )
              .premultiply(
                localMatrix2.makeTranslation(localRaycaster.ray.origin.x, 0, localRaycaster.ray.origin.z)
              )
              .premultiply(
                localMatrix2.makeScale(scaleFactor, scaleFactor, scaleFactor)
              )
              .premultiply(
                localMatrix2.makeTranslation(-localRaycaster.ray.origin.x, 0, -localRaycaster.ray.origin.z)
              )
              .decompose(localVector, localQuaternion, localVector2);

            setPosition(localVector.clone());
            setScale(newScale); */

          setPosition(p);
          setMouseState(null);
        }

        return false;
      }
      registerIoEventHandler('wheel', wheel);
      return () => {
        unregisterIoEventHandler('wheel', wheel);
      };
    }
  }, [state.openedPanel, mouseState]);

  // click
  useEffect(() => {
    /* function click(e) {
        console.log('click', e);
        if ( state.openedPanel === 'MapGenPanel' ) {
          return false;
        } else {
          return true;
        }
      } */
    function dblclick(e) {
      // console.log('dbl click', e);
      if (state.openedPanel === 'MapGenPanel') {
        setSelectedPhysicsObject(hoveredPhysicsObject);

        if (hoveredPhysicsObject) {
          const {physicsMesh} = hoveredPhysicsObject;
          const {geometry} = physicsMesh;
          const {boundingBox} = geometry;

          // window.hoveredPhysicsObject = hoveredPhysicsObject;

          const center = boundingBox.getCenter(new THREE.Vector3());
          const offset = camera.position.clone().sub(center);

          const endPosition = center.clone()
            .add(
              offset.clone()
                .normalize()
                .multiplyScalar(16 * 2),
            );
          /* .add(
                new THREE.Vector3(0, 16/2, 0)
              ); */
          const endQuaternion = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4()
              .lookAt(
                camera.position,
                center,
                upVector,
              ),
          );

          const now = performance.now();
          const startTime = now;
          const endTime = startTime + 1000;
          const animation = {
            startTime,
            endTime,
            startPosition: camera.position.clone(),
            startQuaternion: camera.quaternion.clone(),
            endPosition,
            endQuaternion,
          };
          setAnimation(animation);
        } else {
          setAnimation(null);
        }

        return false;
      } else {
        return true;
      }
    }
    function mouseUp(e) {
      if (state.openedPanel === 'MapGenPanel') {
        if (mouseState && !mouseState.moved) {
          const chunk = terrainApp?.getChunkForPhysicsObject(hoveredPhysicsObject);
          if (chunk) {
            // console.log('got chunk', chunk, hoveredPhysicsObject);
            setSelectedPhysicsObject(selectedPhysicsObject !== hoveredPhysicsObject ? hoveredPhysicsObject : null);
          } else {
            // console.log('did not get chunk', hoveredPhysicsObject);
            setSelectedPhysicsObject(null);
          }
        }
        setMouseState(null);
        return false;
      } else {
        return true;
      }
    }
    // registerIoEventHandler('click', click);
    registerIoEventHandler('dblclick', dblclick);
    registerIoEventHandler('mouseup', mouseUp);
    return () => {
      // unregisterIoEventHandler('click', click);
      unregisterIoEventHandler('dblclick', dblclick);
      unregisterIoEventHandler('mouseup', mouseUp);
    };
  }, [state.openedPanel, terrainApp, mouseState, /* hoveredObject, */ hoveredPhysicsObject, selectedPhysicsObject]);

  // initialize terrain
  useEffect(() => {
    (async () => {
      if (state.openedPanel === 'MapGenPanel' && !loaded) {
        setLoaded(true);

        // lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        mapScene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(1, 2, 3);
        mapScene.add(directionalLight);

        // highlight physics meshes
        const hoveredPhysicsMesh = new THREE.Mesh(
          fakeGeometry,
          buildMaterial.clone(),
        );
        hoveredPhysicsMesh.frustumCulled = false;
        mapScene.add(hoveredPhysicsMesh);
        setHighlightPhysicsMesh(hoveredPhysicsMesh);

        const selectedPhysicsMesh = new THREE.Mesh(
          fakeGeometry,
          buildMaterial.clone(),
        );
        selectedPhysicsMesh.frustumCulled = false;
        mapScene.add(selectedPhysicsMesh);
        setSelectedPhysicsMesh(selectedPhysicsMesh);

        // apps
        await Promise.all([
          (async () => {
            // street base
            const streetBaseApp = await metaversefile.createAppAsync({
              start_url: '../street-base/',
              components: {
                seed: 'lol',
              },
            });
            mapScene.add(streetBaseApp);
            // setStreetBaseApp(streetBaseApp);
          })(),
          (async () => {
            // terrain app
            const terrainApp = await metaversefile.createAppAsync({
              start_url: '../metaverse_modules/land/',
              components: {
                seed,
                physicsInstance,
                renderPosition: getRenderPosition(),
                minLodRange: 3,
                lods: 3,
              },
            });
            mapScene.add(terrainApp);
            setTerrainApp(terrainApp);
          })(),
        ]);
      }
    })();
  }, [state.openedPanel, loaded]);

  // update camera
  useEffect(() => {
    if (state.openedPanel === 'MapGenPanel') {
      // updateCamera();

      // const newChunks = getChunksInRange();
      // setChunks(newChunks);
    }
  }, [
    canvasRef,
    state.openedPanel,
    width, height,
    // position.x, position.y, position.z,
    // quaternion.x, quaternion.y, quaternion.z, quaternion.w,
    // scale,
  ]);

  // render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && state.openedPanel === 'MapGenPanel') {
      // updateCamera();

      const ctx = canvas.getContext('2d');

      function update() {
        if (animation) {
          const now = performance.now();
          const factor = (now - animation.startTime) / (animation.endTime - animation.startTime);

          setPosition(
            animation.startPosition.clone()
              .lerp(animation.endPosition, factor),
          );
          setQuaternion(
            animation.startQuaternion.clone()
              .slerp(animation.endQuaternion, factor),
          );
          // camera.updateMatrixWorld();

          if (factor >= 1) {
            setAnimation(null);
          }
        }
      }
      function render(e) {
        // const {timestamp, timeDiff} = e.data;

        update();

        // push state
        const renderer = getRenderer();
        const oldViewport = renderer.getViewport(localVector4D);

        /* for (const chunk of chunks) {
            chunk.update(timestamp, timeDiff);
          } */

        renderer.setViewport(0, 0, width, height);
        // renderer.setClearColor(0xFF0000, 1);
        renderer.clear();
        renderer.render(mapScene, camera);

        ctx.clearRect(0, 0, width * pixelRatio, height * pixelRatio);
        ctx.drawImage(renderer.domElement, 0, 0);

        // pop state
        renderer.setViewport(oldViewport);
      }
      world.appManager.addEventListener('frame', render);
      return () => {
        world.appManager.removeEventListener('frame', render);
      };
    }
  }, [canvasRef, state.openedPanel, width, height, /* chunks, */ animation]);

  function mouseDown(e) {
    e.preventDefault();
    e.stopPropagation();

    const maxDistance = 100;

    const startPosition = camera.position.clone();
    const startQuaternion = camera.quaternion.clone();
    const forwardTarget = (() => {
      if (hoveredPoint) {
        const distance = camera.position.distanceTo(hoveredPoint);
        return camera.position.clone()
          .add(new THREE.Vector3(0, 0, -distance).applyQuaternion(camera.quaternion));
      } else {
        localPlane.setFromNormalAndCoplanarPoint(upVector, localVector.set(0, renderY, 0));
        setRaycasterFromEvent(localRaycaster, e);
        const startIntersectionPoint = localRaycaster.ray.intersectPlane(localPlane, localVector);
        const distance = startIntersectionPoint ? camera.position.distanceTo(startIntersectionPoint) : Infinity;
        if (distance < maxDistance) {
          return camera.position.clone()
            .add(new THREE.Vector3(0, 0, -distance).applyQuaternion(camera.quaternion));
        } else {
          return camera.position.clone()
            .add(new THREE.Vector3(0, 0, -maxDistance).applyQuaternion(camera.quaternion));
        }
      }
    })();

    // console.log('new mouse state');
    setMouseState({
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      buttons: e.buttons,
      startPosition,
      startQuaternion,
      forwardTarget,
      moved: false,
    });
    setAnimation(null);
  }
  function goClick(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log('click go');
    // if (selectedChunk) {
    //   const webaUrl = `weba://${selectedChunk.x},${selectedChunk.y}`;
    //   universe.pushUrl(`/?src=${encodeURIComponent(webaUrl)}`);

    //   setOpen(false);
    // }
  }

  //

  return open
    ? (
    <div className={styles.mapGen} onClick={ stopPropagation }>
      <div className={classnames(styles.sidebar, selectedObject ? styles.open : null)}>
        <h1>{selectedObjectName}</h1>
        <hr />
        {selectedChunk
          ? (
          <div className={styles.description}>
                    Location: {selectedChunk.x}:{selectedChunk.y}
          </div>
            )
          : null}
        <div className={styles.buttons}>
          <button className={styles.button} onClick={goClick}>
                      Go
          </button>
        </div>
      </div>
      <canvas
        width={width * pixelRatio}
        height={height * pixelRatio}
        className={styles.canvas}
        onMouseDown={mouseDown}
        ref={canvasRef}
      />
      <MiniHup text={text} />
    </div>
      )
    : null;
};
