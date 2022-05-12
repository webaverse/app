import * as THREE from 'three';
import React, {useState, useEffect, useContext} from 'react';
import classnames from 'classnames';
// import style from './DragAndDrop.module.css';
// import {world} from '../world.js';
// import {getRandomString, handleUpload} from '../util.js';
// import {registerIoEventHandler, unregisterIoEventHandler} from './components/general/io-handler/IoHandler.jsx';
// import {registerLoad} from './LoadingBox.jsx';
// import {ObjectPreview} from './ObjectPreview.jsx';
// import game from '../game.js';
// import {getRenderer} from '../renderer.js';
import dropManager from '../drop-manager.js';
// import metaversefile from 'metaversefile';
// import { AppContext } from './components/app';

import styles from './ClaimsNotification.module.css';

const ClaimsNotification = () => {
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    const claimschange = e => {
      // console.log('set claims', e.data.claims);
      setClaims(e.data.claims.slice());      
    };
    dropManager.addEventListener('claimschange', claimschange);
    return () => {
      dropManager.removeEventListener('claimschange', claimschange);
    };
  }, []);

  const onClick = e => {
    e.preventDefault();
    e.stopPropagation();

    setState({
        openedPanel: 'CharacterPanel',
    });
  };

  return (
    <div
      className={classnames(
        styles.claimsNotification,
        claims.length > 0 ? styles.open : null,
      )}
      onClick={onClick}
    >
      <img className={styles.icon} src="./images/equipment/noun-backpack-16741.svg" />
      {/* <div className={styles.label}>Drops</div> */}
      <div className={styles.value}>{claims.length}</div>
    </div>
  );
};
export {
  ClaimsNotification,
};