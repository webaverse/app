import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, removeApp, useFrame, useLoaders, useCleanup, usePhysics, useLocalPlayer, useWeb3, useAbis, useInternals} = metaversefile;

export default e => {
  const app = useApp();
  const physics = usePhysics();
  // const world = useWorld();
  const {camera} = useInternals();
  const web3 = useWeb3();
  const {ERC721} = useAbis();
  const ERC721LoomLock = JSON.parse(JSON.stringify(ERC721));
  const tokenURIMethodAbi = ERC721LoomLock.find(m => m.name === 'tokenURI');
  const preRevealTokenURIAbi = JSON.parse(JSON.stringify(tokenURIMethodAbi));
  preRevealTokenURIAbi.name = 'preRevealTokenURI';
  ERC721LoomLock.push(preRevealTokenURIAbi);

  const contractAddress = '${this.contractAddress}';
  const tokenId = parseInt('${this.tokenId}', 10);
  // console.log('got token id', tokenId);

  const originalAppPosition = app.position.clone();
  app.position.set(0, 0, 0);
  app.quaternion.set(0, 0, 0, 1);
  app.scale.set(1, 1, 1);

  const physicsIds = [];
  {
    const texture = new THREE.Texture();
    const geometry = new THREE.PlaneBufferGeometry(1, 1, 100, 100);
    const uniforms = {
      map: {
        type: 't',
        value: texture,
        needsUpdate: true,
      },
      uStartTime: {
        type: 'f',
        value: (Date.now()/1000) % 1,
        needsUpdate: true,
      },
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
      uHeadQuaternion: {
        type: 'q',
        value: new THREE.Quaternion(),
        needsUpdate: true,
      },
      uCameraDirection: {
        type: 'v3',
        value: new THREE.Vector3(),
        needsUpdate: true,
      },
      uCameraQuaternion: {
        type: 'q',
        value: new THREE.Quaternion(),
        needsUpdate: true,
      },
    };
    const vertexShader = \`\\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795
      #define QUATERNION_IDENTITY vec4(0, 0, 0, 1)

      uniform float uStartTime;
      uniform float uTime;
      uniform vec4 uHeadQuaternion;
      uniform vec4 uCameraQuaternion;

      // varying vec3 vViewPosition;
      varying vec2 vUv;
      // varying vec3 vPosition;
      // varying vec3 vNormal;
      
      mat4 getRotationMatrix(vec4 quaternion) {
        // vec4 quaternion = uHeadQuaternion;
        float qw = quaternion.w;
        float qx = quaternion.x;
        float qy = quaternion.y;
        float qz = quaternion.z;

        float n = 1.0f/sqrt(qx*qx+qy*qy+qz*qz+qw*qw);
        qx *= n;
        qy *= n;
        qz *= n;
        qw *= n;

        return mat4(
          1.0f - 2.0f*qy*qy - 2.0f*qz*qz, 2.0f*qx*qy - 2.0f*qz*qw, 2.0f*qx*qz + 2.0f*qy*qw, 0.0f,
          2.0f*qx*qy + 2.0f*qz*qw, 1.0f - 2.0f*qx*qx - 2.0f*qz*qz, 2.0f*qy*qz - 2.0f*qx*qw, 0.0f,
          2.0f*qx*qz - 2.0f*qy*qw, 2.0f*qy*qz + 2.0f*qx*qw, 1.0f - 2.0f*qx*qx - 2.0f*qy*qy, 0.0f,
          0.0f, 0.0f, 0.0f, 1.0f);
      }
      vec4 q_slerp(vec4 a, vec4 b, float t) {
        // if either input is zero, return the other.
        if (length(a) == 0.0) {
            if (length(b) == 0.0) {
                return QUATERNION_IDENTITY;
            }
            return b;
        } else if (length(b) == 0.0) {
            return a;
        }

        float cosHalfAngle = a.w * b.w + dot(a.xyz, b.xyz);

        if (cosHalfAngle >= 1.0 || cosHalfAngle <= -1.0) {
            return a;
        } else if (cosHalfAngle < 0.0) {
            b.xyz = -b.xyz;
            b.w = -b.w;
            cosHalfAngle = -cosHalfAngle;
        }

        float blendA;
        float blendB;
        if (cosHalfAngle < 0.99) {
            // do proper slerp for big angles
            float halfAngle = acos(cosHalfAngle);
            float sinHalfAngle = sin(halfAngle);
            float oneOverSinHalfAngle = 1.0 / sinHalfAngle;
            blendA = sin(halfAngle * (1.0 - t)) * oneOverSinHalfAngle;
            blendB = sin(halfAngle * t) * oneOverSinHalfAngle;
        } else {
            // do lerp if angle is really small.
            blendA = 1.0 - t;
            blendB = t;
        }

        vec4 result = vec4(blendA * a.xyz + blendB * b.xyz, blendA * a.w + blendB * b.w);
        if (length(result) > 0.0) {
            return normalize(result);
        }
        return QUATERNION_IDENTITY;
      }
      vec3 applyQuaternion(vec3 v, vec4 q) { 
        return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
      } 

      void main() {
        float time = mod(uStartTime + uTime, 1.0);

        vec3 p = position;
        /* if (bar < 1.0) {
          float wobble = uDistance <= 0. ? sin(time * PI*10.)*0.02 : 0.;
          p.y *= (1.0 + wobble) * min(max(1. - uDistance/3., 0.), 1.0);
        }
        p.y += 0.01; */
        const float headCutoff = 0.54;
        const float legsCutoff = 0.12;
        const float legsSplit = 0.5;
        const vec3 headOffset = vec3(0, 0.25, 0.);
        if (uv.y > headCutoff) {
          // float zOffset = (vec4(headOffset, 1.) * getRotationMatrix(q_slerp(uHeadQuaternion, vec4(0., 0., 0., 1.), (0.5 - abs(p.x)) * 2.))).z;
          float zOffset = (vec4(headOffset, 1.) * getRotationMatrix(uHeadQuaternion)).z;
          
          // p.z = sin(time * PI * 2.) * (uv.y - headCutoff);
          p -= headOffset;
          // p.xz *= 0.5;
          p = (vec4(p, 1.) * getRotationMatrix(uHeadQuaternion)).xyz;
          // p.xz *= 2.;
          p += headOffset;
          
          p.z += zOffset;
        } else if (uv.y < legsCutoff) {
          if (uv.x >= legsSplit) {
            p.z += sin(time * PI * 2.) * (legsCutoff - uv.y);
          } else {
            p.z += -sin(time * PI * 2.) * (legsCutoff - uv.y);
          }
        }
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        // vPosition = mvPosition.xyz / mvPosition.w;
        gl_Position = projectionMatrix * mvPosition;
        vUv = uv;
        // vNormal = applyQuaternion(normal, uCameraQuaternion);
      }
    \`;
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader: \`\\
        precision highp float;
        precision highp int;

        #define PI 3.1415926535897932384626433832795

        // uniform float uTime;
        uniform sampler2D map;
        uniform vec3 uCameraDirection;
        
        varying vec2 vUv;
        // varying vec3 vPosition;
        // varying vec3 vNormal;

        void main() {
          gl_FragColor = texture(map, vUv);
          if (gl_FragColor.a < 0.1) {
            discard;
          }
        }
      \`,
      transparent: true,
      side: THREE.BackSide,
      // polygonOffset: true,
      // polygonOffsetFactor: -1,
      // polygonOffsetUnits: 1,
    });
    const imageMesh = new THREE.Mesh(geometry, material);
    imageMesh.position.copy(originalAppPosition);
    imageMesh.position.y = 0.5;
    imageMesh.quaternion.identity();

    const materialBack = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader: \`\\
        precision highp float;
        precision highp int;

        #define PI 3.1415926535897932384626433832795

        // uniform float uTime;
        uniform sampler2D map;
        uniform vec3 uCameraDirection;
        
        varying vec2 vUv;
        // varying vec3 vPosition;
        // varying vec3 vNormal;

        void main() {
          gl_FragColor = texture(map, vUv);
          if (gl_FragColor.a < 0.1) {
            discard;
          }
          gl_FragColor.rgb = vec3(0.);
        }
      \`,
      transparent: true,
      side: THREE.FrontSide,
      // polygonOffset: true,
      // polygonOffsetFactor: -1,
      // polygonOffsetUnits: 1,
    });
    const imageMeshBack = new THREE.Mesh(geometry, materialBack);
    // imageMeshBack.rotation.order = 'YXZ';
    // imageMeshBack.rotation.y = Math.PI;
    imageMesh.add(imageMeshBack);
    
    const _chooseAnimation = (timestamp, timeDiff) => {
      const player = useLocalPlayer();
      
      const r = Math.random();
      if (r < 0.5) {
        const velocity = new THREE.Vector3(0, 5, 0);
        // console.log('got time diff', timeDiff);
        return {
          type: 'jump',
          velocity,
          tick(timestamp, timeDiff) {
            imageMesh.position.add(velocity.clone().multiplyScalar(timeDiff/1000));
            velocity.add(physics.getGravity().clone().multiplyScalar(timeDiff/1000));
            if (imageMesh.position.y < 0.5) {
              imageMesh.position.y = 0.5;
              return true;
            }
          },
        };
      } else {
        const startPosition = imageMesh.position.clone();
        const offset = new THREE.Vector3(-0.5 + Math.random(), 0, -0.5 + Math.random()).multiplyScalar(20);
        const offsetLength = offset.length();
        if (offsetLength < 5) {
          offset.divideScalar(offsetLength).multiplyScalar(5);
        }
        const endPosition = startPosition.clone()
          .add(offset);
        const walkSpeed = 1/(0.1 + Math.random());
        const startTime = timestamp;
        const endTime = startTime + (endPosition.distanceTo(startPosition) / walkSpeed) * 1000;
        const startQuaternion = imageMesh.quaternion.clone();
        const endQuaternion = new THREE.Quaternion()
          .setFromRotationMatrix(
            new THREE.Matrix4().lookAt(
              startPosition,
              endPosition,
              new THREE.Vector3(0, 1, 0)
            )
          );
        const euler = new THREE.Euler().setFromQuaternion(endQuaternion, 'YXZ');
        euler.x = 0;
        euler.z = 0;
        endQuaternion.setFromEuler(euler);
        
        let localDistanceTraveled = 0;
        return {
          type: 'walk',
          startPosition,
          endPosition,
          startQuaternion,
          endQuaternion,
          startTime,
          endTime,
          tick(timestamp, timeDiff) {
            const f = Math.min((timestamp - startTime) / (endTime - startTime), 1);
            const targetPosition = startPosition.clone().lerp(endPosition, f);
            if (f < 1) {
              const frameDistance = targetPosition.distanceTo(imageMesh.position);
              localDistanceTraveled += frameDistance;
              distanceTraveled += frameDistance;
              const targetQuaternion = startQuaternion.clone()
                .slerp(
                  endQuaternion,
                  Math.min(localDistanceTraveled, 1)
                );
              
              imageMesh.position.copy(targetPosition);
              imageMesh.quaternion.copy(targetQuaternion);
            } else {
              imageMesh.position.copy(targetPosition);
              return true;
            }
          },
        };
      }
    };
    // window.imageMesh = imageMesh;
    
    let animation = null;
    let distanceTraveled = 0;
    useFrame(({timestamp, timeDiff}) => {
      /* const _setToFloor = () => {
        if (!animation) {
          imageMesh.position.y = -app.position.y + 0.5;
          imageMesh.quaternion.copy(app.quaternion).invert();
        }
      };
      _setToFloor(); */
      
      const _animate = () => {
        if (!animation) {
          animation = _chooseAnimation(timestamp, timeDiff);
          // console.log('new animation', animation);
        }
        const tickResult = animation.tick(timestamp, timeDiff);
        if (tickResult === true) {
          animation = null;
        }
      };
      _animate();
      
      const _setWalk = f => {
        // const f = (timestamp/1000) % 1;
        imageMesh.material.uniforms.uTime.value = f;
        imageMesh.material.uniforms.uTime.needsUpdate = true;
      };
      _setWalk((distanceTraveled * 2) % 1);
      
      const _setLook = () => {
        const player = useLocalPlayer();

        let lookQuaternion = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            imageMesh.position.clone()
              .add(new THREE.Vector3(0, 0.25, 0)),
            player.position,
            new THREE.Vector3(0, 1, 0)
          )
        );
        const lookEuler = new THREE.Euler().setFromQuaternion(lookQuaternion, 'YXZ');
        // lookEuler.y += Math.PI;
        // lookEuler.x *= -1;
        // lookEuler.z = 0;
        lookQuaternion.setFromEuler(lookEuler);

        const angle = lookQuaternion.angleTo(imageMesh.quaternion);
        // console.log('got angle', angle);
        if (angle < Math.PI*0.4) {
          // nothing
        } else {
          lookQuaternion = imageMesh.quaternion.clone();
        }
        
        imageMesh.material.uniforms.uHeadQuaternion.value.slerp(lookQuaternion.clone().premultiply(imageMesh.quaternion.clone().invert()), 0.1); // setFromAxisAngle(new THREE.Vector3(0, 1, 0), (-0.5 + f) * Math.PI);
        imageMesh.material.uniforms.uHeadQuaternion.needsUpdate = true;
        
        imageMesh.material.uniforms.uCameraDirection.value.set(0, 0, -1).applyQuaternion(camera.quaternion);
        imageMesh.material.uniforms.uCameraDirection.needsUpdate = true;
        
        imageMesh.material.uniforms.uCameraQuaternion.value.copy(camera.quaternion);
        imageMesh.material.uniforms.uCameraQuaternion.needsUpdate = true;
      };
      _setLook();
    });
    
    (async () => {
      const contract = new web3.eth.Contract(ERC721LoomLock, contractAddress);
      
      const tokenURI = await contract.methods.preRevealTokenURI(tokenId).call();
      const res = await fetch(tokenURI);
      const j = await res.json();
      console.log('got loomlocknft j', j);
      
      const img = new Image();
      await new Promise((accept, reject) => {
        img.onload = accept;
        img.onerror = reject;
        img.crossOrigin = 'Aynonymous';
        img.src = j.image;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const queue = [
        [0, 0],
        [canvas.width-1, 0],
        [0, canvas.height-1],
        [canvas.width-1, canvas.height-1],
      ];
      const seen = {};
      const _getKey = (x, y) => x + ':' + y;
      while (queue.length > 0) {
        const [x, y] = queue.pop();
        const k = _getKey(x, y);
        if (!seen[k]) {
          seen[k] = true;
          
          const startIndex = y*imageData.width*4 + x*4;
          const endIndex = startIndex + 4;
          const [r, g, b, a] = imageData.data.slice(startIndex, endIndex);
          if (r < 255/8 && g < 255/8 && b < 255/8) {
            // nothing
          } else {
            imageData.data[startIndex] = 0;
            imageData.data[startIndex+1] = 0;
            imageData.data[startIndex+2] = 0;
            imageData.data[startIndex+3] = 0;
            
            const _tryQueue = (x, y) => {
              if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                const k = _getKey(x, y);
                if (!seen[k]) {
                  queue.push([x, y]);
                }
              }
            };
            _tryQueue(x-1, y-1);
            _tryQueue(x,   y-1);
            _tryQueue(x+1, y-1);
            
            _tryQueue(x-1, y);
            // _tryQueue(x, y);
            _tryQueue(x+1, y);
            
            _tryQueue(x-1, y+1);
            _tryQueue(x,   y+1);
            _tryQueue(x+1, y+1);
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      
      texture.image = canvas;
      texture.needsUpdate = true;
      imageMesh.material.uniforms.map.needsUpdate = true;
    })();
    
    // imageMesh.position.set(0, 1.3, -0.2);
    app.add(imageMesh);
    
    const physicsId = physics.addBoxGeometry(
      imageMesh.position,
      imageMesh.quaternion,
      new THREE.Vector3(1/2, 1/2, 0.01),
      false
    );
    physicsIds.push(physicsId);
    useFrame(() => {
      const p = imageMesh.position;
      const q = imageMesh.quaternion;
      const s = imageMesh.scale;
      physics.setPhysicsTransform(physicsId, p, q, s);
    });
  }
  
  app.addEventListener('activate', e => {
    removeApp(app);
    app.destroy();
  });

  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
  });
  
  return app;
};

/*
    const npc = await world.addNpc(o.contentId, null, o.position, o.quaternion);
    
    const mesh = npc;
    const animations = mesh.getAnimations();
    const component = mesh.getComponents()[componentIndex];
    let  {idleAnimation = ['idle'], aggroDistance, walkSpeed = 1} = component;
    if (idleAnimation) {
      if (!Array.isArray(idleAnimation)) {
        idleAnimation = [idleAnimation];
      }
    } else {
      idleAnimation = [];
    }

    const idleAnimationClips = idleAnimation.map(name => animations.find(a => a.name === name)).filter(a => !!a);
    // console.log('got clips', npc, idleAnimationClips);
    const updateFns = [];
    if (idleAnimationClips.length > 0) {
      // hacks
      {
        mesh.position.y = 0;
        localEuler.setFromQuaternion(mesh.quaternion, 'YXZ');
        localEuler.x = 0;
        localEuler.z = 0;
        mesh.quaternion.setFromEuler(localEuler);
      }
      
      const mixer = new THREE.AnimationMixer(mesh);
      const idleActions = idleAnimationClips.map(idleAnimationClip => mixer.clipAction(idleAnimationClip));
      for (const idleAction of idleActions) {
        idleAction.play();
      }
      
      updateFns.push(timeDiff => {
        const deltaSeconds = timeDiff / 1000;
        mixer.update(deltaSeconds);
      });
    }

    let animation = null;
    updateFns.push(timeDiff => {
      const _updatePhysics = () => {
        const physicsIds = mesh.getPhysicsIds();
        for (const physicsId of physicsIds) {
          physicsManager.setPhysicsTransform(physicsId, mesh.position, mesh.quaternion, mesh.scale);
        }
      };

      if (animation) {
        mesh.position.add(localVector.copy(animation.velocity).multiplyScalar(timeDiff/1000));
        animation.velocity.add(localVector.copy(physicsManager.getGravity()).multiplyScalar(timeDiff/1000));
        if (mesh.position.y < 0) {
          animation = null;
        }
        
        _updatePhysics();
      } else {
        const head = localPlayer.avatar.model.isVrm ? localPlayer.avatar.modelBones.Head : localPlayer.avatar.model;
        const position = head.getWorldPosition(localVector);
        position.y = 0;
        const distance = mesh.position.distanceTo(position);
        if (distance < aggroDistance) {
          const minDistance = 1;
          if (distance > minDistance) {
            const direction = position.clone().sub(mesh.position).normalize();
            const maxMoveDistance = distance - minDistance;
            const moveDistance = Math.min(walkSpeed * timeDiff * 1000, maxMoveDistance);
            const moveDelta = direction.clone().multiplyScalar(moveDistance);
            mesh.position.add(moveDelta);
            
            const closestNpc = this.npcs.filter(n => n !== npc).sort((a, b) => {
              return a.position.distanceTo(npc.position) - b.position.distanceTo(npc.position);
            })[0];
            const moveBufferDistance = 1;
            if (closestNpc && closestNpc.position.distanceTo(npc.position) >= (moveDistance + moveBufferDistance)) {
              mesh.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction), 0.1);
            } else {
              mesh.position.sub(moveDelta);
            }
            
            _updatePhysics();
          }
        }
      }
    });
    npc.addEventListener('hit', e => {
      const euler = new THREE.Euler().setFromQuaternion(e.quaternion, 'YXZ');
      euler.x = 0;
      euler.z = 0;
      const quaternion = new THREE.Quaternion().setFromEuler(euler);
      const hitSpeed = 1;
      animation = {
        velocity: new THREE.Vector3(0, 6, -5).applyQuaternion(quaternion).multiplyScalar(hitSpeed),
      };
    });
    npc.update = timeDiff => {
      for (const fn of updateFns) {
        fn(timeDiff);
      }
    };
    this.npcs.push(npc);
*/

export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'js';
export const components = ${this.components};