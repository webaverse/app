import React, {useState, useEffect, useRef, useContext} from 'react';
// import { AppContext } from '../../../app';

import styles from './camera-ai-panel.module.css';

export function CameraAiPanel() {
  // const audioRef = useRef();

  //

  const _capture = () => {
    // XXX
  };

  //

  return (
          <div className={styles.panel}>
              <div className={styles.buttons}>
                  <button className={styles.button} onClick={_capture}>Capture image</button>
              </div>
          </div>
  );
}
