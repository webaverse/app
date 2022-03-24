import * as THREE from 'three';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
// import {chunkWorldSize} from '../../procgen/map-gen';
const {useApp, useLocalPlayer, useProcGen, useGeometries, useCamera, useMaterials, useFrame, useActivate, usePhysics, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
// const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
// const localBox = new THREE.Box3();
const localLine = new THREE.Line3();
const localMatrix = new THREE.Matrix4();
const oneVector = new THREE.Vector3(1, 1, 1);

const ClippedPlane = (() => {
  const localVector = new THREE.Vector3();
  // const localVector2 = new THREE.Vector3();
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
      const intersection = this.intersectLine(line, localVector)
      if (intersection) {
        const uv = this.getUV(intersection, localVector2D);
        if (uv !== null) {
          const direction = localVector.copy(line.end)
            .sub(line.start);
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
  const camera = useCamera();
  const physics = usePhysics();
  const {
    voxelWorldSize,
    chunkWorldSize,
  } = useProcGen();
  // const {CapsuleGeometry} = useGeometries();
  const {WebaverseShaderMaterial} = useMaterials();

  app.name = 'barrier';

  const _getSingleUse = () => app.getComponent('singleUse') ?? false;
  // const doubleSide = app.getComponent('doubleSide') ?? false;

  const barrierMeshes = [];
  let children = [];
  const physicsIds = [];
  const _render = () => {
    const bounds = app.getComponent('bounds') ?? [[0, 0, 0], [4, 4, 4]];
    const [min, max] = bounds;
    const [minX, minY, minZ] = min;
    const [maxX, maxY, maxZ] = max;
    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;

    const delta = app.getComponent('delta') ?? [0, 0];
    const [dx, dy] = delta;
    const chunkOffset = new THREE.Vector3(dx * chunkWorldSize, 0, dy * chunkWorldSize);

    const exits = app.getComponent('exits') ?? [];

    let barrierSpecs = null;
    if (exits.length > 0) {
      barrierSpecs = exits.map(exit => {
        localVector.fromArray(exit);
        
        let normal;
        if (localVector.x === 0) { // XXX blocks should come with an incoming direction so this is well-defined
          normal = localVector2.set(1, 0, 0);
        } else if (localVector.x === (width - voxelWorldSize)) {
          normal = localVector2.set(-1, 0, 0);
        } else if (localVector.z === 0) {
          normal = localVector2.set(0, 0, 1);
        } else if (localVector.z === (depth - voxelWorldSize)) {
          normal = localVector2.set(0, 0, -1);
        } else if (localVector.y === 0) {
          normal = localVector2.set(0, 1, 0);
        } else if (localVector.y === (height - voxelWorldSize)) {
          normal = localVector2.set(0, -1, 0);
        } else {
          console.warn('invalid exit position', exit, width, height, depth);
          throw new Error('invalid exit position');
        }

        let size;
        if (normal.x !== 0) {
          size = localVector5.set(1, voxelWorldSize, voxelWorldSize);
        } else if (normal.z !== 0) {
          size = localVector5.set(voxelWorldSize, voxelWorldSize, 1);
        } else if (normal.y !== 0) {
          size = localVector5.set(voxelWorldSize, 1, voxelWorldSize);
        } else {
          console.warn('invalid wall normal', normal.toArray());
          throw new Error('invalid wall normal');
        }

        // console.log('got normal', normal.toArray().join(','));

        const position = new THREE.Vector3(
          -width/2 +
            (0.5 * -normal.x) +
            localVector.x +
            (normal.x === -1 ? voxelWorldSize : 0) +
            (normal.z * voxelWorldSize/2),
          voxelWorldSize/2 +
            localVector.y,
          -depth/2 +
            (0.5 * -normal.z) +
            localVector.z +
            (normal.z === -1 ? voxelWorldSize : 0) +
            (normal.x * voxelWorldSize/2),
        ).add(chunkOffset);

        return {
          position,
          normal: normal.clone(),
          size: size.clone(),
        };
      });
    } else {
      barrierSpecs = [
        {
          position: new THREE.Vector3(maxX + minX, maxY + minY, maxZ + minZ).multiplyScalar(0.5),
          normal: new THREE.Vector3(0, 0, 1),
          size: new THREE.Vector3(width, height, depth),
        },
      ];
      // console.log('got barrier specs', {barrierSpecs, minZ, maxZ});
    }

    for (const barrierSpec of barrierSpecs) {
      const {
        position,
        normal,
        size,
      } = barrierSpec;
      const w = size.x;
      const h = size.y;
      const d = size.z;

      const barrierGeometry = new THREE.BoxGeometry(1, 1, 1);
      for (let i = 0; i < barrierGeometry.attributes.position.count; i++) {
        const position = localVector.fromArray(barrierGeometry.attributes.position.array, i * 3);
        const normal = localVector2.fromArray(barrierGeometry.attributes.normal.array, i * 3);
        if (normal.y !== 0) {
          localVector2D.set(position.x * size.x, position.z * size.z);
        } else if (normal.x !== 0) {
          localVector2D.set(position.y * size.y, position.z * size.z);
        } else {
          localVector2D.set(position.x * size.x, position.y * size.y);
        }
        localVector2D.toArray(barrierGeometry.attributes.uv.array, i * 2);
      }
      barrierGeometry.applyMatrix4(new THREE.Matrix4().makeScale(w, h, d));
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
          uStartTimeS: {
            value: 0,
            needsUpdate: false,
          },
          uDirection: {
            value: new THREE.Vector3(0, 0, 0),
            needsUpdate: false,
          },
          uSpeed: {
            value: 0,
            needsUpdate: false,
          },
          peerCooldown: {
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

          uniform float iTime;
          uniform float uStartTimeS;
          uniform vec3 uDirection;
          uniform float uSpeed;
          varying vec3 vPosition;
          varying vec2 vUv;
          // varying vec3 vNormal;
          // varying vec3 vCameraDirection;
          varying float darkening;
          varying float dimming;

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

          void main(){
            vec3 p = position;
            bool normalAligned = normal == -uDirection;
            float t = (iTime - uStartTimeS);
            if (normalAligned) {
              p += uDirection * uSpeed * t;
            }

            vec4 view_pos = modelViewMatrix * vec4(p, 1.0);

            vec3 view_dir = normalize(-view_pos.xyz);
            vec3 view_nv  = normalize(normalMatrix * normal);

            float NdotV   = dot(view_dir, view_nv);
            darkening     = NdotV;

            if (uSpeed != 0.) {
              if (normalAligned) {
                dimming = 1. - t;
              } else {
                dimming = 1. - t * 4.;
              }
              dimming = max(dimming, 0.);
            } else {
              dimming = 1.;
            }

            gl_Position   = projectionMatrix * view_pos;

            vUv = uv;
          }
        `,
        fragmentShader: `\
          precision highp float;
          precision highp int;

          #define PI 3.1415926535897932384626433832795

          uniform float iTime;
          uniform float uHighlight;
          uniform float peerCooldown;
          varying vec3 vPosition;
          varying vec2 vUv;
          varying float darkening;
          varying float dimming;

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

          float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
            return ( near * far ) / ( ( far - near ) * invClipZ - far );
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

              b = min(b, 1.);
              
              float c = 1.-b;
              /* if (gl_FrontFacing == false) {
                c *= 0.2;
              } */
              
              c += uHighlight;
              fragColor = vec4(vec3(c), b);

              if (darkening <= 0.0) {
                fragColor.a *= 0.2;
              }
              fragColor.a *= dimming;

              float d = gl_FragCoord.z/gl_FragCoord.w;
              // d = perspectiveDepthToViewZ(d, ${camera.near.toFixed(8)}, ${camera.far.toFixed(8)});
              fragColor.a *= min(max(5. - pow(d, 0.5), 0.), 1.);
          
              fragColor.a *= peerCooldown;

              if (fragColor.a < 0.001) {
                discard;
              }
          }
          void main() {
            mainImage(gl_FragColor, vUv);
          }
        `,
        // side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
        side: THREE.DoubleSide,
        transparent: true,
      });
      const barrierMesh = new THREE.Mesh(barrierGeometry, barrierMaterial);
      barrierMesh.position.copy(position);
      // barrierMesh.scale.set(size.x, size.y, size.z);
      barrierMesh.frustumCulled = false;
      app.add(barrierMesh);
      app.updateMatrixWorld();
      barrierMeshes.push(barrierMesh);
      children.push(barrierMesh);

      barrierMesh.boundingBox = new THREE.Box3().setFromObject(barrierMesh);
      barrierMesh.clipPlanes = [
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
      barrierMesh.animationSpec = null;
    }
  };
  _render();

  app.addEventListener('componentsupdate', ({keys}) => {
    if (keys.includes('delta')) {
      _cleanup();
      _render();
    }
  });

  const localPlayer = useLocalPlayer();
  const lastPosition = localPlayer.position.clone();
  // const cooldownTime = 2000;
  const cooldownTime = 0;
  let lastPeerCooldownTime = -Infinity;
  useFrame(({timestamp, timeDiff}) => {
    const timestampS = timestamp/1000;
    const timeDiffS = timeDiff/1000;

    const _updateAnimations = () => {
      for (const barrierMesh of barrierMeshes) {
        if (barrierMesh.animationSpec) {
          if (timestamp >= barrierMesh.animationSpec.endTime) {
            if (barrierMesh.animationSpec.type === 'trigger') {
              barrierMesh.animationSpec = {
                type: 'cooldown',
                startValue: 0,
                endValue: 0,
                visible: false,
                startTime: timestamp,
                endTime: timestamp + cooldownTime,
                startTimeS: timestampS,
                direction: new THREE.Vector3(0, 0, 0),
                speed: 0,
              };
            } else if (barrierMesh.animationSpec.type === 'cooldown') {
              if (!barrierMesh.boundingBox.containsPoint(localPlayer.position)) {
                barrierMesh.animationSpec = null;
                
                const singleUse = _getSingleUse();
                if (singleUse) {
                  app.remove(barrierMesh);
                  barrierMeshes.splice(barrierMeshes.indexOf(barrierMesh), 1);
                }
              }
            } else {
              console.warn('unknown animation type', type);
            }
          }
        }
      }
    };
    _updateAnimations();
    const _updateCollisions = () => {
      const localChildren = children.slice();

      for (const barrierMesh of localChildren) {
        localMatrix.compose(barrierMesh.position, barrierMesh.quaternion, oneVector)
          .invert();

        for (const clipPlane of barrierMesh.clipPlanes) {
          const positionStart = lastPosition;
          const positionEnd = localPlayer.position;
          const totalDistance = positionStart.distanceTo(positionEnd);

          let broke = false;
          for (let d = 0; d <= totalDistance; d += 1) {
            const f1 = totalDistance > 0 ? Math.min(d / totalDistance, 1) : 1;
            const lineStart = localVector.copy(positionStart)
              .lerp(positionEnd, f1);
            const f2 = Math.min((d + 1) / totalDistance, 1);
            const lineEnd = localVector2.copy(positionStart)
              .lerp(positionEnd, f2);
            localLine.set(lineStart, lineEnd)
              .applyMatrix4(
                localMatrix
              );

            const penetrationNormalVector = clipPlane.getPenetrationNormalVector(localLine, localVector);
            if (penetrationNormalVector !== null) {
              if (!barrierMesh.animationSpec) {
                const direction = penetrationNormalVector.clone();
                const speed = localLine.start.distanceTo(localLine.end) / timeDiffS;
                barrierMesh.animationSpec = {
                  type: 'trigger',
                  startValue: 0,
                  endValue: 1,
                  visible: true,
                  startTime: timestamp,
                  endTime: timestamp + 1000,
                  startTimeS: timestampS,
                  direction,
                  speed,
                };

                lastPeerCooldownTime = -Infinity;

                const singleUse = _getSingleUse();
                if (singleUse) {
                  children.splice(children.indexOf(barrierMesh), 1);
                }

                app.dispatchEvent({
                  type: 'collision',
                  direction: direction.clone(),
                  speed,
                });

                broke = true;
                break;
              } else if (barrierMesh.animationSpec && barrierMesh.animationSpec.type === 'cooldown') {
                barrierMesh.animationSpec.startTime = timestamp;
                barrierMesh.animationSpec.endTime = timestamp + cooldownTime;
              }
            }
          }
          if (broke) {
            break;
          }
        }
      }
    };
    _updateCollisions();
    const _updateMaterials = () => {
      for (const barrierMesh of barrierMeshes) {
        barrierMesh.material.uniforms.iTime.value = timestampS;
        
        let highlight;
        if (barrierMesh.animationSpec) {
          let f = Math.min(Math.max(
            (timestamp - barrierMesh.animationSpec.startTime) / (barrierMesh.animationSpec.endTime - barrierMesh.animationSpec.startTime),
            0),
          1);
          f = Math.pow(f, 0.1);
          highlight = (1-f)*barrierMesh.animationSpec.startValue + f*barrierMesh.animationSpec.endValue;
        } else {
          highlight = 0;
        }
        barrierMesh.material.uniforms.uHighlight.value = highlight;
        barrierMesh.material.uniforms.uHighlight.needsUpdate = true;
    
        if (barrierMesh.animationSpec) {
          barrierMesh.material.uniforms.uStartTimeS.value = barrierMesh.animationSpec.startTimeS;
          barrierMesh.material.uniforms.uStartTimeS.needsUpdate = true;
    
          barrierMesh.material.uniforms.uDirection.value.copy(barrierMesh.animationSpec.direction);
          barrierMesh.material.uniforms.uDirection.needsUpdate = true;
          
          barrierMesh.material.uniforms.uSpeed.value = barrierMesh.animationSpec.speed;
          barrierMesh.material.uniforms.uSpeed.needsUpdate = true;
        } else {
          barrierMesh.material.uniforms.uSpeed.value = 0;
          barrierMesh.material.uniforms.uSpeed.needsUpdate = true;
        }
        {
          const now = performance.now();
          const timeDiff = now - lastPeerCooldownTime;
          const v = Math.pow(timeDiff / 1000 / 2, 10);
          barrierMesh.material.uniforms.peerCooldown.value = Math.min(Math.max(v, 0), 1);
          barrierMesh.material.uniforms.peerCooldown.needsUpdate = true;
        }
    
        barrierMesh.visible = barrierMesh.animationSpec ? barrierMesh.animationSpec.visible : true;
      }
    };
    _updateMaterials();

    lastPosition.copy(localPlayer.position);
  });
  
  const _cleanup = () => {
    for (const child of children) {
      app.remove(child);
    }
    children.length = 0;

    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
  };
  useCleanup(() => {
    _cleanup();
  });

  app.peerCooldown = () => {
    lastPeerCooldownTime = performance.now();
  };

  return app;
};