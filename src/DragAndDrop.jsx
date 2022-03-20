import React, {useEffect} from 'react';
import style from './DragAndDrop.module.css';
import {handleUpload} from '../util.js';
import {registerIoEventHandler, unregisterIoEventHandler} from './IoHandler.jsx';
import {registerLoad} from './LoadingBox.jsx';

const DragAndDrop = () => {
  const _upload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    // input.setAttribute('webkitdirectory', '');
    // input.setAttribute('directory', '');
    input.setAttribute('multiple', '');
    input.click();
    input.addEventListener('change', async e => {
      const load = registerLoad('loading', 'file', 0);
      const u = await handleUpload(e.target.files);
      load.update(1);
    });
  };

  useEffect(() => {
    function keydown(e) {
      if (e.which === 85) { // U
        _upload();
      }
    }
    registerIoEventHandler('keydown', keydown);
    return () => {
      unregisterIoEventHandler('keydown');
    };
  }, []);

  useEffect(() => {
    function dragover(e) {
      e.preventDefault();
    }
    window.addEventListener('dragover', dragover);
    const drop = async e => {
      e.preventDefault();
    
      /* const renderer = getRenderer();
      const rect = renderer.domElement.getBoundingClientRect();
      localVector2D.set(
        ( e.clientX / rect.width ) * 2 - 1,
        - ( e.clientY / rect.height ) * 2 + 1
      );
      localRaycaster.setFromCamera(localVector2D, camera);
      const dropZOffset = 2;
      const position = localRaycaster.ray.origin.clone()
        .add(
          localVector2.set(0, 0, -dropZOffset)
            .applyQuaternion(
              localQuaternion
                .setFromRotationMatrix(localMatrix.lookAt(
                  localVector3.set(0, 0, 0),
                  localRaycaster.ray.direction,
                  localVector4.set(0, 1, 0)
                ))
            )
        );
      const quaternion = camera.quaternion.clone(); */

      const items = Array.from(e.dataTransfer.items);
      await Promise.all(items.map(async item => {
        await handleUpload(item/*, {
          position,
          quaternion,
        }*/);
      }));
    
      /* let arrowLoader = metaverseUi.makeArrowLoader();
      arrowLoader.position.copy(position);
      arrowLoader.quaternion.copy(quaternion);
      scene.add(arrowLoader);
      arrowLoader.updateMatrixWorld();
    
      if (arrowLoader) {
        scene.remove(arrowLoader);
        arrowLoader.destroy();
      } */
    };
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', dragover);
      window.removeEventListener('drop', drop);
    };
  }, []);

  return (
    <div className={style.dragAndDrop}>
      
    </div>
  );
};
export {
  DragAndDrop,
};