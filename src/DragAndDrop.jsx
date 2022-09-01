import * as THREE from 'three';
import React, {useState, useEffect, useContext, useRef} from 'react';
import classnames from 'classnames';
import style from './DragAndDrop.module.css';
import {world} from '../world.js';
import {getRandomString, handleUpload, handleBlobUpload, getObjectJson} from '../util.js';
import {registerIoEventHandler, unregisterIoEventHandler} from './components/general/io-handler/IoHandler.jsx';
import {GenericLoadingMessage, LoadingIndicator, registerLoad} from './LoadingBox.jsx';
import {ObjectPreview} from './ObjectPreview.jsx';
import game from '../game.js';
import {getRenderer} from '../renderer.js';
import cameraManager from '../camera-manager.js';
import metaversefile from 'metaversefile';
import { AppContext } from './components/app';
import useNFTContract from './hooks/useNFTContract';
import NFTDetailsForm from './components/web3/NFTDetailsForm';
import { isChainSupported } from './hooks/useChain';
import { ChainContext } from './hooks/chainProvider';
import { AccountContext } from './hooks/web3AccountProvider';
import Web3 from '../web3.min.js';
import ioManager from '../io-manager.js';
import dropManager from '../drop-manager';

const APP_3D_TYPES = ['glb', 'gltf', 'vrm'];
const timeCount = 6000;

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
  const {state, setState, account, chain} = useContext(AppContext);
  const [queue, setQueue] = useState([]);
  const [currentApp, setCurrentApp] = useState(null);
  const {mintNFT, minting, error, setError, WebaversecontractAddress} = useNFTContract(account.currentAddress);
  const [mintComplete, setMintComplete] = useState(false);
  const [pendingTx, setPendingTx] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [nftName, setNFTName] = useState(null);
  const [nftDetails, setNFTDetails] = useState(null);
  const {selectedChain} = useContext(ChainContext);
  const canvasRef = useRef(null);

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
          const j = getObjectJson();
        //   if (app) {
        //     console.log("DragAndDrop", app, j)
        //     console.log(j.voucher)
        //     if (j && j.claimed) {
        //       if(ioManager.keys.ctrl) {
        //         world.appManager.importClaimedApp(app, j, account.currentAddress, WebaversecontractAddress);
        //       } else {
        //         world.appManager.importApp(app);
        //       }
        //       setState({ openedPanel: null });
        //     } else if (drop) {
        //         console.log("swapns drop", j, drop)
        //       world.appManager.importApp(app);
        //       setState({ openedPanel: null });
        //     } else {
        //       setQueue(queue.concat([app]));
        //     }
        //   }
          if (app) {
            if (j && j.voucher) { // has voucher = claimable
                world.appManager.importHadVoucherApp(app, j)
                dropManager.removeClaim(j)
                setState({ openedPanel: null });
            } else if (j && j.voucher == undefined) { // already claimed 
                if (ioManager.keys.ctrl) {
                    world.appManager.importNeedUserVoucherApp(app, j, account.currentAddress, WebaversecontractAddress); // already claimed but permanent-drop
                } else {
                    world.appManager.importApp(app); // already claimed but safe-drop
                }
                setState({ openedPanel: null });
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
  });
  useEffect(async () => {
    if (queue.length > 0 && !currentApp) {
      const app = queue[0];
      setCurrentApp(app);
      setQueue(queue.slice(1));
      setState({ openedPanel: null });

      if (cameraManager.pointerLockElement) {
        cameraManager.exitPointerLock();
      }
    }
  }, [queue, currentApp]);
  const getUserAddress = () => {
    return account;
  }
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
  const _mint = async e => {
    e.preventDefault();
    e.stopPropagation();
    if (currentApp) {
      const app = currentApp;
      await mintNFT(app, previewImage, () => {
        setPreviewImage(null);
        setCurrentApp(null);
        setPendingTx(true)
      }, () => {
        setMintComplete(true);
        setPendingTx(false)
      });
    }
    setCurrentApp(null);
  };
  const _cancel = e => {
    e.preventDefault();
    e.stopPropagation();

    setCurrentApp(null);
  };

  const name = currentApp ? currentApp.name : '';
  const appType = currentApp ? currentApp.appType : '';

  useEffect(() => {
    if (mintComplete) {
      setTimeout(() => {
        setMintComplete(false);
      }, timeCount);
    }
  }, [mintComplete]);

  useEffect(() => {
    if (error) {
      let timer = setTimeout(() => {
        setError('');
      }, timeCount);
      return () => {
        clearTimeout(timer);
      }
    }
  }, [error]);

  async function createPreview() {
    const filename = `${name}-preview.png`;
    const type = 'upload';
    canvasRef.current.toBlob(async function (blob) {
      let load = null;
      const previewURL = await handleBlobUpload(filename, blob, {
        onTotal(total) {
          load = registerLoad(type, filename, 0, total);
        },
        onProgress(e) {
          if (load) {
            load.update(e.loaded, e.total);
          } else {
            load = registerLoad(type, filename, e.loaded, e.total);
          }
        },
      });

      if (load) {
        load.end();
      }
      setPreviewImage(previewURL);
    });
  }

  useEffect(() => {
    if (!currentApp) return;

    if (APP_3D_TYPES.includes(currentApp.appType)) {
      let timer = setTimeout(() => {
        createPreview();
      }, timeCount/2);
      return () => {
        clearTimeout(timer)
      }
    }
  }, [currentApp]);

  return (
    <div className={style.dragAndDrop}>
      <GenericLoadingMessage open={minting} name={'Minting'} detail={'Creating NFT...'}></GenericLoadingMessage>
      <GenericLoadingMessage open={mintComplete} name={'Minting Complete'} detail={'Press [Tab] to use your inventory.'}></GenericLoadingMessage>
      <GenericLoadingMessage open={error} name={'Error'} detail={error}></GenericLoadingMessage>
      <div className={classnames(style.currentApp, currentApp ? style.open : null)} onClick={_currentAppClick}>
        <h1 className={style.heading}>Upload object</h1>
        <div className={style.body}>
          <div style={{position: 'relative'}}>
            {currentApp && APP_3D_TYPES.includes(currentApp.appType) && <button style={{
              border: '2px',
              borderColor: 'white',
              background: 'black',
              color: 'white',
              position: 'absolute',
              left: '0px',
              bottom: '0px',
              width: 'calc(100% - 20px)',
              padding: '10px',
              cursor: 'pointer',
            }} onClick={createPreview}>Create New Thumbnail</button>}
            <ObjectPreview
              ref={canvasRef}
              object={currentApp}
              className={style.canvas}
              width={512}
              height={512}
            />
          </div>
          <div className={style.wrap}>
            <div className={style.row}>
              <NFTDetailsForm initialName={name} previewImage={previewImage} onChange={({name, details}) => {
                if (currentApp) {
                  currentApp.name = name;
                  currentApp.description = details;
                }
              }} />
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
            <div className={style.button} disabled={!isChainSupported(selectedChain) || !account.currentAddress || pendingTx} onClick={_mint}>
              <span>Mint</span>
              <sub>on {selectedChain.name}</sub>
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