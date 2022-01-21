import * as THREE from 'three';
import Webaverse from './webaverse.js';
import {getRenderer, scene, camera, orthographicCamera} from './renderer.js';
import {world} from './world.js';
import * as universe from './universe.js';
import {parseQuery, parseExtents, isInIframe} from './util.js';
import {homeScnUrl, rarityColors} from './constants.js';

const cameraPosition = new THREE.Vector3(0, 100, 0);
const cameraTarget = new THREE.Vector3(cameraPosition.x, 0, cameraPosition.z);
const perspectiveOffset = new THREE.Vector3(2, 0, -5);
const iframed = isInIframe();
// const loadDelayTime = 5000;

// renderer.setPixelRatio(window.devicePixelRatio);
camera.up.set(0, 0, -1);

(async () => {
  const weba = new Webaverse();
  await weba.waitForLoad();
  weba.bindCanvas(document.createElement('canvas'));
  
  const [
    appResult,
    parcelsJson,
  ] = await Promise.all([
    (async () => {
      await world.addObject(homeScnUrl);
    })(),
    (async () => {
      return await universe.getParcels();
    })(),
  ]);
  
  const renderer = getRenderer();
  
  const q = parseQuery(location.search);
  const extents = parseExtents(q.e);
  if (extents) {
    const rarity = q.r;

    const center = extents.getCenter(new THREE.Vector3());
    const size = extents.getSize(new THREE.Vector3());
    const geometry = new THREE.PlaneBufferGeometry(size.x, size.z)
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(size.x/2, 0, size.z/2));
    const s = 4;
    const rarityColor = rarityColors[rarity] || rarityColors.legendary;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        /* uColor: {
          type: 'c',
          value: new THREE.Vector3(rarityColors.legendary[0]),
        }, */
        /* uTopLeft: {
          type: 'v3',
          value: extents.min.clone(),
          needsUpdate: true,
        }, */
      },
      vertexShader: `\
        #define PI 3.1415926535897932384626433832795

        attribute float y;
        attribute vec3 barycentric;
        attribute float dynamicPositionY;
        // uniform float uBeat2;
        varying float vUv;
        varying vec3 vBarycentric;
        varying vec3 vPosition;

        void main() {
          vUv = uv.x;
          vBarycentric = barycentric;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position /* + vec3(0., dynamicPositionY * uBeat2, 0.) */, 1.0);
        }
      `,
      fragmentShader: `\
        // uniform float uBeat;
        precision highp float;
        precision highp int;

        #define PI 3.1415926535897932384626433832795

        // uniform vec3 uTopLeft;
        varying vec3 vBarycentric;
        varying vec3 vPosition;

        const vec3 lineColor1 = vec3(${new THREE.Color(rarityColor[0]).toArray().join(', ')});
        const vec3 lineColor2 = vec3(${new THREE.Color(rarityColor[1]).toArray().join(', ')});

        float edgeFactor(vec3 bary, float width) {
          // vec3 bary = vec3(vBC.x, vBC.y, 1.0 - vBC.x - vBC.y);
          vec3 d = fwidth(bary);
          vec3 a3 = smoothstep(d * (width - 0.5), d * (width + 0.5), bary);
          return min(min(a3.x, a3.y), a3.z);
        }

        void main() {
          vec3 c = mix(lineColor1, lineColor2, vPosition.y / 10.);
          // vec3 p = fwidth(vPosition);
          vec3 p = vPosition/${s.toFixed(8)};
          float f = min(mod(p.x, 1.), mod(p.z, 1.));
          f = min(f, mod(1.-p.x, 1.));
          f = min(f, mod(1.-p.z, 1.));
          // f *= 10.;
          gl_FragColor = vec4(c /* * uBeat */, /*0.7 + */max(1. - f, 0.));
        }
      `,
      side: THREE.DoubleSide,
      depthTest: false,
      transparent: true,
    });
    
    const extentMesh = new THREE.Mesh(geometry, material);
    extentMesh.position.set(extents.min.x, 0, extents.min.z)
    scene.add(extentMesh);
  }

  // fixes a glitch where the first render has black opaque
  weba.render();

  const _getContainerMetrics = () => new THREE.Vector2(parseInt(container.style.left || '0', 10), parseInt(container.style.top || '0', 10));

  const container = document.getElementById('container');

  const {dst} = q;
  // setTimeout(async () => { // wait for load; should really be a lock
    // console.time('render');
    if (!dst) {
      const width = 256;
      const height = 256;
      const tileScale = 32;
      let zoom = 1;

      renderer.setSize(width, height);
      
      camera.aspect = width/height;
      camera.updateProjectionMatrix();
    
      const containerSize = 10000;
      const boundingBox = document.body.getBoundingClientRect();
      container.style.width = `${containerSize}px`;
      container.style.height = `${containerSize}px`;
      container.style.left = `${-containerSize/2 + boundingBox.width/2}px`;
      container.style.top = `${-containerSize/2 + boundingBox.height/2}px`;

      const _getTileId = (x, z) => `tile-${x}-${z}`;
      const _renderParcel = (x, z) => {
        orthographicCamera.left = -tileScale*zoom/2;
        orthographicCamera.right = tileScale*zoom/2;
        orthographicCamera.top = tileScale*zoom/2;
        orthographicCamera.bottom = -tileScale*zoom/2;
        orthographicCamera.near = 0;
        orthographicCamera.far = 2000;
        orthographicCamera.updateProjectionMatrix();
        camera.projectionMatrix.copy(orthographicCamera.projectionMatrix);
      
        const offset = new THREE.Vector3((x + 0.5) * tileScale * zoom, 0, (z + 0.5) * tileScale * zoom);
        camera.position.copy(cameraPosition).add(offset);
        camera.lookAt(cameraTarget.clone().add(offset).add(perspectiveOffset));

        renderer.clear();
        weba.render();
      
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.style.position = 'absolute';
        canvas.id = _getTileId(x, z);
        const containerMetrics = _getContainerMetrics();
        canvas.style.left = (containerSize/2) + (x*width) + 'px';
        canvas.style.top = (containerSize/2) + (z*height) + 'px';
        const ctx = canvas.getContext('2d');
        ctx.drawImage(renderer.domElement, 0, 0, canvas.width, canvas.height);
        container.appendChild(canvas);
      };
      const _getNeededCoords = (topLeftPosition, boundingBox) => {
        const result = [];
        const maxX = Math.ceil((topLeftPosition.x + boundingBox.width)/width)*width;
        const maxZ = Math.ceil((topLeftPosition.y + boundingBox.height)/height)*height;
        for (let x = topLeftPosition.x; x < maxX; x += width) {
          for (let z = topLeftPosition.y; z < maxZ; z += height) {
            const ax = Math.floor(x/width);
            const az = Math.floor(z/height);
            result.push(new THREE.Vector2(ax, az));
          }
        }
        return result;
      };
      
      let currentTiles = [];
      const _updateTiles = () => {
        const topLeftPosition = _getContainerMetrics().multiplyScalar(-1).sub(new THREE.Vector2(containerSize/2, containerSize/2));
        const boundingBox = document.body.getBoundingClientRect();
        const neededCoords = _getNeededCoords(topLeftPosition, boundingBox);
        for (const v of neededCoords) {
          if (!currentTiles.some(t => t.equals(v))) {
            _renderParcel(v.x, v.y);
          }
        }
        for (const v of currentTiles) {
          if (!neededCoords.some(t => t.equals(v))) {
            const tileId = _getTileId(v.x, v.y);
            const tileEl = document.getElementById(tileId);
            tileEl.parentNode.removeChild(tileEl);
          }
        }
        currentTiles = neededCoords;
      };
      _updateTiles();
      
      let dragSpec = null;
      const _startDrag = e => {
        dragSpec = {
          startPosition: _getContainerMetrics(),
          startX: e.clientX,
          startY: e.clientY,
        };
        container.classList.add('dragging');
      };
      const _endDrag = () => {
        dragSpec = null;
        container.classList.remove('dragging');
        _updateTiles();
      };
      const _mousedown = e => {
        _startDrag(e);
      };
      container.addEventListener('mousedown', _mousedown);
      container.addEventListener('pointerdown', _mousedown);
      const _mouseup = e => {
        _endDrag();
      };
      window.addEventListener('mouseup', _mouseup);
      window.addEventListener('pointerup', _mouseup);
      const _mousemove = e => {
        if (dragSpec) {
          const currentX = e.clientX;
          const currentY = e.clientY;
          const diffX = e.clientX - dragSpec.startX;
          const diffY = e.clientY - dragSpec.startY;
          const newPosition = dragSpec.startPosition.clone()
            .add(new THREE.Vector2(diffX, diffY));
          container.style.left = `${newPosition.x}px`;
          container.style.top = `${newPosition.y}px`;
        }
        
        /* const containerMetrics = _getContainerMetrics();
        const clickPoint = new THREE.Vector2(
          (-containerMetrics.x - (containerSize/2) + e.clientX)/width*(tileScale*zoom) + perspectiveOffset.x,
          (-containerMetrics.y - (containerSize/2) + e.clientY)/height*(tileScale*zoom) + perspectiveOffset.z,
        );
        console.log(clickPoint.toArray().join(', ')); */
      };
      container.addEventListener('mousemove', _mousemove);
      container.addEventListener('pointermove', _mousemove);
      window.addEventListener('resize', e => {
        _updateTiles();
      });
      container.addEventListener('wheel', e => {
        const containerMetrics = _getContainerMetrics();
        const mouseWorldPosition = new THREE.Vector2(
          (-containerMetrics.x - (containerSize/2) + e.clientX)/width*(tileScale*zoom),
          (-containerMetrics.y - (containerSize/2) + e.clientY)/height*(tileScale*zoom),
        );

        zoom = Math.min(Math.max(zoom * (1 + e.deltaY * 0.001), 0.01), 20);
        container.innerHTML = '';
        currentTiles = [];

        container.style.left = `${-containerSize/2 + e.clientX - mouseWorldPosition.x*width/(tileScale*zoom)}px`;
        container.style.top = `${-containerSize/2 + e.clientY - mouseWorldPosition.y*height/(tileScale*zoom)}px`;

        _updateTiles();
        _renderAnchors();
      });
      container.addEventListener('dblclick', e => {
        const containerMetrics = _getContainerMetrics();
        const clickPoint = new THREE.Vector3(
          (-containerMetrics.x - (containerSize/2) + e.clientX)/width*(tileScale*zoom) + perspectiveOffset.x,
          2,
          (-containerMetrics.y - (containerSize/2) + e.clientY)/height*(tileScale*zoom) + perspectiveOffset.z,
        );

        const a = document.createElement('a');
        a.href = _getCoordUrl(clickPoint);
        if (iframed) {
          a.setAttribute('target', '_blank');
        }
        a.click();
      });

      // console.timeEnd('render');
      
      const _getCoordUrl = c => `https://app.webaverse.com/?c=${JSON.stringify([c.x, c.y, c.z])}`;
      const _renderAnchors = () => {
        for (const p of parcelsJson) {
          const {name} = p;
          const {rarity} = p.properties;
          const extents = JSON.parse(p.properties.extents);
          const [[x1, y1, z1], [x2, y2, z2]] = extents;
          const box = new THREE.Box3(
            new THREE.Vector3(x1, y1, z1),
            new THREE.Vector3(x2, y2, z2),
          );
          const center = box.getCenter(new THREE.Vector3());
          const div = document.createElement('a');
          div.href = _getCoordUrl(center);
          div.classList.add('parcel');
          const colors = (rarityColors[rarity] || rarityColors.legendary).map(c => new THREE.Color(c));
          div.style.background = `radial-gradient(${colors.map(c => '#' + c.getHexString()).join(', ')})`;
          div.innerHTML = `<div class=details>${p.name}</div>`;
          div.addEventListener('mousedown', e => {
            e.stopPropagation();
          });
          const localWidth = (x2-x1)*width/(tileScale*zoom);
          const localHeight = (z2-z1)*height/(tileScale*zoom);
          div.style.left = (containerSize/2) + (x1*width/(tileScale*zoom)) - (perspectiveOffset.x*width/(tileScale*zoom)) + `px`;
          div.style.top = (containerSize/2) + (z1*height/(tileScale*zoom)) - (perspectiveOffset.z*height/(tileScale*zoom)) + `px`;
          div.style.width = localWidth + `px`;
          div.style.height = localHeight + `px`;
          container.appendChild(div);
        }
      };
      _renderAnchors();
    } else {
      renderer.setPixelRatio(1);

      let {x, y, sw, sh, dw, dh} = parseQuery(location.search);

      x = parseInt(x, 10);
      y = parseInt(y, 10);
      sw = parseInt(sw, 10);
      sh = parseInt(sh, 10);
      dw = parseInt(dw, 10);
      dh = parseInt(dh, 10);

      orthographicCamera.left = -sw/2;
      orthographicCamera.right = sw/2;
      orthographicCamera.top = sh/2;
      orthographicCamera.bottom = -sh/2;
      orthographicCamera.near = 0;
      orthographicCamera.far = 2000;
      orthographicCamera.updateProjectionMatrix();
      camera.projectionMatrix.copy(orthographicCamera.projectionMatrix);

      cameraPosition.set(x, 100, y);
      cameraTarget.set(cameraPosition.x, 0, cameraPosition.z)

      camera.position.copy(cameraPosition);
      camera.lookAt(cameraTarget);

      renderer.setSize(dw, dh);

      renderer.clear();
      weba.render();
      
      document.body.appendChild(renderer.domElement);
      console.log('got el', renderer.domElement);

      const boundingBox = document.body.getBoundingClientRect();
      container.style.left = null;
      container.style.top = null;
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.left = `${boundingBox.width/2 - dw/2}px`;
      renderer.domElement.style.top = `${boundingBox.height/2 - dh/2}px`;
      container.appendChild(renderer.domElement);

      const blob = await new Promise((accept, reject) => {
        renderer.domElement.toBlob(accept);
      });

      fetch(dst, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
        },
        body: blob,
      }).then(res => res.blob());

      /* const arrayBuffer = await blob.arrayBuffer();
      window.parent.postMessage({
        method: 'result',
        result: arrayBuffer,
      }, '*', [arrayBuffer]); */
    }
  
  // }, loadDelayTime);
})();