import React, {useState, useEffect} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
 
export const Location = ({universe, sceneName, sceneNames, setSceneName, roomName, setRoomName, open, setOpen, toggleOpen, multiplayerConnected, micOn, toggleMic}) => {
  const [rooms, setRooms] = useState([]);
  const scenesOpen = open === 'scenes';
  const multiplayerOpen = open === 'multiplayer';
  
  const refreshRooms = async () => {
    const res = await fetch(universe.getWorldsHost());
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
            console.log('got room name 0', {roomName}, universe.getWorldsHost() + roomName);
            const data = Z.encodeStateAsUpdate(world.getState(true));
            // console.log('post data', universe.getWorldsHost() + roomName, world.getState(true).toJSON(), data);
            console.log('post', universe.getWorldsHost() + roomName);
            const res = await fetch(universe.getWorldsHost() + roomName, {
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
            if (!world.isConnected() /* && useLocalPlayer().avatar */) {
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

                const res = await fetch(universe.getWorldsHost() + room.name, {
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