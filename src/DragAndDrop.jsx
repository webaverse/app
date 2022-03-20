import React, {useState, useEffect} from 'react';
import style from './DragAndDrop.module.css';
import {handleUpload} from '../util.js';
import {registerIoEventHandler, unregisterIoEventHandler} from './IoHandler.jsx';
import {registerLoad} from './LoadingBox.jsx';
import metaversefile from 'metaversefile';

const _upload = () => new Promise((accept, reject) => {
  const input = document.createElement('input');
  input.type = 'file';
  // input.setAttribute('webkitdirectory', '');
  // input.setAttribute('directory', '');
  input.setAttribute('multiple', '');
  input.click();
  input.addEventListener('change', async e => {
    const name = 'Loading';
    const description = e.target.files ? e.target.files[0].name : `${e.target.files.length} files`;
    const load = registerLoad(name, description, 0);
    const o = await uploadCreateApp(e.target.files);
    load.end();
  });
});
const uploadCreateApp = async item => {
  const u = await handleUpload(item);
  let o = null;
  try {
    o = await metaversefile.createAppAsync({
      start_url: u,
    });
  } catch(err) {
    console.warn(err);
  }
  if (o) {
    o.contentId = u;
    return o;
  } else {
    return null;
  }
};

const DragAndDrop = () => {
  const [queue, setQueue] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);

  useEffect(() => {
    async function keydown(e) {
      if (e.which === 85) { // U
        const u = await _upload();
        setQueue(queue.concat([u]));
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
        const name = 'Loading';
        const description = item.name;
        const load = registerLoad(name, description, 0);
        const o = await uploadCreateApp(item/*, {
          position,
          quaternion,
        }*/);
        load.end();
        if (o) {
          setQueue(queue.concat([o]));
        }
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

  useEffect(() => {
    if (queue.length > 0 && !currentFile) {
      const f = queue[0];
      setCurrentFile(f);
      setQueue(queue.slice(1));
    }
  }, [queue]);

  return (
    <div className={style.dragAndDrop}>
      {currentFile ? (
        <div className={style.currentFile}>{currentFile.name}</div>
      ): null}
    </div>
  );
};
export {
  DragAndDrop,
};