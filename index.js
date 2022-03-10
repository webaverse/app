import * as THREE from 'three';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useLocalPlayer, useInternals, useGeometries, useMaterials, useFrame, useActivate, useLoaders, usePhysics, addTrackedApp, useDefaultModules, useCleanup} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
// const localBox = new THREE.Box3();
const localLine = new THREE.Line3();
const localMatrix = new THREE.Matrix4();

const ClippedPlane = (() => {
  const localVector = new THREE.Vector3();
  const localVector2 = new THREE.Vector3();
  const localVector3 = new THREE.Vector3();
  const localVector2D = new THREE.Vector2();
  const zeroVector = new THREE.Vector3(0, 0, 0);
  
  class ClippedPlane extends THREE.Plane {
    constructor(normal, coplanarPoint, size = new THREE.Vector2(1, 1), up = new THREE.Vector3(0, 1, 0)) {
      super();
      this.setFromNormalAndCoplanarPoint(normal, coplanarPoint);

      this.coplanarPoint = coplanarPoint;
      this.size = size;
      this.up = up;
      this.right = new THREE.Vector3().crossVectors(this.normal, this.up).normalize();

      const center = this.projectPoint(zeroVector, localVector);
      // {
        const topLeft = center.clone()
          .add(localVector3.copy(this.up).multiplyScalar(this.size.y / 2))
          .sub(localVector3.copy(this.right).multiplyScalar(this.size.x / 2));
        const bottomLeft = center.clone()
          .sub(localVector3.copy(this.up).multiplyScalar(this.size.y / 2))
          .sub(localVector3.copy(this.right).multiplyScalar(this.size.x / 2));
        this.leftLine = new THREE.Line3(bottomLeft, topLeft);
      // }
      // {
        const bottomLeft2 = center.clone()
          .sub(localVector3.copy(this.up).multiplyScalar(this.size.y / 2))
          .sub(localVector3.copy(this.right).multiplyScalar(this.size.x / 2));
        const bottomRight2 = center.clone()
          .sub(localVector3.copy(this.up).multiplyScalar(this.size.y / 2))
          .add(localVector3.copy(this.right).multiplyScalar(this.size.x / 2));
        this.bottomLine = new THREE.Line3(bottomLeft2, bottomRight2);
      // }
      /* if (this.normal.x === 1 && this.leftLine.start.y === -0.5) {
        debugger;
      } */
    }
    getUV(point, target) {
      const x = this.leftLine.closestPointToPointParameter(point, false);
      const y = this.bottomLine.closestPointToPointParameter(point, false);

      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        // console.log('got uv', x, y, this.normal.toArray(), point.toArray(), this.leftLine, this.bottomLine);
        return target.set(x, y);
      } else {
        return null;
      }
    }
    getPenetrationNormalVector(line, target) {
      const intersection = this.intersectLine(line, localVector);
      if (intersection) {
        const uv = this.getUV(intersection, localVector2D);
        if (uv !== null) {
          const direction = localVector.copy(line.end)
            .sub(line.start);
          // console.log('dot', direction.dot(this.normal));
          if (direction.dot(this.normal) < 0) {
            return target.copy(this.normal)
              .multiplyScalar(-1);
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
    /* applyMatrix4(matrix, optionalNormalMatrix) {
      super.applyMatrix4(matrix, optionalNormalMatrix);

      this.leftLine.applyMatrix4(matrix);
      this.bottomLine.applyMatrix4(matrix);
    } */
  }
  return ClippedPlane;
})();

export default () => {
  const app = useApp();
  const {renderer, scene, camera} = useInternals();
  const physics = usePhysics();
  // const {CapsuleGeometry} = useGeometries();
  const {WebaverseShaderMaterial} = useMaterials();

  const physicsIds = [];

  const [w, h, d] = app.getComponent('size') ?? [4, 4, 4];
  const barrierGeometry = new THREE.BoxGeometry(w, h, d)
    // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, h/2, 0));
  for (let i = 0; i < barrierGeometry.attributes.position.count; i++) {
    const position = localVector.fromArray(barrierGeometry.attributes.position.array, i * 3)
    const normal = localVector2.fromArray(barrierGeometry.attributes.normal.array, i * 3)
      // .toArray(barrierGeometry.attributes.position.array, i * 3);
    if (normal.y !== 0) {
      localVector2D.set(position.x, position.z);
    } else if (normal.x !== 0) {
      localVector2D.set(position.y, position.z);
    } else {
      localVector2D.set(position.x, position.y);
    }
    localVector2D.toArray(barrierGeometry.attributes.uv.array, i * 2);
  }
  const barrierMaterial = new WebaverseShaderMaterial({
    uniforms: {
      iTime: {
        value: 0,
      },
      /* iResolution: {
        value: new THREE.Vector2(1024, 1024),
        needsUpdate: false,
      }, */
      uHighlight: {
        value: 0,
        needsUpdate: false,
      },
      /* cameraDirection: {
        value: new THREE.Vector3(),
        needsUpdate: true,
      }, */
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      varying vec3 vPosition;
      varying vec2 vUv;
      // varying vec3 vNormal;
      // varying vec3 vCameraDirection;

      float getBezierT(float x, float a, float b, float c, float d) {
        return float(sqrt(3.) *
          sqrt(-4. * b * d + 4. * b * x + 3. * c * c + 2. * c * d - 8. * c * x - d * d + 4. * d * x)
            + 6. * b - 9. * c + 3. * d)
            / (6. * (b - 2. * c + d));
      }
      float easing(float x) {
        return getBezierT(x, 0., 1., 0., 1.);
      }
      float easing2(float x) {
        return easing(easing(x));
      }

      // const float moveDistance = 20.;
      // const float q = 0.1;

      /* void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vCameraDirection = normalize(normalMatrix * vec3(0., 0., -1.));
        vPosition = position;
      } */



      varying float darkening;

      void main(){

          vec4 view_pos = modelViewMatrix * vec4(position, 1.0);

          vec3 view_dir = normalize(-view_pos.xyz); // vec3(0.0) - view_pos;
          vec3 view_nv  = normalize(normalMatrix * normal.xyz);

          float NdotV   = dot(view_dir, view_nv);
          darkening     = NdotV;

          gl_Position   = projectionMatrix * view_pos;

          vUv = uv;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      uniform float iTime;
      // uniform vec3 cameraDirection;
      uniform float uHighlight;
      // uniform vec2 iResolution;
      varying vec3 vPosition;
      varying vec2 vUv;
      // varying vec3 vNormal;
      // varying vec3 vCameraDirection;
      varying float darkening;

      /* const vec3 lineColor1 = vec3(${new THREE.Color(0x29b6f6).toArray().join(', ')});
      const vec3 lineColor2 = vec3(${new THREE.Color(0x0288d1).toArray().join(', ')});
      const vec3 lineColor3 = vec3(${new THREE.Color(0xec407a).toArray().join(', ')});
      const vec3 lineColor4 = vec3(${new THREE.Color(0xc2185b).toArray().join(', ')}); */

      /*

        draw letter shapes after subdividing uv space randomly

      */

      float random2d(vec2 n) { 
          return fract(sin(dot(n, vec2(129.9898, 4.1414))) * 2398.5453);
      }

      vec2 getCellIJ(vec2 uv, float gridDims){
          return floor(uv * gridDims)/ gridDims;
      }

      vec2 rotate2D(vec2 position, float theta)
      {
          mat2 m = mat2( cos(theta), -sin(theta), sin(theta), cos(theta) );
          return m * position;
      }

      //from https://github.com/keijiro/ShaderSketches/blob/master/Text.glsl
      float letter(vec2 coord, float size)
      {
          vec2 gp = floor(coord / size * 7.); // global
          vec2 rp = floor(fract(coord / size) * 7.); // repeated
          vec2 odd = fract(rp * 0.5) * 2.;
          float rnd = random2d(gp);
          float c = max(odd.x, odd.y) * step(0.5, rnd); // random lines
          c += min(odd.x, odd.y); // fill corner and center points
          c *= rp.x * (6. - rp.x); // cropping
          c *= rp.y * (6. - rp.y);
          return clamp(c, 0., 1.);
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          vec2 uv = fragCoord;
          // vec2 uv = fragCoord.xy / iResolution.xy;    
          //correct aspect ratio
          // uv.x *= iResolution.x/iResolution.y;
          /* if (vPosition.y <= 0. || vPosition.y >= iResolution.y - 0.01) {
            discard;
          } */

          // vec3 normal = vNormal;
          /* vec3 normal = normalize(cross(dFdx(vPosition), dFdy(vPosition)));
          normal.y *= -1.;
          normal *= -1.; */
          // vec3 cameraDirection = vCameraDirection;
          // float normalDotCameraDirection = dot(normal, vCameraDirection);
          // float normalDotCameraDirection = vNormalCameraDirection;
          /* if (normalDotCameraDirection < 0.) {
            discard;
          } */

          uv /= 2.;

          float t = iTime;
          float scrollSpeed = 1.;
          float dims = 3.0;
          int maxSubdivisions = 1;
          
          // uv = rotate2D(uv,PI/12.0);
          uv.y -= floor(iTime * scrollSpeed);
          
          float cellRand;
          vec2 ij;
          
          for(int i = 0; i <= maxSubdivisions; i++) { 
              ij = getCellIJ(uv, dims);
              cellRand = random2d(ij);
              dims *= 2.0;
              //decide whether to subdivide cells again
              float cellRand2 = random2d(ij + 454.4543);
              if (cellRand2 > 0.3){
                break; 
              }
          }
        
          //draw letters    
          float b = letter(uv, 1.0 / (dims));
        
          //fade in
          /* float scrollPos = iTime*scrollSpeed + 0.5;
          float showPos = -ij.y + cellRand;
          float fade = smoothstep(showPos ,showPos + 0.05, scrollPos );
          b *= fade; */
          
          //hide some
          //if (cellRand < 0.1) b = 0.0;
          
          float c = 1.-b;
          /* if (gl_FrontFacing == false) {
            c *= 0.2;
          } */
          if (b > 0.001) {
            c += uHighlight;
            fragColor = vec4(vec3(c), b);
          } else {
            discard;
          }

          if (darkening <= 0.0) {
            fragColor.a *= 0.5;
          }
          // fragColor.a = darkening;

          // fragColor.rgb = normal;
      }
      void main() {
        mainImage(gl_FragColor, vUv);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const barrierMesh = new THREE.Mesh(barrierGeometry, barrierMaterial);
  barrierMesh.frustumCulled = false;
  app.add(barrierMesh);
  app.updateMatrixWorld();

  const _updateBarrierMesh = (now, timeDiff) => {
    // camera.getWorldDirection(barrierMesh.material.uniforms.cameraDirection.value);
    // barrierMesh.material.uniforms.needsUpdate = true;

    barrierMesh.material.uniforms.iTime.value = now/1000;
    // barrierMesh.material.uniforms.iResolution.value.set(w, h);
    // renderer.getSize(barrierMesh.material.uniforms.iResolution.value).multiplyScalar(renderer.getPixelRatio());
    
    let highlight;
    if (animationSpec) {
      let f = Math.min(Math.max((now - animationSpec.startTime) / (animationSpec.endTime - animationSpec.startTime), 0), 1);
      f = Math.pow(f, 0.1);
      highlight = (1-f)*animationSpec.startValue + f*animationSpec.endValue;
    } else {
      highlight = 0;
    }
    // const highlightValue = animationSpec ? animationSpec.highlight : 1; 
    barrierMesh.material.uniforms.uHighlight.value = highlight;
    barrierMesh.material.uniforms.uHighlight.needsUpdate = true;

    barrierMesh.visible = animationSpec ? animationSpec.visible : true;
  };
  /* const material2 = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
  }); */
  // const mesh = new THREE.Mesh(geometry, material);
  // app.add(mesh);

  /* let activateCb = null;
  let frameCb = null;
  useActivate(() => {
    activateCb && activateCb();
  }); */

  /* const _getBarrierBox = box => {
    return box.set(
      localVector.set(-w/2, 0, -d/2)
        .applyMatrix4(barrierMesh.matrixWorld),
      localVector2.set(w/2, h, d/2)
        .applyMatrix4(barrierMesh.matrixWorld),
    )
  }; */
  // console.log('got h', h);
  const clipPlanes = [
    // top
    new ClippedPlane(
      new THREE.Vector3(0, 1, 0), // normal
      new THREE.Vector3(0, h/2, 0), // coplanarPoint
      new THREE.Vector2(w, d), // size
      new THREE.Vector3(0, 0, 1), // up
    ),
    // bottom
    new ClippedPlane(
      new THREE.Vector3(0, -1, 0), // normal
      new THREE.Vector3(0, -h/2, 0), // coplanarPoint
      new THREE.Vector2(w, d), // size
      new THREE.Vector3(0, 0, 1), // up
    ),
    // left
    new ClippedPlane(
      new THREE.Vector3(-1, 0, 0), // normal
      new THREE.Vector3(-w/2, 0, 0), // coplanarPoint
      new THREE.Vector2(d, h), // size
      new THREE.Vector3(0, 1, 0), // up
    ),
    // right
    new ClippedPlane(
      new THREE.Vector3(1, 0, 0), // normal
      new THREE.Vector3(w/2, 0, 0), // coplanarPoint
      new THREE.Vector2(d, h), // size
      new THREE.Vector3(0, 1, 0), // up
    ),
    // front
    new ClippedPlane(
      new THREE.Vector3(0, 0, -1), // normal
      new THREE.Vector3(0, 0, -d/2), // coplanarPoint
      new THREE.Vector2(w, h), // size
      new THREE.Vector3(0, 1, 0), // up
    ),
    // back
    new ClippedPlane(
      new THREE.Vector3(0, 0, 1), // normal
      new THREE.Vector3(0, 0, d/2), // coplanarPoint
      new THREE.Vector2(w, h), // size
      new THREE.Vector3(0, 1, 0), // up
    ),
  ];
  for (const clipPlane of clipPlanes) {
    const geometry = new THREE.PlaneBufferGeometry(clipPlane.size.x, clipPlane.size.y, 0.1);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(clipPlane.coplanarPoint);
    mesh.frustumCulled = false;
    scene.add(mesh);
  }

  const localPlayer = useLocalPlayer();
  const lastPosition = localPlayer.position.clone();
  
  let animationSpec = null;
  // let lastAnimationFinishTime = 0;
  const cooldownTime = 2000;
  // let playing = false;
  useFrame(({timestamp, timeDiff}) => {
    if (animationSpec) {
      if (timestamp >= animationSpec.endTime) {
        if (animationSpec.type === 'trigger') {
          animationSpec = {
            type: 'cooldown',
            startValue: 0,
            endValue: 0,
            visible: false,
            startTime: timestamp,
            endTime: timestamp + cooldownTime,
          };
        } else {
          animationSpec = null;
        }
      }
    }

    // const barrierBox = _getBarrierBox(localBox);
    // window.barrierBox = barrierBox;
    // window.localPlayer = localPlayer;
    for (const clipPlane of clipPlanes) {
      localLine.set(lastPosition, localPlayer.position)
        .applyMatrix4(
          localMatrix.copy(barrierMesh.matrixWorld)
            .invert()
        );

      const penetrationNormalVector = clipPlane.getPenetrationNormalVector(localLine, localVector);
      if (penetrationNormalVector !== null) {
        if (!animationSpec) {
          animationSpec = {
            type: 'trigger',
            startValue: 0,
            endValue: 1,
            visible: true,
            startTime: timestamp,
            endTime: timestamp + 1000,
          };
        } else if (animationSpec && animationSpec.type === 'cooldown') {
          animationSpec.startTime = timestamp;
          animationSpec.endTime = timestamp + cooldownTime;
        }

        break;
      } else {
        // console.log('no intersection', localLine.start.toArray().join(','), localLine.end.toArray().join(','), clipPlane);
      }
   }

    /* if (!playing) {
      const audio = new Audio(`${baseUrl}pissbaby.mp3`);
      audio.oncanplaythrough = () => {
        console.log('can play');
        audio.play();
      };
      audio.onerror = err => {
        console.warn(err);
      };
      playing = true;
    } */

    _updateBarrierMesh(timestamp, timeDiff);

    lastPosition.copy(localPlayer.position);
  });
  
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};