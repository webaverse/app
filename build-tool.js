import * as THREE from './three.module.js';
import {rigManager} from './rig.js';
import physicsManager from './physics-manager.js';
import {buildMaterial} from './shaders.js';
import {appManager, renderer, scene, camera, dolly} from './app-object.js';

const texBase = 'vol_2_2';

const localVector = new THREE.Vector3();

const mesh = (() => {
  let geometry = new THREE.BoxBufferGeometry(1, 0.1, 1, 10, 1, 10);
  geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.1/2, 0));

  for (let i = 0, j = 0; i < geometry.attributes.position.array.length; i += 3, j += 2) {
    if (geometry.attributes.normal.array[i+1] === 0) {
      geometry.attributes.uv.array[j+1] = geometry.attributes.position.array[i+1];
    }
  }
  geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -0.1/2, 0));

  geometry = geometry.toNonIndexed();

  /* const barycentrics = new Float32Array(geometry.attributes.position.array.length);
  let barycentricIndex = 0;
  for (let i = 0; i < geometry.attributes.position.array.length; i += 9) {
    barycentrics[barycentricIndex++] = 1;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 1;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 1;
  }
  geometry.setAttribute('barycentric', new THREE.BufferAttribute(barycentrics, 3)); */

  const material = buildMaterial;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.order = 'YXZ';
  mesh.savedRotation = mesh.rotation.clone();
  mesh.startQuaternion = mesh.quaternion.clone();
  return mesh;
})();
mesh.visible = false;
scene.add(mesh);

const shapeMaterial = (() => {
  const map = new THREE.Texture();
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 16;
  {
    const img = new Image();
    img.onload = () => {
      map.image = img;
      map.needsUpdate = true;
    };
    img.onerror = err => {
      console.warn(err);
    };
    img.crossOrigin = 'Anonymous';
    img.src = './land-textures/' + texBase + '_Base_Color.png';
  }
  const normalMap = new THREE.Texture();
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.anisotropy = 16;
  {
    const img = new Image();
    img.onload = () => {
      normalMap.image = img;
      normalMap.needsUpdate = true;
    };
    img.onerror = err => {
      console.warn(err);
    };
    img.crossOrigin = 'Anonymous';
    img.src = './land-textures/' + texBase + '_Normal.png';
  }
  const heightMap = new THREE.Texture();
  heightMap.wrapS = THREE.RepeatWrapping;
  heightMap.wrapT = THREE.RepeatWrapping;
  heightMap.anisotropy = 16;
  {
    const img = new Image();
    img.onload = () => {
      heightMap.image = img;
      heightMap.needsUpdate = true;
    };
    img.onerror = err => {
      console.warn(err);
    };
    img.crossOrigin = 'Anonymous';
    img.src =  './land-textures/' + texBase + '_Height.png';
  }
  const material = new THREE.ShaderMaterial({
    uniforms: {
      map: {
        type: 't',
        value: map,
        needsUpdate: true,
      },
      normalMap: {
        type: 't',
        value: normalMap,
        needsUpdate: true,
      },
      bumpMap: {
        type: 't',
        value: heightMap,
        needsUpdate: true,
      },
      "parallaxScale": { value: 0.05, needsUpdate: true, },
      "parallaxMinLayers": { value: 20, needsUpdate: true, },
      "parallaxMaxLayers": { value: 25, needsUpdate: true, },
      
      /* ambientLightColor: {
        value: null,
        needsUpdate: false,
      },
      lightProbe: {
        value: null,
        needsUpdate: false,
      },
      directionalLights: {
        value: null,
        needsUpdate: false,
      },
      directionalLightShadows: {
        value: null,
        needsUpdate: false,
      },
      spotLights: {
        value: null,
        needsUpdate: false,
      },
      spotLightShadows: {
        value: null,
        needsUpdate: false,
      },
      rectAreaLights: {
        value: null,
        needsUpdate: false,
      },
      ltc_1: {
        value: null,
        needsUpdate: false,
      },
      ltc_2: {
        value: null,
        needsUpdate: false,
      },
      pointLights: {
        value: null,
        needsUpdate: false,
      },
      pointLightShadows: {
        value: null,
        needsUpdate: false,
      },
      hemisphereLights: {
        value: null,
        needsUpdate: false,
      },
      directionalShadowMap: {
        value: null,
        needsUpdate: false,
      },
      directionalShadowMatrix: {
        value: null,
        needsUpdate: false,
      },
      spotShadowMap: {
        value: null,
        needsUpdate: false,
      },
      spotShadowMatrix: {
        value: null,
        needsUpdate: false,
      },
      pointShadowMap: {
        value: null,
        needsUpdate: false,
      },
      pointShadowMatrix: {
        value: null,
        needsUpdate: false,
      }, */
    },
    vertexShader: [
      'uniform sampler2D normalMap;',
      'varying vec2 vUv;',
      'varying vec3 vViewPosition;',
      'varying vec3 vNormal;',

      'void main() {',

      '	vUv = uv;',
      '	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
      '	vViewPosition = -mvPosition.xyz;',
      // '	vNormal = normalize( texture2D( normalMap, vUv ).rgb );',
      ' vNormal = normalize( normalMatrix * normal );',
      '	gl_Position = projectionMatrix * mvPosition;',

      '}'
    ].join('\n'),
    fragmentShader: [
      '#define USE_RELIEF_PARALLAX  1',

      'uniform sampler2D bumpMap;',
      'uniform sampler2D map;',

      'uniform float parallaxScale;',
      'uniform float parallaxMinLayers;',
      'uniform float parallaxMaxLayers;',

      'varying vec2 vUv;',
      'varying vec3 vViewPosition;',
      'varying vec3 vNormal;',

      '#ifdef USE_BASIC_PARALLAX',

      '	vec2 parallaxMap( in vec3 V ) {',

      '		float initialHeight = 1. - texture2D( bumpMap, vUv ).r;',

      // No Offset Limitting: messy, floating output at grazing angles.
      //"vec2 texCoordOffset = parallaxScale * V.xy / V.z * initialHeight;",

      // Offset Limiting
      '		vec2 texCoordOffset = parallaxScale * V.xy * initialHeight;',
      '		return vUv - texCoordOffset;',

      '	}',

      '#else',

      '	vec2 parallaxMap( in vec3 V ) {',

      // Determine number of layers from angle between V and N
      '		float numLayers = mix( parallaxMaxLayers, parallaxMinLayers, abs( dot( vec3( 0.0, 0.0, 1.0 ), V ) ) );',

      '		float layerHeight = 1.0 / numLayers;',
      '		float currentLayerHeight = 0.0;',
      // Shift of texture coordinates for each iteration
      '		vec2 dtex = parallaxScale * V.xy / V.z / numLayers;',

      '		vec2 currentTextureCoords = vUv;',

      '		float heightFromTexture = 1. - texture2D( bumpMap, currentTextureCoords ).r;',

      // while ( heightFromTexture > currentLayerHeight )
      // Infinite loops are not well supported. Do a "large" finite
      // loop, but not too large, as it slows down some compilers.
      '		for ( int i = 0; i < 30; i += 1 ) {',
      '			if ( heightFromTexture <= currentLayerHeight ) {',
      '				break;',
      '			}',
      '			currentLayerHeight += layerHeight;',
      // Shift texture coordinates along vector V
      '			currentTextureCoords -= dtex;',
      '			heightFromTexture = 1. - texture2D( bumpMap, currentTextureCoords ).r;',
      '		}',

      '		#ifdef USE_STEEP_PARALLAX',

      '			return currentTextureCoords;',

      '		#elif defined( USE_RELIEF_PARALLAX )',

      '			vec2 deltaTexCoord = dtex / 2.0;',
      '			float deltaHeight = layerHeight / 2.0;',

      // Return to the mid point of previous layer
      '			currentTextureCoords += deltaTexCoord;',
      '			currentLayerHeight -= deltaHeight;',

      // Binary search to increase precision of Steep Parallax Mapping
      '			const int numSearches = 5;',
      '			for ( int i = 0; i < numSearches; i += 1 ) {',

      '				deltaTexCoord /= 2.0;',
      '				deltaHeight /= 2.0;',
      '				heightFromTexture = 1. - texture2D( bumpMap, currentTextureCoords ).r;',
      // Shift along or against vector V
      '				if( heightFromTexture > currentLayerHeight ) {', // Below the surface

      '					currentTextureCoords -= deltaTexCoord;',
      '					currentLayerHeight += deltaHeight;',

      '				} else {', // above the surface

      '					currentTextureCoords += deltaTexCoord;',
      '					currentLayerHeight -= deltaHeight;',

      '				}',

      '			}',
      '			return currentTextureCoords;',

      '		#elif defined( USE_OCLUSION_PARALLAX )',

      '			vec2 prevTCoords = currentTextureCoords + dtex;',

      // Heights for linear interpolation
      '			float nextH = heightFromTexture - currentLayerHeight;',
      '			float prevH = 1. - texture2D( bumpMap, prevTCoords ).r - currentLayerHeight + layerHeight;',

      // Proportions for linear interpolation
      '			float weight = nextH / ( nextH - prevH );',

      // Interpolation of texture coordinates
      '			return prevTCoords * weight + currentTextureCoords * ( 1.0 - weight );',

      '		#else', // NO_PARALLAX

      '			return vUv;',

      '		#endif',

      '	}',
      '#endif',

      'vec2 perturbUv( vec3 surfPosition, vec3 surfNormal, vec3 viewPosition ) {',

      '	vec2 texDx = dFdx( vUv );',
      '	vec2 texDy = dFdy( vUv );',

      '	vec3 vSigmaX = dFdx( surfPosition );',
      '	vec3 vSigmaY = dFdy( surfPosition );',
      '	vec3 vR1 = cross( vSigmaY, surfNormal );',
      '	vec3 vR2 = cross( surfNormal, vSigmaX );',
      '	float fDet = dot( vSigmaX, vR1 );',

      '	vec2 vProjVscr = ( 1.0 / fDet ) * vec2( dot( vR1, viewPosition ), dot( vR2, viewPosition ) );',
      '	vec3 vProjVtex;',
      '	vProjVtex.xy = texDx * vProjVscr.x + texDy * vProjVscr.y;',
      '	vProjVtex.z = dot( surfNormal, viewPosition );',

      '	return parallaxMap( vProjVtex );',
      '}',

      'void main() {',

      '	vec2 mapUv = perturbUv( -vViewPosition, normalize( vNormal ), normalize( vViewPosition ) );',
      '	gl_FragColor = texture2D( map, mapUv );',

      '}'
    ].join('\n'),
    
    
    
    /* uniforms: {
      uTex: {
        type: 't',
        value: uTex,
      },
    },
    vertexShader: `\
      #define PI 3.1415926535897932384626433832795

      attribute float y;
      attribute vec3 barycentric;
      varying vec2 vUv;
      varying vec3 vBarycentric;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vBarycentric = barycentric;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `\
      uniform sampler2D uTex;
    
      varying vec3 vBarycentric;
      varying vec2 vUv;
      varying vec3 vPosition;
    
      // const float lineWidth = 1.0;
      const vec3 lineColor1 = vec3(${new THREE.Color(0xef5350).toArray().join(', ')});
      const vec3 lineColor2 = vec3(${new THREE.Color(0xff7043).toArray().join(', ')});

      float gridFactor (vec3 bary, float width, float feather) {
        float w1 = width - feather * 0.5;
        // vec3 bary = vec3(vBC.x, vBC.y, 1.0 - vBC.x - vBC.y);
        vec3 d = fwidth(bary);
        vec3 a3 = smoothstep(d * w1, d * (w1 + feather), bary);
        return min(min(a3.x, a3.y), a3.z);
      }
      float gridFactor (vec3 bary, float width) {
        // vec3 bary = vec3(vBC.x, vBC.y, 1.0 - vBC.x - vBC.y);
        vec3 d = fwidth(bary);
        vec3 a3 = smoothstep(d * (width - 0.5), d * (width + 0.5), bary);
        return min(min(a3.x, a3.y), a3.z);
      }

      void main() {
        vec3 c1 = texture2D(uTex, vUv * 10.).rgb;
        vec3 c2 = mix(lineColor1, lineColor2, 2. + vPosition.y);
        gl_FragColor = vec4(c1 * (gridFactor(vBarycentric, 0.5) < 0.5 ? 0.9 : 1.0) + c2 * 0.2, 1.0);
      }
    `, */
    side: THREE.DoubleSide,
    // lights: true,
  });
  return material;
})();

/* const positionSnap = 0.1;
const rotationSnap = Math.PI/10;
const _snap = o => {
  o.position.x = Math.floor(o.position.x/positionSnap)*positionSnap;
  o.position.y = Math.floor(o.position.y/positionSnap)*positionSnap;
  o.position.z = Math.floor(o.position.z/positionSnap)*positionSnap;

  o.rotation.x = Math.round(o.rotation.x/rotationSnap)*rotationSnap;
  o.rotation.y = Math.round(o.rotation.y/rotationSnap)*rotationSnap;
  o.rotation.z = Math.round(o.rotation.z/rotationSnap)*rotationSnap;
}; */

const makeShapeMesh = () => {
  const object = new THREE.Object3D();
  const physicsIds = [];
  object.run = () => {
    // nothing
  };
  object.destroy = () => {
    for (const physicsId of physicsIds) {
      physicsManager.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
  };
  object.isBuild = true;
  const shapes = [];
  object.place = () => {
    const geometry = new THREE.BoxBufferGeometry(1, 0.1, 1);
    for (let i = 0, j = 0; i < geometry.attributes.position.array.length; i += 3, j += 2) {
      if (geometry.attributes.normal.array[i+1] === 0) {
        geometry.attributes.uv.array[j+1] = geometry.attributes.position.array[i+1];
      }
    }
    const shapeMesh = new THREE.Mesh(geometry, shapeMaterial);
    shapeMesh.position.copy(mesh.position);
    shapeMesh.quaternion.copy(mesh.quaternion);
    shapeMesh.updateMatrix();
    shapeMesh.matrix
      .premultiply(object.matrixWorld.clone().invert())
      .decompose(shapeMesh.position, shapeMesh.quaternion, shapeMesh.scale);
    object.add(shapeMesh);
    shapes.push(shapeMesh);
    
    const physicsId = physicsManager.addBoxGeometry(mesh.position, mesh.quaternion, localVector.set(1, 0.1, 1), false);
    physicsIds.push(physicsId);
  };
  object.getShapes = () => shapes;
  return object;
};

/* const update = () => {
  const transforms = rigManager.getRigTransforms();
  const [{position, quaternion}] = transforms;

  mesh.position.copy(position)
    .add(localVector.set(0, -0.5, -1).applyQuaternion(quaternion));
  mesh.rotation.setFromQuaternion(quaternion, 'YXZ');
  // _snap(mesh);
}; */

const geometryTool = {
  mesh,
  makeShapeMesh,
  // update,
};
export default geometryTool;