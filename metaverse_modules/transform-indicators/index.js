import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer} = metaversefile;

const localVector = new THREE.Vector3();

const eKeyPosition = new THREE.Vector3(-0.45, 0.05, 0.01);
const rKeyPosition = new THREE.Vector3(0.45, 0.05, 0.01);
const fKeyPosition = new THREE.Vector3(0, 0, 0.01);
const cKeyPosition = new THREE.Vector3(0, -0.3, 0.01);
const pushArrowPosition = new THREE.Vector3(0.2, -0.2, 0.01);
const pullArrowPosition = new THREE.Vector3(0.2, -0.55, 0.01);

const keySize = 0.15;
const keyRadius = 0.0225;
const keyInnerFactor = 0.8;
const keyGeometry = new THREE.PlaneBufferGeometry(keySize, keySize);

function makeShape(shape, x, y, width, height, radius) {
  shape.absarc( x - width/2, y + height/2, radius, Math.PI, Math.PI / 2, true );
  shape.absarc( x + width/2, y + height/2, radius, Math.PI / 2, 0, true );
  shape.absarc( x + width/2, y - height/2, radius, 0, -Math.PI / 2, true );
  shape.absarc( x - width/2, y - height/2, radius, -Math.PI / 2, -Math.PI, true );
  return shape;
}

function createBoxWithRoundedEdges( width, height, radius, innerFactor) {
  const shape = makeShape(new THREE.Shape(), 0, 0, width, height, radius);
  const hole = makeShape(new THREE.Path(), 0, 0, width * innerFactor, height * innerFactor, radius);
  shape.holes.push(hole);

  const geometry = new THREE.ShapeGeometry(shape);
  return geometry;
}

const makeKeyMaterial = textureFile => {
  const texture = new THREE.Texture();
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 16;
  (async () => {
    const img = await new Promise((accept, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        accept(img);
      };
      img.onerror = reject;
      img.src = `${import.meta.url.replace(/(\/)[^\/]*$/, textureFile)}`;
    });
    texture.image = img;
    texture.needsUpdate = true;
  })();
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xFFFFFF,
    depthTest: false,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
  return material;
};

const eKeyMaterial = makeKeyMaterial('/transform-indicators/e-key.png');
const rKeyMaterial = makeKeyMaterial('/transform-indicators/r-key.png');
const fKeyMaterial = makeKeyMaterial('/transform-indicators/f-key.png');
const cKeyMaterial = makeKeyMaterial('/transform-indicators/c-key.png');

const keyCircleGeometry = createBoxWithRoundedEdges(keySize - keyRadius*2, keySize - keyRadius*2, keyRadius, keyInnerFactor);
const keyCircleMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: {
      type: 'c',
      value: new THREE.Color(0x222222),
    },
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
  },
  vertexShader: `\
    ${THREE.ShaderChunk.common}
    precision highp float;
    precision highp int;
    varying vec2 vUv;
    ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      vUv = uv;

      ${THREE.ShaderChunk.logdepthbuf_vertex}
    }
  `,
  fragmentShader: `\
    ${THREE.ShaderChunk.common}
    precision highp float;
    precision highp int;

    uniform vec3 uColor;
    varying vec2 vUv;

    const float glowDistance = 0.2;
    const float glowIntensity = 0.3;

    ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
    void main() {
      vec3 c;
      c = uColor;
      gl_FragColor = vec4(c, 1.);

      ${THREE.ShaderChunk.logdepthbuf_fragment}
    }
  `,
  transparent: true,
  depthTest: false,
  side: THREE.DoubleSide,
});

const createRotationArrowMesh = () => {
  const arrowMaterial = makeKeyMaterial('/transform-indicators/arrow.png')
  const arrowGeometry = new THREE.CylinderBufferGeometry(1, 1, 1, 32, 1, true);
  const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
  return arrowMesh;
};

const createPushArrowMesh = () => {
  const arrowMaterial = makeKeyMaterial('/transform-indicators/arrow2.png');
  const arrowGeometry = new THREE.PlaneBufferGeometry(1, 1);
  const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
  return arrowMesh;
};

export default () => {
  const app = useApp();
  
  const makeKeyMesh = keyMaterial => {
    const geometry = keyGeometry;
    const material = keyMaterial;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  };

  const makeKeyCircleMesh = () => {
    const geometry = keyCircleGeometry;
    const material = keyCircleMaterial.clone();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  };

  const eKeyMesh = makeKeyMesh(eKeyMaterial);
  eKeyMesh.position.copy(eKeyPosition);
  app.add(eKeyMesh);
  
  const eKeyCircleMesh = makeKeyCircleMesh();

  eKeyCircleMesh.position.copy(eKeyPosition);
  app.add(eKeyCircleMesh);

  const rKeyMesh = makeKeyMesh(rKeyMaterial);
  rKeyMesh.position.copy(rKeyPosition);
  app.add(rKeyMesh);
  
  const rKeyCircleMesh = makeKeyCircleMesh();
  
  rKeyCircleMesh.position.copy(rKeyPosition);
  app.add(rKeyCircleMesh);


  const pKeys = new THREE.Group()

  const fKeyMesh = makeKeyMesh(fKeyMaterial);
  fKeyMesh.position.copy(fKeyPosition);
  pKeys.add(fKeyMesh);
  
  const fKeyCircleMesh = makeKeyCircleMesh();
  
  fKeyCircleMesh.position.copy(fKeyPosition);
  pKeys.add(fKeyCircleMesh);

  
  const cKeyMesh = makeKeyMesh(cKeyMaterial);
  cKeyMesh.position.copy(cKeyPosition);
  pKeys.add(cKeyMesh);
  
  const cKeyCircleMesh = makeKeyCircleMesh();
  
  cKeyCircleMesh.position.copy(cKeyPosition);
  pKeys.add(cKeyCircleMesh);

  app.add(pKeys);

  const rotationArrowMesh = createRotationArrowMesh();
  rotationArrowMesh.scale.setScalar(0.3);
  rotationArrowMesh.rotateX(0.2);
  app.add(rotationArrowMesh);

  const pushArrowMesh = createPushArrowMesh();
  pushArrowMesh.scale.setScalar(0.3);
  // pushArrowMesh.rotateX(-Math.PI/3);
  pushArrowMesh.position.copy(pushArrowPosition);
  app.add(pushArrowMesh);

  const pullArrowMesh = createPushArrowMesh();
  pullArrowMesh.scale.setScalar(0.3);
  pullArrowMesh.rotateX(Math.PI);
  pullArrowMesh.position.copy(pullArrowPosition);
  app.add(pullArrowMesh);

  const pArrows = new THREE.Group();
  pArrows.add(pushArrowMesh, pullArrowMesh);
  pArrows.rotateX(-Math.PI/2.5);

  app.add(pArrows);

  //########################################################## for testing ####################################################################
  window.addEventListener("keydown", e => {
    if (e.key === 'e') {
      const f = 0.5;
      eKeyMesh.scale.setScalar(1 - f*0.3);
      eKeyCircleMesh.scale.setScalar(1 - f*0.2);
      eKeyCircleMesh.material.uniforms.uColor.value.set(0x42a5f5);
      eKeyCircleMesh.material.uniforms.uTime.needsUpdate = true;
      app.updateMatrixWorld();
    }
    if (e.key === 'r') {
      const f = 0.5;
      rKeyMesh.scale.setScalar(1 - f*0.3);
      rKeyCircleMesh.scale.setScalar(1 - f*0.2);
      rKeyCircleMesh.material.uniforms.uColor.value.set(0x42a5f5);
      rKeyCircleMesh.material.uniforms.uTime.needsUpdate = true;
      app.updateMatrixWorld();
    }
    if (e.key === 'f') {
      const f = 0.5;
      fKeyMesh.scale.setScalar(1 - f*0.3);
      fKeyCircleMesh.scale.setScalar(1 - f*0.2);
      fKeyCircleMesh.material.uniforms.uColor.value.set(0x42a5f5);
      fKeyCircleMesh.material.uniforms.uTime.needsUpdate = true;
      app.updateMatrixWorld();
    }
    if (e.key === 'c') {
      const f = 0.5;
      cKeyMesh.scale.setScalar(1 - f*0.3);
      cKeyCircleMesh.scale.setScalar(1 - f*0.2);
      cKeyCircleMesh.material.uniforms.uColor.value.set(0x42a5f5);
      cKeyCircleMesh.material.uniforms.uTime.needsUpdate = true;
      app.updateMatrixWorld();
    }
  });
  window.addEventListener("keyup", e => {
    if (e.key === 'e') {
      eKeyMesh.scale.setScalar(1);
      eKeyCircleMesh.scale.setScalar(1);
      eKeyCircleMesh.material.uniforms.uColor.value.set(0x222222);
      eKeyCircleMesh.material.uniforms.uTime.needsUpdate = true;
      app.updateMatrixWorld();
    }
    if (e.key === 'r') {
      rKeyMesh.scale.setScalar(1);
      rKeyCircleMesh.scale.setScalar(1);
      rKeyCircleMesh.material.uniforms.uColor.value.set(0x222222);
      rKeyCircleMesh.material.uniforms.uTime.needsUpdate = true;
      app.updateMatrixWorld();
    }
    if (e.key === 'f') {
      fKeyMesh.scale.setScalar(1);
      fKeyCircleMesh.scale.setScalar(1);
      fKeyCircleMesh.material.uniforms.uColor.value.set(0x222222);
      fKeyCircleMesh.material.uniforms.uTime.needsUpdate = true;
      app.updateMatrixWorld();
    }
    if (e.key === 'c') {
      cKeyMesh.scale.setScalar(1);
      cKeyCircleMesh.scale.setScalar(1);
      cKeyCircleMesh.material.uniforms.uColor.value.set(0x222222);
      cKeyCircleMesh.material.uniforms.uTime.needsUpdate = true;
      app.updateMatrixWorld();
    }
  });
  //##########################################################################################################################################

  useFrame(({timestamp, timeDiff}) => {
    if(app.targetApp && app.bb) {
      const timestampS = timestamp / 1000;
      const localPlayer = useLocalPlayer();
      const tPos = app.targetApp.position;
      app.position.copy(localVector.set(tPos.x, tPos.y + app.bb.max.y * 1.1, tPos.z));
      pArrows.position.set(Math.max(app.bb.max.x, app.bb.max.z), -(app.bb.min.y + app.bb.max.y) / 3, 0);
      pushArrowMesh.position.setY(pushArrowMesh.position.y + Math.sin(timestampS*10) * 0.005);
      pullArrowMesh.position.setY(pullArrowMesh.position.y - Math.sin(timestampS*10) * 0.005);
      pKeys.position.copy(pArrows.position).setX(pArrows.position.x + 0.5);
      app.lookAt(localPlayer.position);
      app.visible = true;
      rotationArrowMesh.rotateY(timeDiff / 200);
      app.updateMatrixWorld();
    } else if(!app.targetApp && app.visible) {
      app.visible = false;
    }
  });


  return app;
};