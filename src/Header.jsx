import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import styles from './Header.module.css';
import Inspector from './Inspector.jsx';
import Chat from './Chat.jsx';
import CharacterHups from './CharacterHups.jsx';
import MagicMenu from './MagicMenu.jsx';
// import * as Z from 'zjs';
// import {Color} from './Color.js';
import {world} from '../world.js'
import game from '../game.js'
// import universe from '../universe.js'
import * as hacks from '../hacks.js'
import cameraManager from '../camera-manager.js'
import metaversefile from '../metaversefile-api.js'
import ioManager from '../io-manager.js'
import User from './User';
// import * as ceramicAdmin from '../ceramic-admin.js';
import {Character} from './tabs/character';
import {Claims} from './tabs/claims';
import {Tokens} from './tabs/tokens';

export default function Header({
  app,
}) {
  const localPlayer = metaversefile.useLocalPlayer();
  const _getWearActions = () => localPlayer.getActionsArray().filter(action => action.type === 'wear');

  const dioramaCanvasRef = useRef();
  const panelsRef = useRef();

  const [open, setOpen] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [address, setAddress] = useState(false);
  const [nfts, setNfts] = useState(null);
  const [apps, setApps] = useState(world.appManager.getApps().slice());
  const [claims, setClaims] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loginFrom, setLoginFrom] = useState('');

  const [wearActions, setWearActions] = useState(_getWearActions());

  const userOpen = open === 'user';
  const characterOpen = open === 'character';
  const magicMenuOpen = open === 'magicMenu';

  const toggleOpen = newOpen => {
    setOpen(newOpen === open ? null : newOpen);
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
    if (dioramaCanvasRef.current && !game.playerDiorama) {
      app.bindDioramaCanvas(dioramaCanvasRef.current);
    }
  }, [dioramaCanvasRef.current]);
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
        world.toggleMic();
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
          window.dispatchEvent( new CustomEvent( 'CloseAllMenus', { detail: { dispatcher: 'CharacterMenu' } } ) );
          setOpen('character');
        }
        return true;
      }
    }
    return false;
  };
  useEffect(() => {

    const handleOnFocusLost = () => {

        setOpen( false );

    };

    window.addEventListener( 'CloseAllMenus', handleOnFocusLost );

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
      window.removeEventListener( 'CloseAllMenus', handleOnFocusLost );
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
              dioramaCanvasRef={dioramaCanvasRef}
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