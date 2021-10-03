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

const Location = ({sceneName, setSceneName, roomName, setRoomName, setOpen, scenesOpen, setScenesOpen, multiplayerOpen, setMultiplayerOpen, multiplayerConnected, micOn, toggleMic}) => {
  const [rooms, setRooms] = useState([]);
  
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
          setScenesOpen(!scenesOpen);
          setMultiplayerOpen(false);
          setOpen(false);
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
            setOpen(false);
            setScenesOpen(false);
            setMultiplayerOpen(false);
          }} placeholder="Goto..." />
          <img src="images/webpencil.svg" className={classnames(styles.background, styles.green)} />
        </div>
        <div className={styles['button-wrap']} onClick={e => {
          setScenesOpen(false);
          if (!multiplayerConnected) {
            setMultiplayerOpen(!multiplayerOpen);
          } else {
            universe.pushUrl(`/?src=${encodeURIComponent(sceneName)}`);
            /* world.disconnectRoom();
            setMultiplayerConnected(false); */
          }
          setOpen(false);
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
            setScenesOpen(false);
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
const User = ({address, setAddress, open, setOpen, setScenesOpen, setMultiplayerOpen}) => {
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
        setOpen(!open);
        setScenesOpen(false);
        setMultiplayerOpen(false);
      } else {
        await login();
      }
    }}>
      <img src="images/soul.png" className={styles.icon} />
      <div className={styles.name}>{address || 'Log in'}</div>
    </div>
  );
};

export default function Header() {
	// console.log('index 2');
	
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState(false);
  const [nfts, setNfts] = useState(null);
  const [sceneName, setSceneName] = useState(_getCurrentSceneSrc());
  const [roomName, setRoomName] = useState(_getCurrentRoom());
  const [scenesOpen, setScenesOpen] = useState(false);
  const [multiplayerOpen, setMultiplayerOpen] = useState(false);
  // const [multiplayerConnected, setMultiplayerConnected] = useState(false);
  const [micOn, setMicOn] = useState(false);
  
  const multiplayerConnected = !!roomName;
  
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
        setOpen(false);
        setMultiplayerOpen(false);
      }
    };
    window.document.addEventListener('pointerlockchange', pointerlockchange);
    return () => {
      window.document.removeEventListener('pointerlockchange', pointerlockchange);
    };
  }, []);
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
    setMultiplayerOpen(false);
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
  }, []);
  
	/* const ref = useRef(null);
  const [arrowPosition, _setArrowPosition] = useState(0);
  const [arrowDown, _setArrowDown] = useState(false);
  const [animation, setAnimation] = useState(false);
  const [open, setOpen] = useState(false);
  // const [mouse, setMouse] = useState([0, 0]);
	const [svgData, setSvgData] = useState('');
	const [countdown, setCountdown] = useState(startCountdown);
	const [characterPositions, setCharacterPositions] = useState(null);
	const [appScriptLoaded, setAppScriptLoaded] = useState(false);
	
	const setArrowPosition = n => {
		if (!open && arrowPosition !== n) {
			_setArrowPosition(n);
			const beep = document.getElementById('beep');
			beep.currentTime = 0;
			beep.play();
		}
	};
	const setArrowPosition2 = n => {
		if (!open && arrowPosition !== n) {
			_setArrowPosition(n);
		}
	};
	const setArrowDown = a => {
		_setArrowDown(a);
		if (!open && a) {
			const scillia = document.getElementById('scillia');
			scillia.currentTime = 0;
			scillia.play();
			const boop = document.getElementById('boop');
			boop.currentTime = 0;
			boop.play();
			setAnimation(true);
			setOpen(true);
		}
	};
	useEffect(() => {
		const keydown = e => {
			if (!open) {
				switch (e.which) {
					case 39: { // right
						let n = arrowPosition + 1;
						if (n >= characters.length) {
							n %= characters.length;
						}
						setArrowPosition(n);
						break;
					}
					case 37: { // left
						let n = arrowPosition - 1;
						if (n < 0) {
							n += characters.length;
						}
						setArrowPosition(n);
						break;
					}
					case 13: { // enter
						setArrowDown(true);
						break;
					}
				}
		  } else {
				switch (e.which) {
					case 27: { // escape
					  setAnimation(false);
					  setOpen(false);
					}
				}
			}
		};
		window.addEventListener('keydown', keydown);
		const keyup = e => {
			switch (e.which) {
			  case 13: {
					setArrowDown(false);
				  break;
				}
			}
		};
		window.addEventListener('keyup', keyup);
		return () => {
			window.removeEventListener('keydown', keydown);
		  window.removeEventListener('keyup', keyup);
		};
  }, [arrowPosition, arrowDown, animation, open]);
	useEffect(async () => {
		const res = await fetch('./images/arrow.svg');
		let text = await res.text();
		setSvgData(text);
	}, []);
	useEffect(async () => {
		const lastTimestamp = Date.now();
		const interval = setInterval(() => {
			const now = Date.now();
			const timeDiff = now - lastTimestamp;
			let newCountdown = countdown - timeDiff;
			// console.log('update', countdown, timeDiff, newCountdown);
			if (newCountdown <= 0) {
				newCountdown += startCountdown;
			}
			setCountdown(newCountdown);
		}, 100);
	  return () => {
		  clearInterval(interval);
		};
	}, []);
	useEffect(async () => {
		const onFocus = e => {
		  const audio = document.getElementById('song');
			// console.log('play', audio);
			if (audio.paused) {
			  audio.play();
			}
			// console.log('got audio', audio);
		};
		window.addEventListener('mousedown', onFocus);
		// window.addEventListener('focus', onFocus);
		window.addEventListener('keydown', onFocus);
		return () => {
      window.removeEventListener('mousedown', onFocus);
      // window.removeEventListener('focus', onFocus);
      window.removeEventListener('keydown', onFocus);
		};
	}, []);
	
	const _updateCharacterPositions = () => {
		const characters = Array.from(ref.current.children);
		if (characters.length > 0) {
			const characterPositions = characters.map(c => c.children[0].getBoundingClientRect());
			setCharacterPositions(characterPositions);
		} else {
			setCharacterPositions(null);
		}
	};
	useEffect(_updateCharacterPositions, [ref.current]);
	useEffect(() => {
		window.addEventListener('resize', _updateCharacterPositions);
		return () => {
		  window.removeEventListener('resize', _updateCharacterPositions);
		};
	}, []); */

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
              setOpen={setOpen}
              scenesOpen={scenesOpen}
              setScenesOpen={setScenesOpen}
              multiplayerOpen={multiplayerOpen}
              setMultiplayerOpen={setMultiplayerOpen}
              multiplayerConnected={multiplayerConnected}
              micOn={micOn}
              toggleMic={toggleMic}
            />
            <User
              address={address}
              setAddress={setAddress}
              open={open}
              setOpen={setOpen}
              setScenesOpen={setScenesOpen}
              setMultiplayerOpen={setMultiplayerOpen}
            />
          </div>
				</header>
        <header className={classnames(styles.header, styles.subheader)}>
          <div className={styles.row}>
            <div className={classnames(styles.tab, styles.left)}>
              <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
              <span className={styles.text}>人 Character</span>
              <span className={styles.key}>Tab</span>
            </div>
            <div className={classnames(styles.tab, styles.right)}>
              <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
              <span className={styles.text}>世 World</span>
              <span className={styles.key}>Z</span>
            </div>
          </div>
        </header>
        
        <section className={classnames(styles.sidebar, open ? styles.open : null)} onClick={e => {
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