import * as THREE from 'three';
import {getRenderer, camera, scene, setCameraType} from './renderer.js';
import physicsManager from './physics-manager.js';
import {playersManager} from './players-manager.js';
import { PathFinder } from './npc-utils.js';
import metaversefile from 'metaversefile';
import scene2DManager from './2d-manager.js';

const physicsScene = physicsManager.getScene();

// class HealthMesh {
//   constructor() {
//     this.mesh = null;
//     this.owner = null;
//   }
//   create(npcPlayer) {

//     let uniforms = {
//       hp: {value: 0},
//       time: {value: 1}
//     }
    
//     const vertexShader = () => {
//       return `
//           varying vec2 vUv;
//           varying float rara;
//           uniform float width;
//           uniform float height;
//           uniform float time;
          
//           varying vec4 v_foo;
    
//           void main() {
//               vUv = uv; 
    
//               vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
//               gl_Position = projectionMatrix * modelViewPosition;
    
//               if(gl_Position.x > 0.5) {
//                 rara = 0.5;
//               }
//               else {
//                 rara = 0.;
//               }
    
//               v_foo = gl_Position;
    
//           }
//       `;
//     }
    
//     const fragmentShader = () => {
//       return `
//           uniform sampler2D texture1; 
//           //uniform sampler2D texture2; 
//           varying vec2 vUv;
//           varying float rara;
//           uniform float width;
//           uniform float height;
//           uniform float time;
          
//           uniform float hp;
    
//           varying vec4 v_foo;
    
//           void main() {
//               vec3 colorRed = vec3(247., 0., 0.) / 255.0;
//               vec3 colorWhite = vec3(222.0, 222.0, 222.0) / 0.0;
    
//               float pulse = sin(time) + 1.;
//               //float letters = 1. - letter(uUv.x / 3. * clamp(1, 1., 2.), 1.) * pulse;
    
//               float cut = step(0.01, vUv.x);
//               //vec4 finalColor = vec4(colorRed.rgb, 1);
//               //vec3 finalColor = vec3(1. - uv.r) * letters;
//               //finalColor += vec4(1. - letters) * vec4(1. - cut) * vec4(colorRed.rgb, 1);
    
//               if(vUv.x < hp) {
//                 //colorRed.r *= pulse;
//                 gl_FragColor = vec4(colorRed, 1);
//               }
//               else {
//                 gl_FragColor = vec4(colorWhite, 1);
//               }
    
              
              
//               //gl_FragColor = vec4(color, 1);
    
//               //if(gl_FragColor
//           }
//       `;
//     }

//     let material =  new THREE.ShaderMaterial({
//       uniforms: uniforms,
//       fragmentShader: fragmentShader(),
//       vertexShader: vertexShader(),
//       side: THREE.DoubleSide
//     })
      
//     let geom = new THREE.PlaneGeometry(.8,.1);
//     this.mesh = new THREE.Mesh(geom, material);
//     npcPlayer.npcApp.add(this.mesh);
//     this.owner = npcPlayer;
//   }
//   update() {
//     if(this.mesh && this.owner) {
//       let baseHealth = 30;
//       let health = this.owner.npcApp.hitTracker.hp / baseHealth;
//       this.mesh.position.copy(this.owner.position).add(new THREE.Vector3(0,0.5,0));

//       this.mesh.rotation.copy(camera.rotation);
//       this.mesh.updateMatrixWorld();

//       this.mesh.material.uniforms.hp.value = health;
//       this.mesh.material.uniformsNeedUpdate = true;
//     }
//   }
// }

class PointerControls {
    constructor() {
      this.moveTarget = null;
      this.attackTarget = null;
      this.debugCircle = null;
  
      this.debugMesh = null;
      this.attackMesh = null;
  
      this.pathFinder = new PathFinder();
      this.path = null;
      this.pathIndex = 0;
  
      /// dirty combat test
      this.lastAttackTime = 0;
      this.firstAttackTime = null;
      this.inAttackRange = false;

      this.lastFocusTarget = null;
    }
    resetFocus() {
      this.moveTarget = null;
      this.attackTarget = null;
      this.inAttackRange = false;
      this.lastFocusTarget = null;
    }
    checkIsDestinationValid(pos) {
      const localPlayer = playersManager.getLocalPlayer();
      if(localPlayer.position.distanceTo(pos) < 15) {
        let a = new THREE.Vector3(0,localPlayer.position.y,0).distanceTo(new THREE.Vector3(0,pos.y,0));
        if(a < 6) {
          return true;
        }
        else {
          return false;
        }
  
      }
      else {
        return false;
      }
    }
    castFromCursor() {
      //console.log('casting from cursor')
      let vector = new THREE.Vector3();
      //let dir = new THREE.Vector3();
      vector.set( ( scene2DManager.cursorPosition.x / window.innerWidth ) * 2 - 1, - ( scene2DManager.cursorPosition.y / window.innerHeight ) * 2 + 1, - 1 );
      vector.unproject( camera );
      //dir.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld );
      //raycaster.set( vector, dir );
      let ray = physicsScene.raycast(vector, camera.quaternion);
  
      if(ray) {
        return ray;
      }
    }
    handleCursorClick() {
      let target = this.castFromCursor();
      //console.log(target, "yaw e got target");
      if(target) {
        console.log(target, "target")
        const targetApp = metaversefile.getAppByPhysicsId(target.objectId);
        //this.lastFocusTarget = targetApp;

        if(targetApp) {
          const focusedEvent = {
            type: 'focused',
          };
          targetApp.dispatchEvent(focusedEvent);
        }

        console.log(targetApp, "our target App");
        const targetPoint = new THREE.Vector3().fromArray(target.point);
        let isValid = this.checkIsDestinationValid(targetPoint);
        if(isValid) {
          this.moveTarget = targetPoint.add(new THREE.Vector3(0,0.1,0));
          if(targetApp.appType === "npc") {
            this.attackTarget = targetApp;
            this.moveTarget = targetApp.npcPlayer.position.clone().sub(new THREE.Vector3(0,targetApp.npcPlayer.avatar.height,0));
          }
          else {
            this.attackTarget = null;
          }
          this.path = null;
          this.pathIndex = 0;
        }
        else {
          this.moveTarget = null;
          this.path = null;
          this.pathIndex = null;
        }
      }
      else {
        console.log("invalid target")
      }
    }
    moveToPoint(point, t) {
      const localPlayer = playersManager.getLocalPlayer();
      let target = point;
      let dist = new THREE.Vector3(localPlayer.position.x, 0, localPlayer.position.z).distanceTo(new  THREE.Vector3(target.x, 0, target.z));
      let dir = new THREE.Vector3().subVectors(target, localPlayer.position);
  
      if(dist > 0.25) {
        let walkSpeed = 0.075;
        let runFactor = 2;
        
        let speed;
  
        dist < 2 ? speed = walkSpeed : speed = walkSpeed;
        
        localPlayer.characterPhysics.applyWasd(
          dir.normalize()
            .multiplyScalar(speed * t)
        );
        this.debugMesh.visible = true;
        this.debugMesh.position.copy(this.moveTarget);
        this.debugMesh.updateMatrixWorld();
      }
      else {
        this.debugMesh.visible = false;
        this.moveTarget = null;
        this.path = null;
        this.pathIndex = 0;
      }
    }
    traversePath(path, t) {
      const localPlayer = playersManager.getLocalPlayer();
      //console.log(this.pathIndex);
      let target = path[this.pathIndex].position;
      //let target = this.moveTarget;
      let dist = new THREE.Vector3(localPlayer.position.x, 0, localPlayer.position.z).distanceTo(new  THREE.Vector3(target.x, 0, target.z));
      let dir = new THREE.Vector3().subVectors(target, localPlayer.position);
  
      if(dist > 0.25) {
        let walkSpeed = 0.075;
        let runFactor = 2;
        
        let speed;
  
        dist < 2 ? speed = walkSpeed : speed = walkSpeed;
        
        localPlayer.characterPhysics.applyWasd(
          dir.normalize()
            .multiplyScalar(speed * t)
        );
        this.debugMesh.visible = true;
        this.debugMesh.position.copy(this.moveTarget);
        this.debugMesh.updateMatrixWorld();
      }
      else {
        this.debugMesh.visible = false;
        this.moveTarget = null;
        this.path = null;
        this.pathIndex = 0;
      }
    }
    moveAndAttackTarget(target, t) {
      const localPlayer = playersManager.getLocalPlayer();
      let origin = new THREE.Vector3(localPlayer.position.x, localPlayer.position.y, localPlayer.position.z);
      let dist = origin.distanceTo(target);
      let dir = new THREE.Vector3();
      dir.subVectors(target, origin);
  
      if(dist > 1) {
        this.inAttackRange = false;
        localPlayer.characterPhysics.applyWasd(
          dir.normalize()
            .multiplyScalar(0.1 * t)
        );
      }
      else {
        this.inAttackRange = true;
      }
    }
    update(timestamp, timeDiff) {
      const localPlayer = playersManager.getLocalPlayer();
  
      if(this.moveTarget && localPlayer) {
        this.resetFocus();
        //this.moveToPoint(this.moveTarget, timeDiff);
      }
  
    }
}
export {PointerControls};