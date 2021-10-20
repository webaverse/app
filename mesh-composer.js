const _otherSideIndex = i => i === 1 ? 0 : 1;
class MeshComposer {
  constructor() {
    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(THING_SHADER.uniforms),
      vertexShader: THING_SHADER.vertexShader,
      fragmentShader: THING_SHADER.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
    });
    this.meshes = [];
    this.placeMeshes = [null, null];
    this.hoveredMeshes = [null, null];
    this.targetMeshes = [_makeTargetMesh(), _makeTargetMesh()];
    for (const targetMesh of this.targetMeshes) {
      targetMesh.visible = false;
      scene.add(targetMesh);
    }

    this.placeMeshStates = [null, null];
    this.scaleState = null;
  }
  getPlaceMesh(index) {
    return this.placeMeshes[index];
  }
  setPlaceMesh(index, mesh) {
    scene.add(mesh);
    this.meshes.push(mesh);
    this.placeMeshes[index] = mesh;
    
    const transforms = _getRigTransforms();
    this.placeMeshStates[index] = {
      startPosition: transforms[index].position.clone(),
      startQuaternion: transforms[index].quaternion.clone(),
      containerStartMatrix: new THREE.Matrix4().compose(transforms[index].position, transforms[index].quaternion, new THREE.Vector3(1, 1, 1)),
    };
  }
  addMesh(mesh) {
    this.meshes.push(mesh);
    scene.add(mesh);
  }
  isLatched(mesh) {
    return this.placeMeshes.includes(mesh); 
  }
  isPinching() {
    return this.placeMeshes[0] !== null && this.placeMeshes[0] === this.placeMeshes[1];
  }
  trigger(index) {
    this.placeMeshes[index] = null;
    this.placeMeshStates[index] = null;
  }
  grab(index) {
    const mesh = this.hoveredMeshes[index];
    if (mesh) {
      const transforms = _getRigTransforms();

      this.placeMeshes[index] = mesh;
      this.placeMeshStates[index] = {
        startPosition: transforms[index].position.clone(),
        startQuaternion: transforms[index].quaternion.clone(),
        containerStartMatrix: mesh.matrix.clone(),
      };

      if (this.isPinching()) {
        this.scaleState = {
          container: mesh,
          startPosition: transforms[0].position.clone()
            .add(transforms[1].position)
            .divideScalar(2),
          startDirection: transforms[0].position.clone()
            .sub(transforms[1].position)
            .normalize(),
          startWorldWidth: transforms[0].position
            .distanceTo(transforms[1].position),
          containerStartPosition: mesh.position.clone(),
          containerStartQuaternion: mesh.quaternion.clone(),
          containerStartScale: mesh.scale.clone(),
          containerStartMatrix: mesh.matrix.clone(),
        };
      }
    }
  }
  ungrab(index) {
    if (this.isPinching()) {
      const transforms = rigManager.getRigTransforms();
      const otherSideIndex = _otherSideIndex(index);
      this.placeMeshStates[otherSideIndex] = {
        startPosition: transforms[otherSideIndex].position.clone(),
        startQuaternion: transforms[otherSideIndex].quaternion.clone(),
        containerStartMatrix: this.placeMeshes[otherSideIndex].matrix.clone(),
      };
    }
    this.placeMeshes[index] = null;
    this.placeMeshStates[index] = null;
    this.scaleState = null;
  }
  update() {
    const transforms = rigManager.getRigTransforms();
    this.hoveredMeshes = transforms.map((transform, index) => {
      const {position, quaternion} = transform;
      localMatrix.compose(position, quaternion, localVector2.set(1, 1, 1));

      let closestMesh = null;
      let closestMeshDistance = Infinity;
      for (const mesh of this.meshes) {
        localMatrix2.copy(localMatrix)
          .premultiply(localMatrix3.getInverse(mesh.matrixWorld))
          .decompose(localVector, localQuaternion, localVector2);

        if (mesh.geometry.boundingBox.containsPoint(localVector)) {
          const distance = localVector.distanceTo(position);
          if (distance < closestMeshDistance) {
            closestMesh = mesh;
            closestMeshDistance = distance;
          }
        }
      }
      return closestMesh;
    });
    if (this.isPinching()) { // pinch
      const {scaleState} = this;
      const {container} = scaleState;
      const startPosition = scaleState.startPosition.clone()
        // .applyMatrix4(new THREE.Matrix4().getInverse(scaleState.containerStartMatrix));
      const currentPosition = transforms[0].position.clone()
        .add(transforms[1].position)
        .divideScalar(2)
        // .applyMatrix4(new THREE.Matrix4().getInverse(scaleState.containerStartMatrix));
      const currentDirection = transforms[0].position.clone()
        .sub(transforms[1].position)
        .normalize();
      const currentWorldWidth = transforms[0].position
        .distanceTo(transforms[1].position);
      const currentEuler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(scaleState.startDirection, currentDirection), 'YXZ');
      currentEuler.x = 0;
      currentEuler.z = 0;
      const currentQuaternion = new THREE.Quaternion().setFromEuler(currentEuler);
      const scaleFactor = currentWorldWidth/scaleState.startWorldWidth;
      const positionDiff = currentPosition.clone().sub(startPosition);

      container.matrix
        .copy(scaleState.containerStartMatrix)
        .premultiply(localMatrix.makeTranslation(-scaleState.containerStartPosition.x, -scaleState.containerStartPosition.y, -scaleState.containerStartPosition.z))
        .premultiply(localMatrix.makeScale(scaleFactor, scaleFactor, scaleFactor))
        .premultiply(localMatrix.makeRotationFromQuaternion(currentQuaternion))
        .premultiply(localMatrix.makeTranslation(scaleState.containerStartPosition.x, scaleState.containerStartPosition.y, scaleState.containerStartPosition.z))
        .premultiply(localMatrix.makeTranslation(positionDiff.x, positionDiff.y, positionDiff.z))
        .decompose(container.position, container.quaternion, container.scale);
    } else { // move
      for (let i = 0; i < transforms.length; i++) {
        if (this.placeMeshes[i]) {
          const transform = transforms[i];
          const {position, quaternion} = transform;
          const {startPosition, startQuaternion, containerStartMatrix} = this.placeMeshStates[i];

          this.placeMeshes[i].matrix.copy(containerStartMatrix)
            .premultiply(localMatrix.makeTranslation(-startPosition.x, -startPosition.y, -startPosition.z))
            .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion.copy(startQuaternion).inverse()))
            .premultiply(localMatrix.makeRotationFromQuaternion(quaternion))
            .premultiply(localMatrix.makeTranslation(position.x, position.y, position.z))
            .decompose(this.placeMeshes[i].position, this.placeMeshes[i].quaternion, this.placeMeshes[i].scale);
        }
      }
    }
    for (let i = 0; i < transforms.length; i++) {
      this.targetMeshes[i].visible = false;

      if (this.hoveredMeshes[i]) {
        this.targetMeshes[i].position.copy(this.hoveredMeshes[i].position)
          .add(
            this.hoveredMeshes[i].geometry.boundingBox.getCenter(new THREE.Vector3())
              .multiply(this.hoveredMeshes[i].scale)
              .applyQuaternion(this.hoveredMeshes[i].quaternion)
          );
        this.targetMeshes[i].quaternion.copy(this.hoveredMeshes[i].quaternion);
        this.hoveredMeshes[i].geometry.boundingBox.getSize(this.targetMeshes[i].scale)
          .multiply(this.hoveredMeshes[i].scale);
        this.targetMeshes[i].visible = true;
      }
    }
  }
  intersect(raycaster) {
    let closestMesh = null;
    let closestMeshDistance = Infinity;
    for (const mesh of this.meshes) {
      localMatrix.compose(
        raycaster.ray.origin,
        localQuaternion.setFromUnitVectors(
          localVector2.set(0, 0, -1),
          raycaster.ray.direction
        ),
        localVector2.set(1, 1, 1)
      )
        .premultiply(localMatrix2.getInverse(mesh.matrixWorld))
        .decompose(localVector, localQuaternion, localVector2);
      localRaycaster.ray.origin.copy(localVector);
      localRaycaster.ray.direction.set(0, 0, -1).applyQuaternion(localQuaternion);
      if (mesh.geometry.boundingBox) {
        const point = localRaycaster.ray.intersectBox(mesh.geometry.boundingBox, localVector);
        if (point) {
          point.applyMatrix4(mesh.matrixWorld);
          return {
            object: mesh,
            point: point.clone(),
            anchor: null,
            uv: new THREE.Vector2(),
          };
        }
      }
    }
    return null;
  }
  async run() {
    if (this.meshes.length === 1) {
      const [mesh] = this.meshes;
      if (mesh.userData.gltfExtensions.EXT_hash) {
        const u = `${storageHost}/${mesh.userData.gltfExtensions.EXT_hash}`;
        await rigManager.setLocalAvatarUrl(u);
      }
    }
  }
  commit() {
    const {meshes} = this;
    if (meshes.length > 0) {
      const center = new THREE.Vector3();
      for (const mesh of this.meshes) {
        center.add(mesh.position);
      }
      center.divideScalar(meshes.length);
      for (const mesh of this.meshes) {
        mesh.position.sub(center);
        mesh.updateMatrixWorld();
      }

      const geometries = [];
      const textures = [];
      for (const mesh of this.meshes) {
        geometries.push(mesh.geometry);
        if (mesh.material.uniforms.map && mesh.material.uniforms.map.value) {
          textures.push(mesh.material.uniforms.map.value);
        } else {
          textures.push(null);
        }
      }

      const mesh = mergeMeshes(meshes, geometries, textures);
      const material = meshComposer.material.clone();
      material.uniforms.map.value = mesh.material.map;
      material.uniforms.map.needsUpdate = true;
      mesh.material = material;

      for (const mesh of this.meshes) {
        mesh.geometry.dispose();
        scene.remove(mesh);
      }
      this.meshes.length = 0;

      return mesh;
    } else {
      return null;
    }
  }
  cancel() {
    for (const mesh of this.meshes) {
      scene.remove(mesh);
    }
    this.meshes.length = 0;
  }
}

export default MeshComposer;