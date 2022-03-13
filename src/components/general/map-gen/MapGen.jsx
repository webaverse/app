import * as THREE from 'three';
import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
// import {world} from '../../../../world.js';
// import webaverse from '../../../../webaverse.js';
import {registerIoEventHandler, unregisterIoEventHandler} from '../../../IoHandler.jsx';
import {MiniHup} from '../../../MiniHup.jsx';
import {getRenderer} from '../../../../renderer.js';
// import game from '../../../../game.js';
import {world} from '../../../../world.js';
import cameraManager from '../../../../camera-manager.js';
import {Text} from 'troika-three-text';
// import alea from '../../../../alea.js';
import easing from '../../../../easing.js';
import {
  makeRng,
  numBlocks,
  voxelSize,
  placeNames,
  MapBlock,
  createMapChunk,
} from '../../../../procgen/procgen.js';
import styles from './map-gen.module.css';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVectorX = new THREE.Vector3();
const localVectorX2 = new THREE.Vector3();
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

//

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
    if (isInRange(r, ${(MapBlock.TYPE_INDICES.exit / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(MapBlock.COLORS.exit).toArray().map(n => n.toFixed(8)).join(', ')});
    } else if (isInRange(r, ${(MapBlock.TYPE_INDICES.center / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(MapBlock.COLORS.center).toArray().map(n => n.toFixed(8)).join(', ')});
    } else if (isInRange(r, ${(MapBlock.TYPE_INDICES.spline / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(MapBlock.COLORS.spline).toArray().map(n => n.toFixed(8)).join(', ')});
    } else if (isInRange(r, ${(MapBlock.TYPE_INDICES.path / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(MapBlock.COLORS.path).toArray().map(n => n.toFixed(8)).join(', ')});
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
    const float limit2 = limit/${numBlocks.toFixed(8)};
    if (
      vUv.x <= limit2 || vUv.x >= (1. - limit2) ||
      vUv.y <= limit2 || vUv.y >= (1. - limit2)
    ) {
      if (uSelect > 0. && mod(iTime * 0.01, 2.) < 1.) {
        gl_FragColor.rgb = vec3(1.);
      } else {
        gl_FragColor.rgb = vec3(${new THREE.Color(0x181818).toArray().map(n => n.toFixed(8)).join(', ')});
      }
    }

    const float limit3 = 0.005;
    if (
      (
        vUv.x <= limit3 || vUv.x >= (1. - limit3) ||
        vUv.y <= limit3 || vUv.y >= (1. - limit3)
      ) && (
        uSelect > 0. &&
        mod(iTime * 0.01, 2.) < 1.
      )
    ) {
      gl_FragColor.rgb = vec3(1.);
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
  const chunkBlocks = createMapChunk(x, y);
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
    textMesh.fontSize = 2;
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
        x - numBlocks / 2 + w / 2,
        1,
        y + numBlocks / 2 - h / 2
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
      numBlocks / 2 - textOffset
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
    material.uniforms.iTime.value = timestamp;
    material.uniforms.iTime.needsUpdate = true;

    const t = timestamp - (hovered ? lastUnhoveredTime : lastHoveredTime);
    const tS = t / 1000;
    const v = cubicBezier(tS);
    material.uniforms.uHover.value = hovered ? v : 1-v;
    material.uniforms.uHover.needsUpdate = true;

    material.uniforms.uSelect.value = selected ? 1 : 0;
    material.uniforms.uSelect.needsUpdate = true;

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
    const [lastSelectTime, setLastSelectTime] = useState(-Infinity);
    const [chunkCache, setChunkCache] = useState(new Map());
    const canvasRef = useRef();

    const updateCamera = () => {
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

      for (let y = bottomLeft.z; y < topRight.z; y += numBlocks) {
        for (let x = bottomLeft.x; x < topRight.x; x += numBlocks) {
          const ix = Math.round(x / numBlocks);
          const iy = Math.round(y / numBlocks);

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

      for (const chunk of chunks) {
        chunk.setSelected(chunk === newSelectedObject);
      }

      setSelectedObject(newSelectedObject);
      setLastSelectTime(now);
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
          const intersections = localRaycaster.intersectObjects(scene.children, false, localArray);
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
      function wheel(e) {
        setRaycasterFromEvent(localRaycaster, e);
        localRaycaster.ray.origin.multiplyScalar(voxelSize);

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
    }, [open, mouseState, hoveredObject]);

    // update chunks
    useEffect(() => {
      if (open) {
        updateCamera();

        const newChunks = getChunksInRange();
        setChunks(newChunks);
      }
    }, [canvasRef, open, width, height, position.x, position.z, scale]);

    // render
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas && open) {
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
          renderer.render(scene, camera);

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
    }, [canvasRef, open, width, height, chunks, position.x, position.z, scale]);

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

      // console.log('click go', selectedObjectName);
    }

    const selectedObjectName = selectedObject ? selectedObject.name : '';

    return open ? (
        <div className={styles.mapGen}>
            <div className={classnames(styles.sidebar, selectedObject ? styles.open : null)}>
                <h1>{selectedObjectName}</h1>
                <hr />
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
            <MiniHup />
        </div>
    ) : null;
};