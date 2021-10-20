import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame} = metaversefile;

const size = 0.5;
const scale = 0.3;
const q90 = new THREE.Quaternion()
  .setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 1, 0)
  );
  
const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const arrowGeometry = new THREE.PlaneBufferGeometry(size, size)
  .applyMatrix4(
    new THREE.Matrix4()
      .makeRotationFromQuaternion(
        new THREE.Quaternion()
          .setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)
      )
  );
const arrowMaterial = (() => {
  const u = `${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}_Down Tap Note 16x16.png`;
  (async () => {
    const img = await new Promise((accept, reject) => {
      const img = new Image();
      img.onload = () => {
        accept(img);
      };
      img.onerror = reject;
      img.crossOrigin = 'Anonymous';
      img.src = u;
    });
    tex.image = img;
    tex.needsUpdate = true;
  })();
  const tex = new THREE.Texture();
  // tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      tex: {
        type: 't',
        value: tex,
        needsUpdate: true,
      },
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;
      varying vec2 vUv;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        vUv = uv;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;
      #define PI 3.1415926535897932384626433832795
      uniform sampler2D tex;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float t = floor(uTime * 16. * 16.);
        float x = mod(t, 16.);
        // float y = floor((uTime - x) / 16.);
        float y = 0.;
        vec2 uv = (vUv / 16.0) + vec2(x, y)/16.;
        gl_FragColor = texture2D(tex, uv);
        if (gl_FragColor.a < 0.9) {
          discard;
        }
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });
  return material;
})();
const tailMaterial = (() => {
  const u = `${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}tail.png`;
  (async () => {
    const img = await new Promise((accept, reject) => {
      const img = new Image();
      img.onload = () => {
        // document.body.appendChild(img);
        accept(img);
      };
      img.onerror = reject;
      img.crossOrigin = 'Anonymous';
      img.src = u;
    });
    tex.image = img;
    tex.needsUpdate = true;
  })();
  const tex = new THREE.Texture();
  // tex.minFilter = THREE.NearestFilter;
  // tex.magFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      tex: {
        type: 't',
        value: tex,
        needsUpdate: true,
      },
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;
      varying vec2 vUv;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        vUv = uv;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;
      #define PI 3.1415926535897932384626433832795
      uniform sampler2D tex;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        // gl_FragColor = vec4(1., 0., 0., 1.);
        gl_FragColor = texture2D(tex, vec2(vUv.x, vUv.y + uTime));
        // gl_FragColor.rgb *= 1. + vUv.y;
        // gl_FragColor.a = pow(vUv.y, 0.5);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  return material;
})();

export default () => {
  const app = useApp();

  const mesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
  mesh.scale.setScalar(scale);
  mesh.frustumCulled = false;
  // mesh.visible = false;
  // console.log('got bounding box', boundingBox);
  app.add(mesh);

  const tailMesh = (() => {
    const width = 0.47;
    const height = width*1245/576;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(2 * 3 * 64);
    const positionsAttribute = new THREE.BufferAttribute(positions, 3);
    geometry.setAttribute('position', positionsAttribute);
    const uvs = new Float32Array(positions.length/3*2);
    const uvsAttribute = new THREE.BufferAttribute(uvs, 2);
    geometry.setAttribute('uv', uvsAttribute);
    const indices = new Uint16Array(positions.length/3);
    const indexAttribute = new THREE.BufferAttribute(indices, 1);
    geometry.setIndex(indexAttribute);
    let positionIndex = 0;
    let indexIndex = 0;
    let maxIndexIndex = 0;
    const tailMesh = new THREE.Mesh(geometry, tailMaterial);
    // tailMesh.position.y = -height/2;
    // tailMesh.drawMode = THREE.TriangleStripDrawMode;
    tailMesh.frustumCulled = false;
    /* tailMesh.update = () => {
      localVector.copy(mesh.position)
        .add(
          localVector2.set(-width*scale/2, 0, 0)
            .applyQuaternion(mesh.quaternion)
          )
        .toArray(positions, positionIndex);
      positionIndex += 3;
      localVector.copy(mesh.position)
        .add(
          localVector2.set(width*scale/2, 0, 0)
            .applyQuaternion(mesh.quaternion)
          )
        .toArray(positions, positionIndex);
      positionIndex += 3;

      for (let i = positionIndex/3 - 2; i < positionIndex/3; i++) {
        if (i % 2 === 0) {
          indices[indexIndex++] = i;
          indices[indexIndex++] = i+1;
          indices[indexIndex++] = i+2;
        } else {
          indices[indexIndex++] = i+2;
          indices[indexIndex++] = i+1;
          indices[indexIndex++] = i;
        }
      }
      
      positionsAttribute.needsUpdate = true;
      indexAttribute.needsUpdate = true;
      
      // maxPositionIndex = Math.max(positionIndex, maxPositionIndex);
      maxIndexIndex = Math.max(indexIndex, maxIndexIndex);
      geometry.setDrawRange(0, maxIndexIndex);
      positionIndex = positionIndex % positions.length;
    }; */
    const points = [];
    let index = 0;
    tailMesh.update = () => {
      const p = mesh.position.clone();
      const q = mesh.quaternion.clone();
      points.push({
        position: p,
        quaternion: q,
        index: index++,
      });
      while (points.length > 16) {
        points.shift();
      }
      
      if (points.length >= 2) {
        let positionIndex = 0;
        let uvIndex = 0;
        let indexIndex = 0;
        for (let i = points.length-1; i >= 0; i--) {
          const {position, quaternion, index} = points[i];
          localVector.copy(position)
            .add(
              localVector2.set(-width*scale/2, 0, 0)
                .applyQuaternion(quaternion)
              )
            .toArray(positions, positionIndex);
          positionIndex += 3;
          localVector.copy(position)
            .add(
              localVector2.set(width*scale/2, 0, 0)
                .applyQuaternion(quaternion)
              )
            .toArray(positions, positionIndex);
          positionIndex += 3;
          
          if (i % 2 === 0) {
            indices[indexIndex++] = i;
            indices[indexIndex++] = i+1;
            indices[indexIndex++] = i+2;
          } else {
            indices[indexIndex++] = i+2;
            indices[indexIndex++] = i+1;
            indices[indexIndex++] = i;
          }
          
          const y = -index * 0.2;
          uvs[uvIndex++] = 0;
          uvs[uvIndex++] = y;
          uvs[uvIndex++] = 1;
          uvs[uvIndex++] = y;
        }
        positionsAttribute.needsUpdate = true;
        uvsAttribute.needsUpdate = true;
        indexAttribute.needsUpdate = true;
        geometry.setDrawRange(0, indexIndex);
      }
    };
    return tailMesh;
  })();
  app.add(tailMesh);

  // const angle = new THREE.Euler(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2, 'YXZ');
  // const direction = new THREE.Euler(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2, 'YXZ');
  let azimuth = Math.PI/2;
  let inclination = 1;
  const r = 0.3;
  let da = 0;
  let di = 0.2;
  const lastPosition = new THREE.Vector3(0, 0, 1);
  useFrame(({timestamp}) => {
    mesh.position.set(
      r * Math.cos(azimuth) * Math.sin(inclination),
      r * Math.sin(azimuth) * Math.sin(inclination),
      r * Math.cos(inclination)
    );
    mesh.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        lastPosition,
        mesh.position,
        localVector3.copy(mesh.position)
          .multiplyScalar(-1)
      )
    ).multiply(q90);
    lastPosition.copy(mesh.position);
    azimuth += da;
    azimuth %= Math.PI*2;
    inclination += di;
    inclination %= Math.PI*2;
    /* mesh.quaternion.setFromEuler(angle);
    mesh.position.set(0, 0, -1).applyQuaternion(mesh.quaternion);
    angle.x += direction.x * 0.01;
    angle.y += direction.y * 0.01;
    angle.z += direction.z * 0.01; */
    
	  mesh.material.uniforms.uTime.value = (timestamp % 30000) / 30000;
    mesh.material.uniforms.uTime.needsUpdate = true;
	  // tailMesh.material.uniforms.uTime.value = (timestamp % 1000) / 1000;
    // tailMesh.material.uniforms.uTime.needsUpdate = true;
    tailMesh.update();
	});

  return app;
};
