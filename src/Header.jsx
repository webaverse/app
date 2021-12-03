import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import styles from './Header.module.css';
import Inspector from './Inspector.jsx';
import Chat from './Chat.jsx';
import MagicMenu from './MagicMenu.jsx';
import * as Z from 'zjs';
// import {Color} from './Color.js';
import {world} from '../world.js'
import game from '../game.js'
import * as universe from '../universe.js'
import * as hacks from '../hacks.js'
import cameraManager from '../camera-manager.js'
import metaversefile from '../metaversefile-api.js'
import ioManager from '../io-manager.js'
import {parseQuery} from '../util.js'
import User from './User';
// import * as ceramicAdmin from '../ceramic-admin.js';
import sceneNames from '../scenes/scenes.json';
import { Tab } from './components/tab';
import { Location } from './components/location';
import { Character } from './tabs/character';
import { Claims } from './tabs/claims';
import { World } from './tabs/world';
import { XR } from './tabs/xr';

const localEuler = new THREE.Euler();

// console.log('index 1');

const _makeName = (N = 8) => (Math.random().toString(36)+'00000000000000000').slice(2, N+2);
const _getCurrentSceneSrc = () => {
  const q = parseQuery(window.location.search);
  let {src} = q;
  if (src === undefined) {
    src = './scenes/' + sceneNames[0];
  }
  return src;
};
const _getCurrentRoom = () => {
  const q = parseQuery(window.location.search);
  const {room} = q;
  return room || '';
};

const NumberInput = ({input}) => {
  return <input type="number" className={styles.input} value={input.value} onChange={input.onChange} onKeyDown={e => {
    if (e.which === 13) {
      e.target.blur();
    }
  }} />
};

export default function Header({
  app,
}) {
  
  const _getWearActions = () => localPlayer.getActionsArray().filter(action => action.type === 'wear');
  
	// console.log('index 2');
  const previewCanvasRef = useRef();
  const panelsRef = useRef();
	
  const [open, setOpen] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [address, setAddress] = useState(false);
  const [nfts, setNfts] = useState(null);
  const [apps, setApps] = useState(world.appManager.getApps().slice());
  const [sceneName, setSceneName] = useState(_getCurrentSceneSrc());
  const [roomName, setRoomName] = useState(_getCurrentRoom());
  const [micOn, setMicOn] = useState(false);
  const [xrSupported, setXrSupported] = useState(false);
  const [claims, setClaims] = useState([]);
  const [dragging, setDragging] = useState(false);
  
  const localPlayer = metaversefile.useLocalPlayer();
  const [wearActions, setWearActions] = useState(_getWearActions());
  
  let [px, setPx] = useState(0);
  let [py, setPy] = useState(0);
  let [pz, setPz] = useState(0);
  let [rx, setRx] = useState(0);
  let [ry, setRy] = useState(0);
  let [rz, setRz] = useState(0);
  let [sx, setSx] = useState(1);
  let [sy, setSy] = useState(1);
  let [sz, setSz] = useState(1);
  px = {value: px, onChange: e => {const v = e.target.value; selectedApp.position.x = v; selectedApp.updateMatrixWorld(); setPx(v);}};
  py = {value: py, onChange: e => {const v = e.target.value; selectedApp.position.y = v; selectedApp.updateMatrixWorld(); setPy(v);}};
  pz = {value: pz, onChange: e => {const v = e.target.value; selectedApp.position.z = v; selectedApp.updateMatrixWorld(); setPz(v);}};
  rx = {value: rx, onChange: e => {const v = e.target.value; selectedApp.rotation.x = v; selectedApp.updateMatrixWorld(); setRx(v);}};
  ry = {value: ry, onChange: e => {const v = e.target.value; selectedApp.rotation.y = v; selectedApp.updateMatrixWorld(); setRy(v);}};
  rz = {value: rz, onChange: e => {const v = e.target.value; selectedApp.rotation.z = v; selectedApp.updateMatrixWorld(); setRz(v);}};
  sx = {value: sx, onChange: e => {const v = e.target.value; selectedApp.scale.x = v; selectedApp.updateMatrixWorld(); setSx(v);}};
  sy = {value: sy, onChange: e => {const v = e.target.value; selectedApp.scale.y = v; selectedApp.updateMatrixWorld(); setSy(v);}};
  sz = {value: sz, onChange: e => {const v = e.target.value; selectedApp.scale.z = v; selectedApp.updateMatrixWorld(); setSz(v);}};
  
  const userOpen = open === 'user';
  const scenesOpen = open === 'scenes';
  const multiplayerOpen = open === 'multiplayer';
  const characterOpen = open === 'character';
  const worldOpen = open === 'world';
  const magicMenuOpen = open === 'magicMenu';
  const multiplayerConnected = !!roomName;
  
  const toggleOpen = newOpen => {
    setOpen(newOpen === open ? null : newOpen);
  };
  const toggleMic = async e => {
    // console.log('toggle mic');
    if (!world.micEnabled()) {
      await world.enableMic();
      setMicOn(true);
    } else {
      world.disableMic();
      setMicOn(false);
    }
  };
  const selectApp = (app, physicsId, position) => {
    game.setMouseSelectedObject(app, physicsId, position);
  };
  
  const _formatContentId = contentId => contentId.replace(/^[\s\S]*\/([^\/]+)$/, '$1');
  useEffect(() => {
    const update = e => {
      setApps(world.appManager.getApps().slice());
    };
    world.appManager.addEventListener('appadd', update);
    world.appManager.addEventListener('appremove', update);
  }, []);
  useEffect(() => {
    localPlayer.addEventListener('wearupdate', e => {
      const wearActions = _getWearActions();
      setWearActions(wearActions);
      
      const mouseDomEquipmentHoverObject = game.getMouseDomEquipmentHoverObject();
      if (mouseDomEquipmentHoverObject && !wearActions.some(action => action.type === 'wear' && action.instanceId === mouseDomEquipmentHoverObject.instanceId)) {
        game.setMouseDomEquipmentHoverObject(null);
      }
    });
  }, []);
  useEffect(() => {
    const pointerlockchange = e => {
      // console.log('pointer lock change', e, document.pointerLockElement);
      if (document.pointerLockElement) {
        setOpen(null);
      }
    };
    window.document.addEventListener('pointerlockchange', pointerlockchange);
    return () => {
      window.document.removeEventListener('pointerlockchange', pointerlockchange);
    };
  }, []);
  useEffect(() => {
    if (open && document.pointerLockElement && open !== 'chat') {
      document.exitPointerLock();
    }
  }, [open]);
  useEffect(() => {
    if (address && !nfts) {
      setNfts([]);
      
      (async () => {
        const res = await fetch(`https://api.opensea.io/api/v1/assets?owner=${address}&limit=${50}`, {
          headers: {
            'X-API-KEY': `6a7ceb45f3c44c84be65779ad2907046`,
          },
        });
        const j = await res.json();
        const {assets} = j;
        setNfts(assets);
        // console.log('got assets', assets);
      })();
    }
  }, [address, nfts]);
  const _loadUrlState = () => {
    const src = _getCurrentSceneSrc();
    setSceneName(src);
    const roomName = _getCurrentRoom();
    setRoomName(roomName);
    if (multiplayerOpen) {
      setOpen(null);
    }
    // console.log('set url state', {src, roomName, search: window.location.search, q: parseQuery(window.location.search)});
  };
  useEffect(() => {
    // console.log('waiting');
    const pushstate = e => {
      _loadUrlState();
      // console.log('set room name', {roomName});
    };
    const popstate = e => {
      _loadUrlState();
      // console.log('set room name', {roomName});
      
      universe.handleUrlUpdate();
    };
    window.addEventListener('pushstate', pushstate);
    window.addEventListener('popstate', popstate);
    return () => {
      window.removeEventListener('pushstate', pushstate);
      window.removeEventListener('popstate', popstate);
    };
  }, []);
  useEffect(() => {
    _loadUrlState();
  }, []);
  useEffect(() => {
    const pickup = e => {
      const {app} = e.data;
      const {contentId} = app;
      const newClaims = claims.slice();
      newClaims.push({
        contentId,
      });
      setClaims(newClaims);
    };
    world.appManager.addEventListener('pickup', pickup);
    return () => {
      world.appManager.removeEventListener('pickup', pickup);
    };
  }, [claims]);
  useEffect(() => {
    if (previewCanvasRef.current) {
      app.bindPreviewCanvas(previewCanvasRef.current);
    }
  }, [previewCanvasRef.current]);
  useEffect(() => {
    if (selectedApp && panelsRef.current) {
      panelsRef.current.scrollTo(0, 0);
    }
  }, [selectedApp, panelsRef.current]);
  
  const lastEmoteKey = {
    key: -1,
    timestamp: 0,
  };
  const _emoteKey = key => {
    const timestamp = performance.now();
    if ((timestamp - lastEmoteKey.timestamp) < 1000) {
      const key1 = lastEmoteKey.key;
      const key2 = key;
      const index = (key1 * 10) + key2;
      game.addLocalEmote(index);
      
      lastEmoteKey.key = -1;
      lastEmoteKey.timestamp = 0;
    } else {
      lastEmoteKey.key = key;
      lastEmoteKey.timestamp = timestamp;
    }
  };
  
  const _handleNonInputKey = e => {
    switch (e.which) {
      case 13: { // enter
        e.preventDefault();
        e.stopPropagation();
        setOpen('chat');
        return true;
      }
      case 84: { // T
        e.preventDefault();
        e.stopPropagation();
        toggleMic();
        return true;
      }
      case 90: { // Z
        e.preventDefault();
        e.stopPropagation();
        if (worldOpen) {
          if (selectedApp) {
            selectApp(null);
          } else {
            cameraManager.requestPointerLock();
          }
        } else {
          setOpen('world');
        }
        return true;
      }
      case 191: { // /
        if (!magicMenuOpen && !ioManager.inputFocused()) { 
          e.preventDefault();
          e.stopPropagation();
          
          // setPage('input');
          // setInput('');
          // setNeedsFocus(true);
          setOpen('magicMenu');
        }
        return true;
      }
    }
    const match = e.code.match(/^Numpad([0-9])$/);
    if (match) {
      const key = parseInt(match[1], 10);
      _emoteKey(key);
      return true;
    }
    return false;
  };
  const _handleAnytimeKey = e => {
    switch (e.which) {
      case 9: { // tab
        e.preventDefault();
        e.stopPropagation();
        if (characterOpen || magicMenuOpen) {
          ioManager.click(new MouseEvent('click'));
          cameraManager.requestPointerLock();
        } else {
          setOpen('character');
        }
        return true;
      }
    }
    return false;
  };
  useEffect(() => {
    const keydown = e => {
      let handled = false;
      const inputFocused = document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.nodeName);
      if (!inputFocused) {
        handled = _handleNonInputKey(e);
      }
      if (!handled) {
        handled = _handleAnytimeKey(e);
      }
      if (handled || inputFocused) {
        // nothing
      } else {
        ioManager.keydown(e);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('keydown', keydown);
    };
  }, [open, selectedApp]);
  useEffect(async () => {
    const isXrSupported = await app.isXrSupported();
    // console.log('is supported', isXrSupported);
    setXrSupported(isXrSupported);
  }, []);
  useEffect(async () => {
    window.addEventListener('click', e => {
      const hoverObject = game.getMouseHoverObject();
      if (hoverObject) {
        e.preventDefault();
        e.stopPropagation();
        
        const physicsId = game.getMouseHoverPhysicsId();
        const position = game.getMouseHoverPosition();
        selectApp(hoverObject, physicsId, position);
      }
    });
  }, []);
  useEffect(() => {
    if (selectedApp) {
      const {position, quaternion, scale} = selectedApp;
      const rotation = localEuler.setFromQuaternion(quaternion, 'YXZ');
      setPx(position.x);
      setPy(position.y);
      setPz(position.z);
      setRx(rotation.x);
      setRy(rotation.y);
      setRz(rotation.z);
      setSx(scale.x);
      setSy(scale.y);
      setSz(scale.z);
    }
  }, [selectedApp]);
  useEffect(() => {
    const dragchange = e => {
      const {dragging} = e.data;
      setDragging(dragging);
    };
    world.appManager.addEventListener('dragchange', dragchange);
    const selectchange = e => {
      setSelectedApp(e.data.app);
    };
    world.appManager.addEventListener('selectchange', selectchange);
    return () => {
      world.appManager.removeEventListener('dragchange', dragchange);
      world.appManager.removeEventListener('selectchange', selectchange);
    };
  }, [dragging]);

	return (
    <div className={styles.container} onClick={e => {
      e.stopPropagation();
    }}>
      <Inspector open={open} setOpen={setOpen} selectedApp={selectedApp} dragging={dragging} />
			<Chat open={open} setOpen={setOpen} />
      <MagicMenu open={open} setOpen={setOpen} />
      <div className={styles.inner}>
				<header className={styles.header}>
          <div className={styles.row}>
            <a href="/" className={styles.logo}>
              <img src="images/arrow-logo.svg" className={styles.image} />
            </a>
            <Location
              sceneNames={sceneNames}
              universe={universe}
              world={world}
              Z={Z}
              _makeName={_makeName}
              sceneName={sceneName}
              setSceneName={setSceneName}
              roomName={roomName}
              setRoomName={setRoomName}
              open={open}
              setOpen={setOpen}
              toggleOpen={toggleOpen}
              multiplayerConnected={multiplayerConnected}
              micOn={micOn}
              toggleMic={toggleMic}
            />
            <User
              address={address}
              setAddress={setAddress}
              open={open}
              setOpen={setOpen}
              toggleOpen={toggleOpen}
            />
          </div>
				</header>
        <header className={classnames(styles.header, styles.subheader)}>
          <div className={styles.row}>
            <Tab
              type="character"
              top
              left
              label={
                <div className={styles.label}>
                  <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
                  <span className={styles.text}>人 Character</span>
                  <span className={styles.key}>Tab</span>
                </div>
              }
              panels={[
                (<div className={styles.panel} key="left">
                  <div className={styles['panel-header']}>
                    <h1>Sheila</h1>
                  </div>
                  <canvas id="previewCanvas" className={styles.avatar} ref={previewCanvasRef} />
                  {/* <div className={styles['panel-header']}>
                    <h1>Equipment</h1>
                  </div> */}
                  {wearActions.map((wearAction, i) => {
                    return (
                      <div
                        className={styles.equipment}
                        key={i}
                        onMouseEnter={e => {
                          const app = metaversefile.getAppByInstanceId(wearAction.instanceId);
                          game.setMouseHoverObject(null);
                          const physicsId = app.getPhysicsObjects()[0]?.physicsId;
                          game.setMouseDomEquipmentHoverObject(app, physicsId);
                        }}
                        onMouseLeave={e => {
                          game.setMouseDomEquipmentHoverObject(null);
                        }}
                      >
                        <img src="images/webpencil.svg" className={classnames(styles.background, styles.violet)} />
                        <img src="images/flower.png" className={styles.icon} />
                        <div className={styles.name}>{wearAction.instanceId}</div>
                        <button className={styles.button} onClick={e => {
                          const localPlayer = metaversefile.useLocalPlayer();
                          const app = metaversefile.getAppByInstanceId(wearAction.instanceId);
                          localPlayer.unwear(app);
                        }}>
                          <img src="images/remove.svg" />
                        </button>
                        <div className={styles.background2} />
                      </div>
                    );
                  })}
                </div>)
              ]}
              open={open}
              toggleOpen={toggleOpen}
              panelsRef={panelsRef}
            />
            <Character 
              open={open}
              setOpen={setOpen} 
              toggleOpen={toggleOpen} 
              panelsRef={panelsRef} 
              wearActions={wearActions} 
              previewCanvasRef={previewCanvasRef}
              game={game}
            />
            <World
              open={open}
              setOpen={setOpen} 
              toggleOpen={toggleOpen}
              panelsRef={panelsRef}
              game={game}
              apps={apps}
              selectApp={selectApp}
              setSelectedApp={setSelectedApp}
              selectedApp={selectedApp}
              px={px}
              py={py}
              pz={pz}
              rx={rx}
              ry={ry}
              rz={rz}
              sx={sx}
              sy={sy}
              sz={sz}
            />
            <XR
              xrSupported={xrSupported}
              app={app}
              open={open}
              toggleOpen={toggleOpen}
              panelsRef={panelsRef}
            />
            <Claims
              claims={claims}
              open={open}
              toggleOpen={toggleOpen}
              panelsRef={panelsRef}
            />
          </div>
        </header>
        
        <section className={classnames(styles.sidebar, userOpen ? styles.open : null)} onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}>
          {(nfts || []).map((nft, i) => {
            const {id, asset_contract, name, description} = nft;
            const image_preview_url = hacks.getNftImage(nft);
            /* if (!image_preview_url) {
              console.log('got nft', {nft, hacks, image_preview_url});
              debugger;
            } */
            // "https://storage.opensea.io/files/099f7815733ba38b897f892a750e11dc.svg"
            // console.log(nft);
            return <div className={styles.nft} onDragStart={e => {
              e.dataTransfer.setData('application/json', JSON.stringify(nft));
            }} draggable key={i}>
              <img src={image_preview_url} className={styles.preview} />
              <div className={styles.wrap}>
                <div className={styles.name}>{name}</div>
                <div className={styles.description}>{description}</div>
                <div className={styles.tokenid}>{asset_contract.address} / {id}</div>
              </div>
            </div>
          })}
        </section>
      </div>
    </div>
  )
};