import * as THREE from 'three';
import React, { useState, useEffect, useRef, useContext } from 'react';
import classnames from 'classnames';
import metaversefile from 'metaversefile';
const {useLocalPlayer, useLoreAIScene, useParticleSystem} = metaversefile;
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
import {snapshotMapChunk} from '../../../../scene-cruncher.js';
import {Text} from 'troika-three-text';
// import alea from '../../../../alea.js';
// import easing from '../../../../easing.js';
import musicManager from '../../../../music-manager.js';
import {chatManager} from '../../../../chat-manager.js';
import {
  makeRng,
  // numBlocksPerChunk,
  voxelPixelSize,
  chunkWorldSize,
  placeNames,
  // MapBlock,
  createMapChunk,
  createMapChunkMesh,
} from '../../../../procgen/procgen.js';
import styles from './map-gen.module.css';
import { AppContext } from '../../app';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
const localVectorX = new THREE.Vector3();
const localVectorX2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
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
        y + chunkWorldSize / 2 - h / 2
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
      chunkWorldSize / 2 - textOffset
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

    const { state, setState } = useContext( AppContext );
    const [width, setWidth] = useState(window.innerWidth);
    const [height, setHeight] = useState(window.innerHeight); 
    const [position, setPosition] = useState(new THREE.Vector3(0, 0, 0));
    const [scale, setScale] = useState(1);
    const [mouseState, setMouseState] = useState(null);
    const [mapScene, setMapScene] = useState(() => new THREE.Scene());
    const [camera, setCamera] = useState(() => new THREE.OrthographicCamera());
    const [chunks, setChunks] = useState([]);
    const [hoveredObject, setHoveredObject] = useState(null);
    const [selectedChunk, setSelectedChunk] = useState(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const [lastSelectTime, setLastSelectTime] = useState(-Infinity);
    const [chunkCache, setChunkCache] = useState(new Map());
    const [text, setText] = useState('');
    const [firedropMeshApp, setFiredropMeshApp] = useState(null);
    const [haloMeshApp, setHaloMeshApp] = useState(null);
    const [silksMeshApp, setSilksMeshApp] = useState(null);
    const [cometMeshApp, setCometMeshApp] = useState(null);
    const [flareMeshApp, setFlareMeshApp] = useState(null);
    const [magicMeshApp, setMagicMeshApp] = useState(null);
    const [limitMeshApp, setLimitMeshApp] = useState(null);
    const canvasRef = useRef();

    //

    const open = state.openedPanel === 'MapGenPanel';
    const selectedObjectName = selectedObject ? selectedObject.name : '';

    //
    
    useEffect(() => {
        if (open) {
            musicManager.playCurrentMusicName('overworld', {
                repeat: true,
            });
        } else { musicManager.stopCurrentMusic(); }
    }, [open]);

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const updateCamera = () => {
      const renderer = getRenderer();
      const pixelRatio = renderer.getPixelRatio();

      camera.position.set(-position.x / voxelPixelSize, 1, -position.z / voxelPixelSize);
      camera.quaternion.copy(downQuaternion);
      camera.scale.setScalar(pixelRatio * scale);
      camera.updateMatrixWorld();
      
      camera.left = -(width / voxelPixelSize) / 2;
      camera.right = (width / voxelPixelSize) / 2;
      camera.top = (height / voxelPixelSize) / 2;
      camera.bottom = -(height / voxelPixelSize) / 2;
      camera.near = 0;
      camera.far = 1000;
      camera.updateProjectionMatrix();
    };
    const getChunksInRange = () => {
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
    };
    const setRaycasterFromEvent = (raycaster, e) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const renderer = getRenderer();
      const pixelRatio = renderer.getPixelRatio();
      const mouse = localVector2D.set(
        (e.clientX / pixelRatio / width) * 2 - 1,
        -(e.clientY / pixelRatio / height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
    };
    const selectObject = () => {
      const now = performance.now();
      const timeDiff = now - lastSelectTime;
      const newSelectedObject = (selectedObject === hoveredObject && timeDiff > 200) ? null : hoveredObject;

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

    // open
    useEffect( () => {

        function handleKeyUp ( event ) {

            if (game.inputFocused()) return true;

              switch ( event.which ) {

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
                      const m = modules['firedrop'];
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
                      const m = modules['halo'];
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
                        const m = modules['silks'];
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
                      const m = modules['comet'];
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
                      const m = modules['flare'];
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
                      chunkWorldDepthResolution
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
                      const m = modules['magic'];
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
                      const m = modules['limit'];
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

                    if ( state.openedPanel === 'MapGenPanel' ) {

                        setState({ openedPanel: null });

                        if ( ! cameraManager.pointerLockElement ) {

                            cameraManager.requestPointerLock();

                        }

                    } else {

                        if ( cameraManager.pointerLockElement ) {

                            cameraManager.exitPointerLock();

                        }

                        setState({ openedPanel: 'MapGenPanel' });

                    }

                    return false;

                }

                case 219: { // [

                  story.startCinematicIntro();
                
                  return false;
                }

            }

            return true;

        }

        registerIoEventHandler( 'keyup', handleKeyUp );

        return () => {

            unregisterIoEventHandler( 'keyup', handleKeyUp );

        };

    }, [ state.openedPanel, firedropMeshApp, haloMeshApp, silksMeshApp, cometMeshApp, flareMeshApp, magicMeshApp, limitMeshApp ]);

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
          const dx = e.movementX;
          const dy = e.movementY;

          const renderer = getRenderer();
          const pixelRatio = renderer.getPixelRatio();
          setPosition(new THREE.Vector3(
            position.x + dx * scale / pixelRatio,
            0,
            position.z + dy * scale / pixelRatio
          ));

          setMouseState({
            x: e.clientX,
            y: e.clientY,
            moved: true,
          });
        } else {
          setRaycasterFromEvent(localRaycaster, e);

          localArray.length = 0;
          const intersections = localRaycaster.intersectObjects(mapScene.children, false, localArray);
          if (intersections.length > 0) {
            const {object} = intersections[0];

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
    }, [mouseState, chunks, position.x, position.z, scale]);

    // wheel
    useEffect(() => {
      if ( state.openedPanel === 'MapGenPanel' ) {
        function wheel(e) {
          setRaycasterFromEvent(localRaycaster, e);
          localRaycaster.ray.origin.multiplyScalar(voxelPixelSize);

          const oldScale = scale;
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
          setScale(newScale);
          setMouseState(null);

          return false;
        }
        registerIoEventHandler('wheel', wheel);
        return () => {
          unregisterIoEventHandler('wheel', wheel);
        };
      }
    }, [state.openedPanel, mouseState, position.x, position.z, scale]);

    // click
    useEffect(() => {
      function click(e) {
        if ( state.openedPanel === 'MapGenPanel' ) {
          return false;
        } else {
          return true;
        }
      }
      function mouseUp(e) {
        if ( state.openedPanel === 'MapGenPanel') {
          if (mouseState && !mouseState.moved && hoveredObject) {
            selectObject();
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
    }, [ state.openedPanel, mouseState, hoveredObject ] );

    // update chunks
    useEffect(() => {
      if ( state.openedPanel === 'MapGenPanel' ) {
        updateCamera();

        const newChunks = getChunksInRange();
        setChunks(newChunks);
      }
    }, [canvasRef, state.openedPanel, width, height, position.x, position.z, scale]);

    // render
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas && state.openedPanel === 'MapGenPanel') {
        updateCamera();

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
          renderer.render(mapScene, camera);

          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(renderer.domElement, 0, 0);

          // pop state
          renderer.setViewport(oldViewport);
        }
        world.appManager.addEventListener('frame', render);
        return () => {
          world.appManager.removeEventListener('frame', render);
        };
      }
    }, [canvasRef, state.openedPanel, width, height, chunks, position.x, position.z, scale]);

    function mouseDown(e) {
      e.preventDefault();
      e.stopPropagation();

      setMouseState({
        x: e.clientX,
        y: e.clientY,
        moved: false,
      });
    }
    function goClick(e) {
      e.preventDefault();
      e.stopPropagation();

      console.log('click go');
      return; // XXX
      if (selectedChunk) {
        const webaUrl = `weba://${selectedChunk.x},${selectedChunk.y}`;
        universe.pushUrl( `/?src=${ encodeURIComponent( webaUrl ) }` );

        setOpen(false);
      }
    }

    //

    return open ? (
        <div className={styles.mapGen} onClick={ stopPropagation }>
            <div className={classnames(styles.sidebar, selectedObject ? styles.open : null)}>
                <h1>{selectedObjectName}</h1>
                <hr />
                {selectedChunk ? (
                  <div className={styles.description}>
                    Location: {selectedChunk.x}:{selectedChunk.y}
                  </div>
                ) : null}
                <div className={styles.buttons}>
                    <button className={styles.button} onClick={goClick}>
                      Go
                    </button>
                </div>
            </div>
            <canvas
                width={width}
                height={height}
                className={styles.canvas}
                onMouseDown={mouseDown}
                ref={canvasRef}
            />
            <MiniHup text={text} />
        </div>
    ) : null;
};