import * as THREE from 'three';
import React, {useState, useEffect, useContext} from 'react';
import classnames from 'classnames';
import style from './DragAndDrop.module.css';
import {world} from '../world.js';
import {getRandomString, handleUpload} from '../util.js';
import {registerIoEventHandler, unregisterIoEventHandler} from './components/general/io-handler/IoHandler.jsx';
import {registerLoad} from './LoadingBox.jsx';
import {ObjectPreview} from './ObjectPreview.jsx';
import game from '../game.js';
import {getRenderer} from '../renderer.js';
import cameraManager from '../camera-manager.js';
import metaversefile from 'metaversefile';
import { AppContext } from './components/app';

const _upload = () => new Promise((accept, reject) => {
  const input = document.createElement('input');
  input.type = 'file';
  // input.setAttribute('webkitdirectory', '');
  // input.setAttribute('directory', '');
  input.setAttribute('multiple', '');
  input.click();
  input.addEventListener('change', async e => {
    // const name = 'Loading';
    // const description = e.target.files ? e.target.files[0].name : `${e.target.files.length} files`;
    // const load = registerLoad(name, description, 0);
    const o = await uploadCreateApp(e.target.files);
    // load.end();
  });
});
const _isJsonItem = item => item?.kind === 'string';
const uploadCreateApp = async (item, {
  drop = false,
}) => {
  let u;
  {
    let load = null;
    u = await handleUpload(item, {
      onTotal(total) {
        const type = 'upload';
        const name = item.name;
        load = registerLoad(type, name, 0, total);
      },
      onProgress(e) {
        if (load) {
          load.update(e.loaded, e.total);
        } else {
          const type = 'upload';
          const name = item.name;
          load = registerLoad(type, name, e.loaded, e.total);
        }
      },
    });
    if (load) {
      load.end();
    }
  }

  let o = null;
  if (u) {
    const type = 'download';
    const name = item.name;
    const load = registerLoad(type, name);
    try {
      o = await metaversefile.createAppAsync({
        start_url: u,
        in_front: drop,
        components: {
          physics: true,
        },
      });
    } catch(err) {
      console.warn(err);
    }
    load.end();
  }

  if (o) {
    o.contentId = u;
    o.instanceId = getRandomString();
    return o;
  } else {
    return null;
  }
};

const DragAndDrop = () => {
  const { state, setState, } = useContext( AppContext )
  const [queue, setQueue] = useState([]);
  const [currentApp, setCurrentApp] = useState(null);

  useEffect(() => {
    function keydown(e) {
      if (game.inputFocused()) return true;

      switch (e.which) {
        case 79: { // O
          (async () => {
            const app = await _upload();
            setQueue(queue.concat([app]));
          })();
  
          return false;
        }
        case 27: { // esc
          setCurrentApp(null);

          return false;
        }
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

      const renderer = getRenderer();
      if (e.target === renderer.domElement) {
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
          const drop = _isJsonItem(item);
          const app = await uploadCreateApp(item, {
            drop,
          });
          if (app) {
            if (drop) {
              world.appManager.importApp(app);
              setState({ openedPanel: null });
            } else {
              setQueue(queue.concat([app]));
            }
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
      }
    };
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', dragover);
      window.removeEventListener('drop', drop);
    };
  }, []);

  useEffect(() => {
    if (queue.length > 0 && !currentApp) {
      const app = queue[0];
      // console.log('set app', app);
      setCurrentApp(app);
      setQueue(queue.slice(1));
      setState({ openedPanel: null });

      if (cameraManager.pointerLockElement) {
        cameraManager.exitPointerLock();
      }
    }
  }, [queue, currentApp]);

  const _currentAppClick = e => {
    e.preventDefault();
    e.stopPropagation();
  };
  const _importApp = app => {
    const localPlayer = metaversefile.useLocalPlayer();
    const position = localPlayer.position.clone()
      .add(new THREE.Vector3(0, 0, -2).applyQuaternion(localPlayer.quaternion));
    const quaternion = localPlayer.quaternion;

    app.position.copy(position);
    app.quaternion.copy(quaternion);
    app.updateMatrixWorld();

    world.appManager.importApp(app);
  };
  const _drop = async e => {
    e.preventDefault();
    e.stopPropagation();

    if (currentApp) {
      _importApp(currentApp);
      setCurrentApp(null);
    }
  };
  const _equip = e => {
    e.preventDefault();
    e.stopPropagation();

    if (currentApp) {
      const app = currentApp;
      _importApp(app);
      app.activate();
      setCurrentApp(null);
    }
  };
  const _mint = e => {
    e.preventDefault();
    e.stopPropagation();

    console.log('mint', currentApp);
  };
  const _cancel = e => {
    e.preventDefault();
    e.stopPropagation();

    setCurrentApp(null);
  };

  const name = currentApp ? currentApp.name : '';
  const appType = currentApp ? currentApp.appType : '';

  return (
    <div className={style.dragAndDrop}>
      <div className={classnames(style.currentApp, currentApp ? style.open : null)} onClick={_currentAppClick}>
        <h1 className={style.heading}>Upload object</h1>
        <div className={style.body}>
          <ObjectPreview object={currentApp} className={style.canvas} />
          <div className={style.wrap}>
            <div className={style.row}>
              <div className={style.label}>Name: </div>
              <div className={style.value}>{name}</div>
            </div>
            <div className={style.row}>
              <div className={style.label}>Type: </div>
              <div className={style.value}>{appType}</div>
            </div>
          </div>
        </div>
        <div className={style.footer}>
          <div className={style.buttons}>
            <div className={style.button} onClick={_drop}>
              <span>Drop</span>
              <sub>to world</sub>
            </div>
            <div className={style.button} onClick={_equip}>
              <span>Equip</span>
              <sub>to self</sub>
            </div>
            <div className={style.button} disabled onClick={_mint}>
              <span>Mint</span>
              <sub>on chain</sub>
            </div>
          </div>
          <div className={style.buttons}>
            <div className={classnames(style.button, style.small)} onClick={_cancel}>
              <span>Cancel</span>
              <sub>back to game</sub>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export {
  DragAndDrop,
};