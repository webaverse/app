import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import Y from '../yjs.js';
import {Color} from './Color.js';
import styles from './Header.module.css'
import {world} from '../world.js'
import {rigManager} from '../rig.js'
import weaponsManager from '../weapons-manager.js'
import * as universe from '../universe.js'
import * as hacks from '../hacks.js'
import cameraManager from '../camera-manager.js'
import {parseQuery} from '../util.js'
// import {homeScnUrl} from '../constants.js'
import sceneNames from '../scenes/scenes.json';

const localColor = new Color();
const localColor2 = new Color();
const localColor3 = new Color();
const localColor4 = new Color();
const localColor5 = new Color();
const localColor6 = new Color();

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

const Location = ({sceneName, setSceneName, roomName, setRoomName, open, setOpen, toggleOpen, multiplayerConnected, micOn, toggleMic}) => {
  const [rooms, setRooms] = useState([]);
  const scenesOpen = open === 'scenes';
  const multiplayerOpen = open === 'multiplayer';
  
  const refreshRooms = async () => {
    const res = await fetch(universe.getWorldsHost() + '@worlds/');
    if (res.ok) {
      const rooms = await res.json();
      setRooms(rooms);
    } else {
      const text = await res.text();
      console.warn('failed to fetch', res.status, text);
    }
  };
  useEffect(refreshRooms, []);

  return (
    <div className={styles.location}>
      <div className={styles.row}>
        <div className={styles['button-wrap']} onClick={e => {
          toggleOpen('scenes');
        }}>
          <button className={classnames(styles.button, styles.primary, scenesOpen ? null : styles.disabled)}>
            <img src="images/webarrow.svg" />
          </button>
        </div>
        <div className={styles['input-wrap']}>
          <input type="text" className={styles.input} value={multiplayerConnected ? roomName : sceneName} onChange={e => {
            setSceneName(e.target.value);
          }} disabled={multiplayerConnected} onKeyDown={e => {
            // console.log('key down', e);
            switch (e.which) {
              case 13: { // enter
                e.preventDefault();
                universe.pushUrl(`/?src=${encodeURIComponent(sceneName)}`);
                break;
              }
            }
          }} onFocus={e => {
            setOpen(null);
          }} placeholder="Goto..." />
          <img src="images/webpencil.svg" className={classnames(styles.background, styles.green)} />
        </div>
        <div className={styles['button-wrap']} onClick={e => {
          if (!multiplayerConnected) {
            toggleOpen('multiplayer');
          } else {
            universe.pushUrl(`/?src=${encodeURIComponent(sceneName)}`);
            /* world.disconnectRoom();
            setMultiplayerConnected(false); */
            setOpen(null);
          }
        }}>
          <button className={classnames(styles.button, (multiplayerOpen || multiplayerConnected) ? null : styles.disabled)}>
            <img src="images/wifi.svg" />
          </button>
        </div>
        <div className={styles['button-wrap']} onClick={toggleMic}>
          <button className={classnames(styles.button, micOn ? null : styles.disabled)}>
            <img src="images/microphone.svg" className={classnames(styles['mic-on'], micOn ? null : styles.hidden)} />
            <img src="images/microphone-slash.svg" className={classnames(styles['mic-off'], micOn ? styles.hidden : null)} />
          </button>
        </div>
      </div>
      {scenesOpen ? <div className={styles.rooms}>
        {sceneNames.map((sceneName, i) => (
          <div className={styles.room} onClick={async e => {
            universe.pushUrl(`/?src=${encodeURIComponent('./scenes/' + sceneName)}`);
            setOpen(null);
          }} key={i}>
            <img className={styles.image} src="images/world.jpg" />
            <div className={styles.name}>{sceneName}</div>
          </div>
        ))}
      </div> : null}
      {multiplayerOpen ? <div className={styles.rooms}>
        <div className={styles.create}>
          <button className={styles.button} onClick={async e => {
            e.preventDefault();
            e.stopPropagation();

            const roomName = _makeName();
            console.log('got room name 0', {roomName}, universe.getWorldsHost() + '@worlds/' + roomName);
            const data = Y.encodeStateAsUpdate(world.getState(true));
            // console.log('post data', universe.getWorldsHost() + '@worlds/' + roomName, world.getState(true).toJSON(), data);
            console.log('post', universe.getWorldsHost() + '@worlds/' + roomName);
            const res = await fetch(universe.getWorldsHost() + '@worlds/' + roomName, {
              method: 'POST',
              body: data,
            });
            console.log('got room name 1', {roomName});
            if (res.ok) {
              // const j = await res.json();
              // console.log('world create result', j);

              refreshRooms();
              
              universe.pushUrl(`/?src=${encodeURIComponent(sceneName)}&room=${roomName}`);
              
              /* this.parent.sendMessage([
                MESSAGE.ROOMSTATE,
                data,
              ]); */
            } else {
              const text = await res.text();
              console.warn('error creating room', res.status, text);
            }
          }}>Create room</button>
        </div>
        {rooms.map((room, i) => (
          <div className={styles.room} onClick={async e => {
            if (!world.isConnected() && rigManager.localRig) {
              universe.pushUrl(`/?src=${encodeURIComponent(sceneName)}&room=${room.name}`);
              /* const isConnected = world.isConnected();
              setMultiplayerConnected(isConnected);
              if (isConnected) {
                setRoomName(room.name);
                setMultiplayerOpen(false);
              } */
            }
          }} key={i}>
            <img className={styles.image} src="images/world.jpg" />
            <div className={styles.name}>{room.name}</div>
            <div className={styles.delete}>
              <button className={classnames(styles.button, styles.warning)} onClick={async e => {
                e.preventDefault();
                e.stopPropagation();

                const res = await fetch(universe.getWorldsHost() + '@worlds/' + room.name, {
                  method: 'DELETE'
                });
                // console.log('got click 0');
                if (res.ok) {
                  /// console.log('got click 1', rooms.indexOf(room));
                  refreshRooms();
                  // const newRooms = rooms.slice().splice(rooms.indexOf(room), 1);
                  // console.log('set rooms', rooms, newRooms);
                  // setRooms(newRooms);
                } else {
                  // console.log('got click 2');
                  const text = await res.text();
                  console.warn('failed to fetch', res.status, text);
                }
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div> : null}
    </div>
  );
};
const User = ({address, setAddress, open, setOpen, toggleOpen}) => {
  const userOpen = open === 'user';
  
  const login = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const addresses = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const [address] = addresses;
      // console.log('address', {address});
      setAddress(address);
    } else {
      console.warn('no ethereum');
    }
  };
  
  return (
    <div className={styles.user} onClick={async e => {
      e.preventDefault();
      e.stopPropagation();

      if (address) {
        toggleOpen('user');
      } else {
        await login();
      }
    }}>
      <img src="images/soul.png" className={styles.icon} />
      <div className={styles.name}>{address || 'Log in'}</div>
    </div>
  );
};

const Tab = ({className, type, left, right, top, bottom, disabled, label, panel, before, after, open, toggleOpen, onclick}) => {
  if (!onclick) {
    onclick = e => {
      toggleOpen(type);
    };
  }
  
  return (
    <div className={classnames(
      className,
      styles.tab,
      left ? styles.left : null,
      right ? styles.right : null,
      top ? styles.top : null,
      bottom ? styles.bottom : null,
      disabled ? styles.disabled : null,
      open === type ? styles.open : null,
      
    )} onClick={onclick}>
      {left ? <>
        {before}
        {panel}
        {label}
        {after}
      </> : <>
        {before}
        {label}
        {panel}
        {after}
      </>}
    </div>
  );
};

export default function Header({
  app,
}) {
	// console.log('index 2');
	
  const [open, setOpen] = useState(null);
  const [address, setAddress] = useState(false);
  const [nfts, setNfts] = useState(null);
  const [sceneName, setSceneName] = useState(_getCurrentSceneSrc());
  const [roomName, setRoomName] = useState(_getCurrentRoom());
  const [micOn, setMicOn] = useState(false);
  const [xrSupported, setXrSupported] = useState(false);
  const [claims, setClaims] = useState([]);
  
  const userOpen = open === 'user';
  const scenesOpen = open === 'scenes';
  const multiplayerOpen = open === 'multiplayer';
  const characterOpen = open === 'character';
  const worldOpen = open === 'world';
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
    if (open && document.pointerLockElement) {
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
    universe.handleUrlUpdate();
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
      weaponsManager.addLocalEmote(index);
      
      lastEmoteKey.key = -1;
      lastEmoteKey.timestamp = 0;
    } else {
      lastEmoteKey.key = key;
      lastEmoteKey.timestamp = timestamp;
    }
  };
  useEffect(() => {
    const keydown = e => {
      const inputFocused = document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.nodeName);
      if (!inputFocused) {
        switch (e.which) {
          case 84: { // T
            e.preventDefault();
            e.stopPropagation();
            toggleMic();
            break;
          }
          case 9: { // Tab
            e.preventDefault();
            e.stopPropagation();
            if (characterOpen) {
              cameraManager.requestPointerLock();
            } else {
              setOpen('character');
            }
            break;
          }
          case 90: { // Z
            e.preventDefault();
            e.stopPropagation();
            if (worldOpen) {
              cameraManager.requestPointerLock();
            } else {
              setOpen('world');
            }
            break;
          }
        }
        const match = e.code.match(/^Numpad([0-9])$/);
        if (match) {
          const key = parseInt(match[1], 10);
          _emoteKey(key);
        }
      }
    };
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('keydown', keydown);
    };
  }, [open]);
  useEffect(async () => {
    const isXrSupported = await app.isXrSupported();
    console.log('is supported', isXrSupported);
    setXrSupported(isXrSupported);
  }, []);

	return (
    <div className={styles.container} onClick={e => {
      e.stopPropagation();
    }}>
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
              panel={
                <div className={styles.panel}>
                  <h1>Sheila</h1>
                </div>
              }
              open={open}
              toggleOpen={toggleOpen}
            />
            <Tab
              type="world"
              top
              right
              label={
                <div className={styles.label}>
                  <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
                  <span className={styles.text}>世 World</span>
                  <span className={styles.key}>Z</span>
                </div>
              }
              panel={
                <div className={styles.panel}>
                  <h1>Tokens</h1>
                </div>
              }
              open={open}
              toggleOpen={toggleOpen}
            />
            <Tab
              type="xr"
              onclick={async e => {
                if (xrSupported) {
                  await app.enterXr();
                }
              }}
              bottom
              right
              disabled={!xrSupported}
              label={
                <div className={styles.label}>
                  <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
                  <span className={styles.text}>仮想現実 VR{xrSupported ? '' : ' (no)'}</span>
                </div>
              }
              open={open}
              toggleOpen={toggleOpen}
            />
            <Tab
              type="claims"
              bottom
              left
              disabled={claims.length === 0}
              className="skew"
              label={
                <div className={styles.label}>
                  <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
                  <span className={styles.text}>品 Claims ({claims.length})</span>
                </div>
              }
              after={
                <div className={styles['transparent-panel']}>
                  <div className={styles.buttons}>
                    <button className={styles.button}>Claim all</button>
                    <button className={styles.button}>Reject</button>
                  </div>
                </div>
              }
              before={
                <div className={styles.slide} />
              }
              open={open}
              toggleOpen={toggleOpen}
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