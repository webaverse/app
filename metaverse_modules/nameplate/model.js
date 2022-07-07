import {Box3} from 'three';
import {Geometry} from 'three/examples/jsm/deprecated/Geometry';

const addToMaterials = (materials, newMaterial) => {
  for (let i = 0; i < materials.length; i++) {
    const mat = materials[i];
    if (mat.name === newMaterial.name) {
      return [materials, i];
    }
  }
  materials.push(newMaterial);
  return [materials, materials.length - 1];
};

export const getModelGeoMat = model => {
  const newGeometry = new Geometry();
  let newMaterials = [];
  model.scene.traverse(function(child) {
    if (child.type === 'Mesh') {
      const materialIndices = [];
      let newItems;
      if (child.material.length) {
        for (let k = 0; k < child.material.length; k++) {
          newItems = addToMaterials(newMaterials, child.material[k]);
          newMaterials = newItems[0];
          materialIndices.push(newItems[1]);
        }
      } else {
        newItems = addToMaterials(newMaterials, child.material); // materials.push(child.material);
        newMaterials = newItems[0];
        materialIndices.push(newItems[1]);
      }

      if (child.geometry.isBufferGeometry) {
        const tGeometry = new Geometry().fromBufferGeometry(child.geometry);
        tGeometry.faces.forEach(face => {
          // face.materialIndex = face.materialIndex + newMaterials.length;
          face.materialIndex = materialIndices[face.materialIndex];
        });
        child.updateMatrix();
        newGeometry.merge(tGeometry, child.matrix);
      } else {
        child.geometry.faces.forEach(face => {
          // face.materialIndex = face.materialIndex + newMaterials.length;
          face.materialIndex = materialIndices[face.materialIndex];
        });
        child.updateMatrix();
        newGeometry.mergeMesh(child);
      }
    }
  });
  return {
    geometry: newGeometry.toBufferGeometry(),
    material: newMaterials,
  };
};

export const getBoundingBox = mesh => {
  const boundingBox = new Box3();
  boundingBox.copy(mesh.geometry.boundingBox);
  mesh.updateMatrixWorld(true);
  boundingBox.applyMatrix4(mesh.matrixWorld);
  return boundingBox;
};
