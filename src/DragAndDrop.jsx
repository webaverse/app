import * as THREE from 'three';
import React, {useState, useEffect, useContext} from 'react';
import classnames from 'classnames';
import style from './DragAndDrop.module.css';
import { ThreeDots } from "react-loader-spinner"
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
import { ethers, BigNumber } from 'ethers'
import { NFTABI, NFTcontractAddress, FTABI, FTcontractAddress } from "../src/abis/contract"
import {
    ToastContainer,
    toast
} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

  const { ethereum } = window;
  if (ethereum) {
    var provider = new ethers.providers.Web3Provider(ethereum);
  }

  const { state, setState, walletstate, setWalletState } = useContext( AppContext )
  const [queue, setQueue] = useState([]);
  const [currentApp, setCurrentApp] = useState(null);
  const [mintBtnEnable, setMintBtnEnable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isMetaMaskConnected = () => {
    return walletstate.walletaddress ? true : false; 
    // const accounts = await provider.listAccounts();
    // return accounts.length > 0;
  }

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

  useEffect(async () => {
    if (queue.length > 0 && !currentApp) {
      const app = queue[0];
      console.log('set app', app);

      setCurrentApp(app);
      setQueue(queue.slice(1));
      setState({ openedPanel: null });

      if (cameraManager.pointerLockElement) {
        cameraManager.exitPointerLock();
      }
    }
  }, [queue, currentApp]);

  useEffect(() => {
      const connectedWallet = isMetaMaskConnected()
      setMintBtnEnable(connectedWallet)
  },[walletstate.walletaddress])


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
    if(!mintBtnEnable) return false;
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    console.log('mint', currentApp);

    // console.log("process.env.SERVER_HOST", process.env.UPLOAD_URL)
    // switch Polygon main network
    // try {
    //   await ethereum.request({
    //     method: 'wallet_switchEthereumChain',
    //     params: [{ chainId: VITE_APP_POLYGON_MAINNET_CHAIN_ID }],
    //   });
    // } catch (switchError) {
    //   console.log(switchError);
    //   // This error code indicates that the chain has not been added to MetaMask.
    //   if (switchError.code === 4902) {
    //     try {
    //       await ethereum.request({
    //         method: 'wallet_addEthereumChain',
    //         params: [
    //           {
    //             chainId: VITE_APP_POLYGON_MAINNET_CHAIN_ID,
    //             chainName: 'Polygon Mainnet',
    //             rpcUrls: [import.meta.env.VITE_APP_POLYGON_MAINNET_RPC_URL] /* ... */,
    //             nativeCurrency: {
    //               name: "MATIC",
    //               symbol: "MATIC", // 2-6 characters long
    //               decimals: 18,
    //             },
    //             blockExplorerUrls: [import.meta.env.VITE_APP_POLYGON_MAINNET_BLOCK_EXPLORER_URL],
    //           },
    //         ],
    //       });
    //     } catch (addError) {
    //       // handle "add" error
    //     }
    //   }
    //   // handle other "switch" errors
    // }

    //switch Polygon testnet
    try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: VITE_APP_POLYGON_TESTNET_CHAIN_ID }],
        });
      } catch (switchError) {
        console.log(switchError);
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: VITE_APP_POLYGON_TESTNET_CHAIN_ID,
                  chainName: "Polygon Testnet",
                  rpcUrls: [import.meta.env.VITE_APP_POLYGON_TESTNET_RPC_URL] /* ... */,
                  nativeCurrency: {
                    name: "MATIC",
                    symbol: "MATIC", // 2-6 characters long
                    decimals: 18,
                  },
                  blockExplorerUrls: [import.meta.env.VITE_APP_POLYGON_TESTNET_BLOCK_EXPLORER_URL],
                },
              ],
            });
          } catch (addError) {
            console.log(addError);
          }
        }
        // handle other "switch" errors
      }

    let name = currentApp.name;
    let ext = currentApp.contentId.split(".").pop();
    let hash = currentApp.contentId.split(import.meta.env.VITE_APP_ITEM_UPLOAD_URL)[1].split("/" + name + "." + ext)[0];
    let description = "It is an Inventory Item" // template

    const signer = new ethers.providers.Web3Provider(ethereum).getSigner();
    const NFTcontract = new ethers.Contract(NFTcontractAddress, NFTABI, signer);
    const FTcontract = new ethers.Contract(FTcontractAddress, FTABI, signer);
    let Bigmintfee = await NFTcontract.mintFee();
    const mintfee = BigNumber.from(Bigmintfee).toNumber();
    if(mintfee > 0) { // webaverse side chain mintfee != 0
        const FTapprovetx = await FTcontract.approve(NFTcontractAddress, mintfee); // mintfee = 10 default
        let FTapproveres = await FTapprovetx.wait()
        if (FTapproveres.transactionHash) {
            try {
                let NFTminttx = await NFTcontract.mint(walletstate.walletaddress, hash, name, ext, description, 1)
                setIsLoading(false);
                setCurrentApp(null);
                let NFTmintres = await NFTminttx.wait();
                if (NFTmintres.transactionHash) {
                    notifymessage("Mint complete! New item added in the inventory", "success");
                    setState({ openedPanel: 'CharacterPanel' });
                }
            } catch(err) {
                console.log(err)
                setIsLoading(false);
                setCurrentApp(null);
                notifymessage("Mint failed", "error")
            }
        }
    } else { // mintfee = 0 for Polygon not webaverse sidechain
        try {
            let NFTminttx = await NFTcontract.mint(walletstate.walletaddress, hash, name, ext, description, 1)
            setIsLoading(false);
            setCurrentApp(null);
            let NFTmintres = await NFTminttx.wait();
            if (NFTmintres.transactionHash) {
                notifymessage("Mint complete! New item added in the inventory", "success");
                setState({ openedPanel: 'CharacterPanel' });
            }
        } catch(err) {
            console.log(err)
            setIsLoading(false);
            setCurrentApp(null);
            notifymessage("Mint failed", "error")
        }
    }
  };
  const _cancel = e => {
    e.preventDefault();
    e.stopPropagation();

    setCurrentApp(null);
  };

  const name = currentApp ? currentApp.name : '';
  const appType = currentApp ? currentApp.appType : '';

  const notifymessage = (msg, type) => {
    toast(msg, {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        type,
        theme: "dark"
    });
}
  return (
    <>
        <>
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
                            <div className={style.button} disabled={!mintBtnEnable} onClick={_mint}>
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
            <ToastContainer
                    position="top-center"
                    autoClose={4000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                />
        </>
        {
            isLoading && <div
                            style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            background: "black",
                            opacity: .5
                            }}
                        >
                            <ThreeDots color="#00BFFF" height={80} width={80} />
                         </div>
        }
    </>
  );
};
export {
  DragAndDrop,
};