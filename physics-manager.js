/*
physics manager is the interface to the physics engine.
it contains code for character capsules and world simulation.
*/

import * as THREE from 'three'
// import {getRenderer, camera, dolly} from './renderer.js';
import physx from './physx.js'
// import cameraManager from './camera-manager.js';
// import ioManager from './io-manager.js';
// import {getPlayerCrouchFactor} from './character-controller.js';
import metaversefileApi from 'metaversefile'
import { getNextPhysicsId, freePhysicsId, convertMeshToPhysicsMesh } from './util.js'
// import {applyVelocity} from './util.js';
// import {groundFriction} from './constants.js';
import { CapsuleGeometry } from './geometries.js'
import { Geometry2D } from './Geometry2D.js'
import physxWorkerManager from './physx-worker-manager.js';

// const localVector = new THREE.Vector3()
const localVector2 = new THREE.Vector3()
/* const localVector3 = new THREE.Vector3()
const localVector4 = new THREE.Vector3()
const localVector5 = new THREE.Vector3()
const localQuaternion = new THREE.Quaternion()
const localQuaternion2 = new THREE.Quaternion()
const localMatrix = new THREE.Matrix4() */

// fake shared material to prevent shader instantiation
const redMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  // side: THREE.DoubleSide,
});

// const zeroVector = new THREE.Vector3(0, 0, 0);
// const upVector = new THREE.Vector3(0, 1, 0);

const _makePhysicsObject = (physicsId, position, quaternion, scale) => {
  const physicsObject = new THREE.Object3D()
  physicsObject.position.copy(position)
  physicsObject.quaternion.copy(quaternion)
  physicsObject.scale.copy(scale)
  physicsObject.updateMatrixWorld()
  physicsObject.physicsId = physicsId
  physicsObject.detached = false // detached physics objects do not get updated when the owning app moves
  physicsObject.collided = true
  physicsObject.grounded = true
  return physicsObject
};
const _updatePhysicsObjects = updatesOut => {
  for (const updateOut of updatesOut) {
    const { id, position, quaternion, collided, grounded } = updateOut
    const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(id)
    if (physicsObject) {
      // console.log('update physics object', id);

      physicsObject.position.copy(position)
      physicsObject.quaternion.copy(quaternion)
      physicsObject.updateMatrixWorld()

      physicsObject.collided = collided
      physicsObject.grounded = grounded
    } /* else {
      console.warn('failed to update unknown physics id', id);
    } */
  }
};

const physicsUpdates = [];
const gravity = new THREE.Vector3(0, -9.8, 0);
class PhysicsScene extends EventTarget {
  constructor(opts) {
    super();

    if (!opts) {
      this.scene = null;
      this.physicsEnabled = true;

      this.loadPromise = (async () => {
        if (!physx.loaded) {
          await physx.waitForLoad();
          this.loadPromise = null;
        }
        const scene = physx.physxWorker.makeScene();
        this.scene = scene;
        return scene;
      })();
    } else {
      this.scene = opts.scene;
      this.physicsEnabled = opts.physicsEnabled;
      this.loadPromise = opts.loadPromise;
      if (!this.scene) {
        this.loadPromise.then(scene => {
          this.scene = scene;
          this.loadPromise = null;
        });
      }
    }
  }
  clone() {
    return new PhysicsScene({
      scene: this.scene,
      physicsEnabled: this.physicsEnabled,
      loadPromise: this.loadPromise,
    });
  }
  addCapsuleGeometry(
    position,
    quaternion,
    radius,
    halfHeight,
    material,
    dynamic,
    flags = {}
  ) {
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addCapsuleGeometryPhysics(
      this.scene,
      position,
      quaternion,
      radius,
      halfHeight,
      physicsId,
      material,
      dynamic,
      flags
    )
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      position,
      quaternion,
      localVector2.set(1, 1, 1)
    )
    const physicsMesh = new THREE.Mesh(
      new CapsuleGeometry(radius, radius, halfHeight * 2),
      redMaterial
    )
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsMesh.updateMatrixWorld()
    const { bounds } = this.getGeometryForPhysicsId(physicsId)
    physicsMesh.geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3().fromArray(bounds, 0),
      new THREE.Vector3().fromArray(bounds, 3)
    )
    physicsObject.physicsMesh = physicsMesh
    return physicsObject
  }
  addPlaneGeometry(position, quaternion, dynamic) {
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addPlaneGeometryPhysics(
      this.scene,
      position,
      quaternion,
      physicsId,
      dynamic,
    )
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      position,
      quaternion,
      localVector2.set(1, 1, 1)
    )
    const physicsMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), redMaterial)
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.updateMatrixWorld()
    physicsObject.physicsMesh = physicsMesh
    return physicsObject
  }
  addBoxGeometry(position, quaternion, size, dynamic,
    groupId = -1 // if not equal to -1, this BoxGeometry will not collide with CharacterController.
  ) {
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addBoxGeometryPhysics(
      this.scene,
      position,
      quaternion,
      size,
      physicsId,
      dynamic,
      groupId
    )
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      position,
      quaternion,
      localVector2.set(1, 1, 1)
    )
    const physicsMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), redMaterial)
    physicsMesh.scale.copy(size)
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.updateMatrixWorld()
    const { bounds } = this.getGeometryForPhysicsId(physicsId)
    physicsMesh.geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3().fromArray(bounds, 0),
      new THREE.Vector3().fromArray(bounds, 3)
    )
    physicsObject.physicsMesh = physicsMesh
    return physicsObject
  }
  extractPhysicsGeometryForId(physicsId) {
    const physicsGeometry = this.getGeometryForPhysicsId(physicsId)
    const { positions, indices, bounds } = physicsGeometry
    let geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometry = geometry.toNonIndexed()
    geometry.computeVertexNormals()
    geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3().fromArray(bounds, 0),
      new THREE.Vector3().fromArray(bounds, 3)
    );
    return geometry
  }
  addGeometry(mesh) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh)
  
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addGeometryPhysics(
      this.scene,
      physicsMesh,
      physicsId
    )
    physicsMesh.geometry = this.extractPhysicsGeometryForId(physicsId)
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      physicsMesh.position,
      physicsMesh.quaternion,
      physicsMesh.scale
    )
    physicsObject.add(physicsMesh)
    physicsMesh.position.set(0, 0, 0)
    physicsMesh.quaternion.set(0, 0, 0, 1)
    physicsMesh.scale.set(1, 1, 1)
    physicsMesh.updateMatrixWorld()
    physicsObject.physicsMesh = physicsMesh
    return physicsObject
  }
  addGeometry2D(mesh) {

    console.log(mesh, "2dmesh");
    let obj = mesh.children[0]
    let bBox = new THREE.Box3();
    bBox.setFromObject( obj );
    let position = obj.position
    let quaternion = obj.quaternion

    console.log(bBox);
    //let size = new THREE.Vector3((bBox.max.x), (bBox.max.y), 1);
    //size = new THREE.Vector3(2,1,1);
    //console.log(size);


    //let newSize = bBox.getSize();
    //console.log("newsize", newSize)
    //console.log(bBox);
    //console.log(bBox.max.x, bBox.max.z, 1)
    //const tempMesh = new THREE.Mesh(new THREE.BoxGeometry(bBox.max.x + 1, bBox.max.z, 1), new THREE.MeshBasicMaterial());
    //mesh.children[0].geometry.computeBoundingBox();
    //console.log(mesh.children[0].geometry.boundingBox);

		//console.log(new THREE.Box3().setFromObject(mesh.children[0]));

    let target = new THREE.Vector3();

    let center = new THREE.Vector3();

    bBox.getSize(target);
    bBox.getCenter(center);
    let size = target;
    console.log(center, "center")
    
    size = new THREE.Vector3(center.x + target.x - bBox.max.x, center.y + target.y-bBox.max.y, 1);
    console.log(target, bBox);

    const physicsId = getNextPhysicsId()
    physx.physxWorker.addBoxGeometryPhysics(
      this.scene,
      position,
      quaternion,
      size,
      physicsId,
      false,
      -1
    )
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      position,
      quaternion,
      localVector2.set(1, 1, 1)
    )
    const physicsMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), redMaterial)
    physicsMesh.scale.copy(size)
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.updateMatrixWorld()
    const { bounds } = this.getGeometryForPhysicsId(physicsId)
    physicsMesh.geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3().fromArray(bounds, 0),
      new THREE.Vector3().fromArray(bounds, 3)
    )
    physicsObject.physicsMesh = physicsMesh
    return physicsObject

  }
  addGeometry2DX(mesh) {
    console.log(mesh.name, mesh);

    let obj = mesh.children[0];
    let clonedGeom = new THREE.BufferGeometry();
    clonedGeom = obj.geometry.clone();
    let position = obj.geometry.getAttribute('position');

    console.log(position.array.length, position.array.length /3, position.array, position, obj.geometry)

    for (let i = 0; i < position.array.length; i++) {
      //position.array[i] = i;
      //position.array[i+1] = i;
      //position.array[i+2] = i;

      if(position.array[i] === 0) {
        position.array[i] += 1;
        console.log("hewn", i);
      }
      
      obj.geometry.attributes.position.needsUpdate = true;
    }

    let clonedMesh = new THREE.Mesh(clonedGeom, mesh.material);
    mesh.updateMatrixWorld();


    const physicsMesh = convertMeshToPhysicsMesh(mesh)
  
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addGeometryPhysics(
      this.scene,
      physicsMesh,
      physicsId
    )
    physicsMesh.geometry = this.extractPhysicsGeometryForId(physicsId)
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      physicsMesh.position,
      physicsMesh.quaternion,
      physicsMesh.scale
    )
    physicsObject.add(physicsMesh)
    physicsMesh.position.set(0, 0, 0)
    physicsMesh.quaternion.set(0, 0, 0, 1)
    physicsMesh.scale.set(1, 1, 1)
    physicsMesh.updateMatrixWorld()
    physicsObject.physicsMesh = physicsMesh
    return physicsObject

  //console.log(position, position.array);

  }
  add2DGeometry(mesh) {
    console.log(mesh);

    let uniforms = {
      texture1: { value: mesh.children[0].material.map }
    }

    const vertexShader = () => {
      return `
          varying vec2 vUv; 
  
          void main() {
              vUv = uv; 
  
              vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
              gl_Position = projectionMatrix * modelViewPosition; 
          }
      `;
  }
  
  const fragmentShader = () => {
      return `
          uniform sampler2D texture1; 
          //uniform sampler2D texture2; 
          varying vec2 vUv;
  
          void main() {
              vec4 color1 = texture2D(texture1, vUv);
              //vec4 color2 = texture2D(texture2, vUv);

              if(color1.a < .95) {
                discard;
                //color1.a = 1;
              }

              if(color1.r > 50.) {
                color1.r = 21.;
              }

              
              
              gl_FragColor = color1;

              //if(gl_FragColor
          }
      `;
  }

    let material =  new THREE.ShaderMaterial({
      uniforms: uniforms,
      fragmentShader: fragmentShader(),
      vertexShader: vertexShader(),
    })

    

    mesh.children.forEach(mesh => { 
      //mesh.material = material;
    });

    const canvas = document.createElement( 'canvas' );
    let texture = mesh.children[0].material.map;
    console.log(texture);
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;
    
    const context = canvas.getContext( '2d' );
    context.drawImage( texture.image, 0, 0 );
    
    const imageData = context.getImageData( 0, 0, canvas.width, canvas.height );
    let data = imageData.data;
    //console.log( data , "data");

    let alphaCount = 0;
    let pixelArray = [];
    let fakeScene = null;

    for (var i = data.length; i >= 0; i -= 4) {
      if (data[i + 3] > 0) {
          //data[i] = this.colour.R;
          //data[i + 1] = this.colour.G;
          //data[i + 2] = this.colour.B;
          var x = (i / 4) % texture.image.width;
          var y = Math.floor((i / 4) / texture.image.width);

          if(data[i] + data[i + 1] + data[i + 2] > 0) {
            

            //let rata = meshO.clone();

            //fakeScene.add(rata);
            //rata.position.set(x/25, y/25, 0);
            //rata.updateMatrixWorld();

            //fakeScene.add(meshO);

            
            pixelArray.push({
              xCoord: x,
              yCoord: y,
              r: data[i],
              g: data[i + 1],
              b: data[i + 2],
            });
          }
      }
  }

  console.log(fakeScene);

  const vertices = [];

  let geom = new THREE.BoxBufferGeometry(.05,.05,.05);
  let dummy = new THREE.Object3D;
    fakeScene = new THREE.InstancedMesh( geom,new THREE.MeshBasicMaterial({color: 0xff0000}), pixelArray.length, true);
    for (let i = 0; i < pixelArray.length; i++) {
        let x = pixelArray[i].xCoord / 25;
        let y = pixelArray[i].yCoord / 25;
        let z = 0
        dummy.position.set(x,y,z);
        dummy.updateMatrix();
        fakeScene.setMatrixAt(i , dummy.matrix);
    }

    fakeScene.updateMatrixWorld();

  for (let i = 0; i < pixelArray.length; i++) {


    
    //scene.add( instancedStars );

    vertices.push({
      pos: [pixelArray[i].xCoord/50, pixelArray[i].yCoord/50, 0],
      norm: [0,0,1],
      uv: [1,0]
    });
    
    
  }

  // const vertices = [
  //     // front
  //     { pos: [-1, -1,  1], norm: [ 0,  0,  1], uv: [0, 1], },
  //     { pos: [ 1, -1,  1], norm: [ 0,  0,  1], uv: [1, 1], },
  //     { pos: [-1,  1,  1], norm: [ 0,  0,  1], uv: [0, 0], },

  //     { pos: [-1,  1,  1], norm: [ 0,  0,  1], uv: [0, 0], },
  //     { pos: [ 1, -1,  1], norm: [ 0,  0,  1], uv: [1, 1], },
  //     { pos: [ 1,  1,  1], norm: [ 0,  0,  1], uv: [1, 0], },
  //     // right
  //     { pos: [ 1, -1,  1], norm: [ 1,  0,  0], uv: [0, 1], },
  //     { pos: [ 1, -1, -1], norm: [ 1,  0,  0], uv: [1, 1], },
  //     { pos: [ 1,  1,  1], norm: [ 1,  0,  0], uv: [0, 0], },

  //     { pos: [ 1,  1,  1], norm: [ 1,  0,  0], uv: [0, 0], },
  //     { pos: [ 1, -1, -1], norm: [ 1,  0,  0], uv: [1, 1], },
  //     { pos: [ 1,  1, -1], norm: [ 1,  0,  0], uv: [1, 0], },
  //     // back
  //     { pos: [ 1, -1, -1], norm: [ 0,  0, -1], uv: [0, 1], },
  //     { pos: [-1, -1, -1], norm: [ 0,  0, -1], uv: [1, 1], },
  //     { pos: [ 1,  1, -1], norm: [ 0,  0, -1], uv: [0, 0], },

  //     { pos: [ 1,  1, -1], norm: [ 0,  0, -1], uv: [0, 0], },
  //     { pos: [-1, -1, -1], norm: [ 0,  0, -1], uv: [1, 1], },
  //     { pos: [-1,  1, -1], norm: [ 0,  0, -1], uv: [1, 0], },
  //     // left
  //     { pos: [-1, -1, -1], norm: [-1,  0,  0], uv: [0, 1], },
  //     { pos: [-1, -1,  1], norm: [-1,  0,  0], uv: [1, 1], },
  //     { pos: [-1,  1, -1], norm: [-1,  0,  0], uv: [0, 0], },

  //     { pos: [-1,  1, -1], norm: [-1,  0,  0], uv: [0, 0], },
  //     { pos: [-1, -1,  1], norm: [-1,  0,  0], uv: [1, 1], },
  //     { pos: [-1,  1,  1], norm: [-1,  0,  0], uv: [1, 0], },
  //     // top
  //     { pos: [ 1,  1, -1], norm: [ 0,  1,  0], uv: [0, 1], },
  //     { pos: [-1,  1, -1], norm: [ 0,  1,  0], uv: [1, 1], },
  //     { pos: [ 1,  1,  1], norm: [ 0,  1,  0], uv: [0, 0], },

  //     { pos: [ 1,  1,  1], norm: [ 0,  1,  0], uv: [0, 0], },
  //     { pos: [-1,  1, -1], norm: [ 0,  1,  0], uv: [1, 1], },
  //     { pos: [-1,  1,  1], norm: [ 0,  1,  0], uv: [1, 0], },
  //     // bottom
  //     { pos: [ 1, -1,  1], norm: [ 0, -1,  0], uv: [0, 1], },
  //     { pos: [-1, -1,  1], norm: [ 0, -1,  0], uv: [1, 1], },
  //     { pos: [ 1, -1, -1], norm: [ 0, -1,  0], uv: [0, 0], },

  //     { pos: [ 1, -1, -1], norm: [ 0, -1,  0], uv: [0, 0], },
  //     { pos: [-1, -1,  1], norm: [ 0, -1,  0], uv: [1, 1], },
  //     { pos: [-1, -1, -1], norm: [ 0, -1,  0], uv: [1, 0], },
  //   ];
    const positions = [];
    const normals = [];
    const uvs = [];
    for (const vertex of vertices) {
      positions.push(...vertex.pos);
      normals.push(...vertex.norm);
      uvs.push(...vertex.uv);
    }

    const geometry = new THREE.BufferGeometry();
    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;
    geometry.addAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
    geometry.addAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
    geometry.addAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));

    // for (let i = 0; i < imageData.data.length; i++) {
    //   //console.log(imageData.data[i]);
    //   if(imageData.data[i] === 0) {
    //     var x = (i / 4) % texture.image.width;
    //     var y = Math.floor((i / 4) / texture.image.width);

    //     //alphaCount++;
    //     pixelArray.push({

    //     });
    //     //console.log("no")
    //   }
      
    // }
    //console.log(alphaCount, imageData.data.length);

    //console.log(geometry);

    let mesh2 = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0xff0000}));
    return fakeScene;
    //console.log(pixelArray);
    this.scene.add(mesh2);

    const physicsMesh = convertMeshToPhysicsMesh(mesh)
  
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addGeometryPhysics(
      this.scene,
      physicsMesh,
      physicsId
    )
    physicsMesh.geometry = this.extractPhysicsGeometryForId(physicsId)

    let testScale = new THREE.Vector3(physicsMesh.scale.x, physicsMesh.scale.y, 5);
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      physicsMesh.position,
      physicsMesh.quaternion,
      testScale
    )
    physicsObject.add(physicsMesh)
    physicsMesh.position.set(0, 0, 0)
    physicsMesh.quaternion.set(0, 0, 0, 1)
    physicsMesh.scale.set(1, 1, 1)
    physicsMesh.updateMatrixWorld()
    physicsObject.physicsMesh = physicsMesh
    //return physicsObject
  }
  createMaterial(physicsMaterial) {
    return physx.physxWorker.createMaterial(this.scene, physicsMaterial)
  }
  destroyMaterial(materialAddress) {
    physx.physxWorker.destroyMaterial(this.scene, materialAddress);
  }
  cookGeometry(mesh) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh);
    const buffer = physx.physxWorker.cookGeometryPhysics(physicsMesh);
    return buffer;
  }
  async cookGeometryAsync(mesh, {
    signal = null,
  } = {}) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh);
    const buffer = await physxWorkerManager.cookGeometry(physicsMesh);
    signal && signal.throwIfAborted();
    return buffer;
  }
  addCookedGeometry(buffer, position, quaternion, scale) {
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addCookedGeometryPhysics(
      this.scene,
      buffer,
      position,
      quaternion,
      scale,
      physicsId
    )
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      position,
      quaternion,
      scale
    )
    const physicsMesh = new THREE.Mesh(this.extractPhysicsGeometryForId(physicsId), redMaterial)
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.physicsMesh = physicsMesh
    physicsMesh.updateMatrixWorld()
    return physicsObject
  }
  addConvexGeometry(mesh, dynamic = false, external = false) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh)
  
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addConvexGeometryPhysics(
      this.scene,
      physicsMesh,
      dynamic,
      external,
      physicsId
    )
    physicsMesh.geometry = this.extractPhysicsGeometryForId(physicsId)
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      mesh.position,
      mesh.quaternion,
      mesh.scale
    )
    physicsObject.add(physicsMesh)
    physicsMesh.position.set(0, 0, 0)
    physicsMesh.quaternion.set(0, 0, 0, 1)
    physicsMesh.scale.set(1, 1, 1)
    physicsMesh.updateMatrixWorld()
    physicsObject.physicsMesh = physicsMesh
    return physicsObject
  }
  cookConvexGeometry(mesh) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh);
    const buffer = physx.physxWorker.cookConvexGeometryPhysics(this.scene, physicsMesh);
    return buffer;
  }
  async cookConvexGeometryAsync(mesh, {
    signal = null,
  } = {}) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh);
    const buffer = await physxWorkerManager.cookConvexGeometry(physicsMesh);
    signal && signal.throwIfAborted();
    return buffer;
  }
  addCookedConvexGeometry(
    buffer,
    position,
    quaternion,
    scale,
    dynamic = false,
    external = false,
  ) {
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addCookedConvexGeometryPhysics(
      this.scene,
      buffer,
      position,
      quaternion,
      scale,
      dynamic,
      external,
      physicsId
    )
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      position,
      quaternion,
      scale
    )
    const physicsMesh = new THREE.Mesh(this.extractPhysicsGeometryForId(physicsId), redMaterial)
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.physicsMesh = physicsMesh
    physicsMesh.updateMatrixWorld()
    return physicsObject
  }
  addShape(shapeAddress, position, quaternion, scale, external) {
    const physicsId = getNextPhysicsId()
  
    physx.physxWorker.addShapePhysics(
      this.scene,
      shapeAddress,
      position,
      quaternion,
      scale,
      external,
      physicsId
    );
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      position,
      quaternion,
      scale
    )
    const physicsMesh = new THREE.Mesh(this.extractPhysicsGeometryForId(physicsId), redMaterial)
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.physicsMesh = physicsMesh;
    physicsMesh.updateMatrixWorld()
    return physicsObject
  }
  addConvexShape(shapeAddress, position, quaternion, scale, dynamic = false, external = false, physicsGeometry = null) {
    const physicsId = getNextPhysicsId()
  
    physx.physxWorker.addConvexShapePhysics(
      this.scene,
      shapeAddress,
      position,
      quaternion,
      scale,
      dynamic,
      external,
      physicsId
    );
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      position,
      quaternion,
      scale
    )

    if (!physicsGeometry)
      physicsGeometry = this.extractPhysicsGeometryForId(physicsId);

    const physicsMesh = new THREE.Mesh(physicsGeometry, redMaterial);
  
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.physicsMesh = physicsMesh;
    physicsMesh.updateMatrixWorld();
    return physicsObject
  }
  getGeometryForPhysicsId(physicsId) {
    return physx.physxWorker.getGeometryPhysics(this.scene, physicsId);
  }
  getBoundingBoxForPhysicsId(physicsId, box) {
    return physx.physxWorker.getBoundsPhysics(this.scene, physicsId, box);
  }
  enableActor(physicsObject) {
    physx.physxWorker.enableActorPhysics(this.scene, physicsObject.physicsId)
  }
  disableActor(physicsObject) {
    physx.physxWorker.disableActorPhysics(this.scene, physicsObject.physicsId)
  }
  enableAppPhysics(app){
    const physicsObjects = app.getPhysicsObjects();
    for (let i = 0; i < physicsObjects.length; i++) {
      const physicsObject = physicsObjects[i]
      this.enableActor(physicsObject);
    } 
  }
  disableAppPhysics(app){
    const physicsObjects = app.getPhysicsObjects();
    for (let i = 0; i < physicsObjects.length; i++) {
      const physicsObject = physicsObjects[i]
      this.disableActor(physicsObject);
    } 
  }
  disableGeometry(physicsObject) {
    physx.physxWorker.disableGeometryPhysics(
      this.scene,
      physicsObject.physicsId
    )
  }
  enableGeometry(physicsObject) {
    physx.physxWorker.enableGeometryPhysics(
      this.scene,
      physicsObject.physicsId
    )
  }
  disableGeometryQueries(physicsObject) {
    physx.physxWorker.disableGeometryQueriesPhysics(
      this.scene,
      physicsObject.physicsId
    )
  }
  enableGeometryQueries(physicsObject) {
    physx.physxWorker.enableGeometryQueriesPhysics(
      this.scene,
      physicsObject.physicsId
    )
  }
  setMassAndInertia(physicsObject, mass, inertia) {
    physx.physxWorker.setMassAndInertiaPhysics(
      this.scene,
      physicsObject.physicsId,
      mass,
      inertia
    )
  }
  setGravityEnabled(physicsObject, enabled) {
    physx.physxWorker.setGravityEnabledPhysics(
      this.scene,
      physicsObject.physicsId,
      enabled
    )
  }
  removeGeometry(physicsObject) {
    physx.physxWorker.removeGeometryPhysics(
      this.scene,
      physicsObject.physicsId
    )
  
    freePhysicsId(physicsObject.physicsId)
  }
  getLinearVelocity(physicsObject, velocity) {
    physx.physxWorker.getLinearVelocityPhysics(this.scene, physicsObject.physicsId, velocity);
  }
  getAngularVelocity(physicsObject, velocity) {
    physx.physxWorker.getAngularVelocityPhysics(this.scene, physicsObject.physicsId, velocity);
  }
  getGlobalPosition(physicsObject, position) {
    physx.physxWorker.getGlobalPositionPhysics(
      this.scene,
      physicsObject.physicsId,
      position
    )
  }
  addForceAtPos(physicsObject, velocity, position, autoWake) {
    physx.physxWorker.addForceAtPosPhysics(this.scene, physicsObject.physicsId, velocity, position, autoWake);
  }
  addLocalForceAtPos(physicsObject, velocity, position, autoWake) {
    physx.physxWorker.addLocalForceAtPosPhysics(this.scene, physicsObject.physicsId, velocity, position, autoWake);
  }
  addForceAtLocalPos(physicsObject, velocity, position, autoWake) {
    physx.physxWorker.addForceAtLocalPosPhysics(this.scene, physicsObject.physicsId, velocity, position, autoWake);
  }
  addLocalForceAtLocalPos(physicsObject, velocity, position, autoWake) {
    physx.physxWorker.addLocalForceAtLocalPosPhysics(this.scene, physicsObject.physicsId, velocity, position, autoWake);
  }
  addForce(physicsObject, velocity, autoWake) {
    physx.physxWorker.addForcePhysics(this.scene, physicsObject.physicsId, velocity, autoWake);
  }
  addTorque(physicsObject, velocity, autoWake) {
    physx.physxWorker.addTorquePhysics(this.scene, physicsObject.physicsId, velocity, autoWake);
  }
  setVelocity(physicsObject, velocity, autoWake) {
    physx.physxWorker.setVelocityPhysics(
      this.scene,
      physicsObject.physicsId,
      velocity,
      autoWake
    )
  }
  setAngularVelocity(physicsObject, velocity, autoWake) {
    physx.physxWorker.setAngularVelocityPhysics(
      this.scene,
      physicsObject.physicsId,
      velocity,
      autoWake
    )
  }
  setTransform(physicsObject, autoWake) {
    physx.physxWorker.setTransformPhysics(
      this.scene,
      physicsObject.physicsId,
      physicsObject.position,
      physicsObject.quaternion,
      physicsObject.scale,
      autoWake
    )
  }
  setGeometryScale(physicsId, newScale) {
    physx.physxWorker.setGeometryScale(this.scene, physicsId, newScale)
  }
  getPath(
    start,
    dest,
    isWalk,
    hy,
    heightTolerance,
    maxIterDetect,
    maxIterStep,
    ignorePhysicsIds
  ) {
    return physx.physxWorker.getPathPhysics(
      this.scene,
      start,
      dest,
      isWalk,
      hy,
      heightTolerance,
      maxIterDetect,
      maxIterStep,
      ignorePhysicsIds
    )
  }
  overlapBox(hx, hy, hz, p, q) {
    return physx.physxWorker.overlapBoxPhysics(this.scene, hx, hy, hz, p, q)
  }
  overlapCapsule(radius, halfHeight, p, q) {
    return physx.physxWorker.overlapCapsulePhysics(
      this.scene,
      radius,
      halfHeight,
      p,
      q
    )
  }
  collideBox(hx, hy, hz, p, q, maxIter) {
    return physx.physxWorker.collideBoxPhysics(
      this.scene,
      hx,
      hy,
      hz,
      p,
      q,
      maxIter
    )
  }
  collideCapsule(radius, halfHeight, p, q, maxIter) {
    return physx.physxWorker.collideCapsulePhysics(
      this.scene,
      radius,
      halfHeight,
      p,
      q,
      maxIter
    )
  }
  getCollisionObject(radius, halfHeight, p, q) {
    return physx.physxWorker.getCollisionObjectPhysics(
      this.scene,
      radius,
      halfHeight,
      p,
      q
    )
  }
  createCharacterController(
    radius,
    height,
    contactOffset,
    stepOffset,
    position
  ) {
    const physicsId = getNextPhysicsId()
    const characterControllerId =
      physx.physxWorker.createCharacterControllerPhysics(
        this.scene,
        radius,
        height,
        contactOffset,
        stepOffset,
        position,
        physicsId
      )
    
    radius = radius + contactOffset;
    height = height + radius * 2;
  
    const halfHeight = height / 2;
    const physicsObject = new THREE.Object3D()
    const physicsMesh = new THREE.Mesh(
      new CapsuleGeometry(radius, radius, halfHeight * 2),
      redMaterial
    )
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsMesh.updateMatrixWorld()
    const { bounds } = this.getGeometryForPhysicsId(physicsId)
    physicsMesh.geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3().fromArray(bounds, 0),
      new THREE.Vector3().fromArray(bounds, 3)
    )
    // console.log('character controller bounds', physicsId, physicsMesh.geometry.boundingBox);
    physicsObject.physicsMesh = physicsMesh
    physicsObject.characterControllerId = characterControllerId
    physicsObject.physicsId = physicsId
  
    /* const physicsObject = _makePhysicsObject(physicsId, mesh.position, mesh.quaternion, mesh.scale);
    physicsObject.add(physicsMesh);
    physicsMesh.position.set(0, 0, 0);
    physicsMesh.quaternion.set(0, 0, 0, 1);
    physicsMesh.scale.set(1, 1, 1);
    physicsMesh.updateMatrixWorld();
    physicsObject.physicsMesh = physicsMesh;
    characterController.physicsObject = physicsObject;
    console.log('character controller id', physicsObject); */
  
    return physicsObject
  }
  destroyCharacterController(characterController) {
    physx.physxWorker.destroyCharacterControllerPhysics(
      this.scene,
      characterController.characterControllerId
    )
  }
  moveCharacterController(
    characterController,
    displacement,
    minDist,
    elapsedTime,
    position
  ) {
    const result = physx.physxWorker.moveCharacterControllerPhysics(
      this.scene,
      characterController.characterControllerId,
      displacement,
      minDist,
      elapsedTime,
      position
    )
    //console.log(result);
    return result
  }
  setCharacterControllerPosition(
    characterController,
    position
  ) {
    const result = physx.physxWorker.setCharacterControllerPositionPhysics(
      this.scene,
      characterController.characterControllerId,
      position
    )
    return result
  }
  raycast(position, quaternion) {
    return physx.physxWorker.raycastPhysics(this.scene, position, quaternion)
  }
  raycastArray(position, quaternion, n) {
    return physx.physxWorker.raycastPhysicsArray(this.scene, position, quaternion, n)
  }
  cutMesh(
    positions,
    numPositions,
    normals,
    numNormals,
    uvs,
    numUvs,
    faces, // Set to falsy to indicate that this is an non-indexed geometry
    numFaces,
  
    planeNormal, // normalized vector3 array
    planeDistance // number
  ) {
    return physx.physxWorker.doCut(
      positions,
      numPositions,
      normals,
      numNormals,
      uvs,
      numUvs,
      faces,
      numFaces,
  
      planeNormal,
      planeDistance
    );
  }
  setLinearLockFlags(physicsId, x, y, z) {
    physx.physxWorker.setLinearLockFlags(this.scene, physicsId, x, y, z)
  }
  setAngularLockFlags(physicsId, x, y, z) {
    physx.physxWorker.setAngularLockFlags(this.scene, physicsId, x, y, z)
  }
  sweepBox(
    origin,
    quaternion,
    halfExtents,
    direction,
    sweepDistance,
    maxHits
  ) {
    return physx.physxWorker.sweepBox(
      this.scene,
      origin,
      quaternion,
      halfExtents,
      direction,
      sweepDistance,
      maxHits
    )
  }
  sweepConvexShape(
    shapeAddress,
    origin,
    quaternion,
    direction,
    sweepDistance,
    maxHits,
  ) {
    return physx.physxWorker.sweepConvexShape(
      this.scene,
      shapeAddress,
      origin,
      quaternion,
      direction,
      sweepDistance,
      maxHits,
    )
  }
  simulatePhysics(timeDiff) {
    if (this.physicsEnabled) {
      const t = timeDiff / 1000
      const updatesOut = physx.physxWorker.simulatePhysics(
        this.scene,
        physicsUpdates,
        t
      )
      // physicsUpdates.length = 0
      _updatePhysicsObjects(updatesOut);
    }
  }
  //
  marchingCubes(dims, potential, shift, scale) {
    return physx.physxWorker.marchingCubes(dims, potential, shift, scale);
  }
  //
  createShape(buffer) {
    return physx.physxWorker.createShapePhysics(this.scene, buffer);
  }
  createConvexShape(buffer) {
    return physx.physxWorker.createConvexShapePhysics(this.scene, buffer);
  }
  getPhysicsEnabled() {
    return this.physicsEnabled;
  }
  setPhysicsEnabled(newPhysicsEnabled) {
    this.physicsEnabled = newPhysicsEnabled;
  }
  getGravity() {
    return gravity;
  }
  setTrigger(id) {
    return physx.physxWorker.setTriggerPhysics(
      this.scene, id,
    )
  }
  getTriggerEvents() {
    const triggerEvents = physx.physxWorker.getTriggerEventsPhysics(
      this.scene,
    )
    triggerEvents.forEach(triggerEvent => {
      const {status, triggerPhysicsId, otherPhysicsId} = triggerEvent;
      const triggerApp = metaversefileApi.getAppByPhysicsId(triggerPhysicsId);
      const otherApp = metaversefileApi.getAppByPhysicsId(otherPhysicsId);
      if (triggerApp) {
        if (status === 4) {
          triggerApp.dispatchEvent({type: 'triggerin', oppositePhysicsId: otherPhysicsId});
        } else if (status === 16) {
          triggerApp.dispatchEvent({type: 'triggerout', oppositePhysicsId: otherPhysicsId});
        }
      }
      if (otherApp) {
        if (status === 4) {
          otherApp.dispatchEvent({type: 'triggerin', oppositePhysicsId: triggerPhysicsId});
        } else if (status === 16) {
          otherApp.dispatchEvent({type: 'triggerout', oppositePhysicsId: triggerPhysicsId});
        }
      }
    })
    return triggerEvents;
  }
}

const physicsManager = {
  scenes: new Map(),
  getScene(instance = null) {
    let scene = this.scenes.get(instance);
    if (!scene) {
      scene = new PhysicsScene();
      this.scenes.set(instance, scene);
    }
    return scene;
  },
};
export default physicsManager;