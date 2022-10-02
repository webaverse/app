// import * as THREE from 'three';
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
// import metaversefile from 'metaversefile';
import { AppContext } from './components/app';

import styles from './ClaimsNotification.module.css';

import dropManager from '../drop-manager.js';

const ClaimsNotification = () => {
  const {state, setState} = useContext(AppContext);
  const [numClaims, setNumClaims] = useState(0);

  useEffect(() => {
    const claimschange = e => {
      setNumClaims(e.data.claims.length);
    };
    dropManager.addEventListener('claimschange', claimschange);
    return () => {
      dropManager.removeEventListener('claimschange', claimschange);
    };
  }, []);

  const open = numClaims > 0 && state.openedPanel === null;

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
        open ? styles.open : null,
      )}
      onClick={onClick}
    >
      <div className={styles.value}>{numClaims}</div>
      <div className={styles.label}>Claims</div>
    </div>
  );
};
export {
  ClaimsNotification,
};