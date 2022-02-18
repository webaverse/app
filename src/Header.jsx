import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import styles from './Header.module.css';
import Inspector from './Inspector.jsx';
import Chat from './Chat.jsx';
import CharacterHups from './CharacterHups.jsx';
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
import {Location} from './components/location';
import {Character} from './tabs/character';
import {Claims} from './tabs/claims';
import {Tokens} from './tabs/tokens';

const localEuler = new THREE.Euler();

// console.log('index 1');

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

export default function Header({
  app,
}) {
  const localPlayer = metaversefile.useLocalPlayer();  
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
  const [claims, setClaims] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loginFrom, setLoginFrom] = useState('');

  const [wearActions, setWearActions] = useState(_getWearActions());

  const userOpen = open === 'user';
  const scenesOpen = open === 'scenes';
  const multiplayerOpen = open === 'multiplayer';
  const characterOpen = open === 'character';
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
    if (game.playerDiorama) {
      game.playerDiorama.enabled = !!open;
    }
  }, [open]);
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
    if (previewCanvasRef.current && !game.playerDiorama) {
      app.bindPreviewCanvas(previewCanvasRef.current);
    }
  }, [previewCanvasRef.current]);
  useEffect(() => {
    if (selectedApp && panelsRef.current) {
      panelsRef.current.scrollTo(0, 0);
    }
  }, [selectedApp, panelsRef.current]);
  
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
    const dragchange = e => {
      const {dragging} = e.data;
      setDragging(dragging);
    };
    world.appManager.addEventListener('dragchange', dragchange);
    const selectchange = e => {
    //   setSelectedApp(e.data.app);
    };
    world.appManager.addEventListener('selectchange', selectchange);
    return () => {
      world.appManager.removeEventListener('dragchange', dragchange);
      world.appManager.removeEventListener('selectchange', selectchange);
    };
  }, [dragging]);

  const npcManager = metaversefile.useNpcManager();
  const [npcs, setNpcs] = useState(npcManager.npcs);
  useEffect(() => {
    npcManager.addEventListener('npcadd', e => {
      const {player} = e.data;
      const newNpcs = npcs.concat([player]);
      setNpcs(newNpcs);
    });
    npcManager.addEventListener('npcremove', e => {
      const {player} = e.data;
      const newNpcs = npcs.slice().splice(npcs.indexOf(player), 1);
      setNpcs(newNpcs);
    });
  }, []);

	return (
    <div className={styles.container} onClick={e => {
      e.stopPropagation();
    }}>
      <Inspector open={open} setOpen={setOpen} selectedApp={selectedApp} dragging={dragging} />
			<Chat open={open} setOpen={setOpen} />
      <CharacterHups localPlayer={localPlayer} npcs={npcs} />
      <MagicMenu open={open} setOpen={setOpen} />
      <div className={styles.inner}>
				<header className={styles.header}>
          <div className={styles.row}>
            <a href="/" className={styles.logo}>
              <img src="images/arrow-logo.svg" className={styles.image} />
            </a>
            <Location
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
              universe={universe}
              sceneNames={sceneNames}
            />
            <User
              address={address}
              setAddress={setAddress}
              open={open}
              setOpen={setOpen}
              toggleOpen={toggleOpen}
              setLoginFrom={setLoginFrom}
            />
          </div>
				</header>
        <header className={classnames(styles.header, styles.subheader)}>
          <div className={styles.row}>
          <Character
              open={open}
              setOpen={setOpen}
              toggleOpen={toggleOpen}
              panelsRef={panelsRef}
              wearActions={wearActions}
              previewCanvasRef={previewCanvasRef}
              game={game}
            />
            <Claims
              claims={claims}
              open={open}
              toggleOpen={toggleOpen}
              panelsRef={panelsRef}
            />
          </div>
        </header>
        <Tokens
          userOpen={userOpen}
          nfts={nfts}
          hacks={hacks}
          address={address}
          setNfts={setNfts}
          loginFrom={loginFrom}
        />
      </div>
    </div>
  )
};