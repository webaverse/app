import {Geometry} from 'three/examples/jsm/deprecated/Geometry';

function addToMaterials(materials, newMaterial) {
  const index = materials.findIndex(el => el.name === newMaterial.name);
  if (index > -1) return index;
  else {
    materials.push(newMaterial);
    return materials.length - 1;
  }
}

// return single geometry combining children's geometries into one.
export const getModelGeoMat = model => {
  const newGeometry = new Geometry();
  const newMaterials = [];
  model.scene.traverse(function(child) {
    if (child.type === 'Mesh') {
      const materialIndices = [];
      if (child.material.length) {
        for (let k = 0; k < child.material.length; k++) {
          materialIndices.push(addToMaterials(newMaterials, child.material[k]));
        }
      } else {
        materialIndices.push(addToMaterials(newMaterials, child.material));
      }
      if (child.geometry.isBufferGeometry) {
        const tGeometry = new Geometry().fromBufferGeometry(child.geometry);
        tGeometry.faces.forEach(face => {
          face.materialIndex = materialIndices[face.materialIndex];
        });
        child.updateMatrix();
        newGeometry.merge(tGeometry, child.matrix);
      } else {
        child.geometry.faces.forEach(face => {
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

export const getSingleModelGeoMat = model => {
  let count = 0;
  let geometry, material;
  model.scene.traverse(child => {
    if (child.type === 'Mesh' && count < 1) {
      geometry = child.geometry;
      material = child.material;
      count++;
    }
  });
  return {geometry, material};
};
