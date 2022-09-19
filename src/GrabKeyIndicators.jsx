import React, { useEffect, useState, useRef, useContext } from 'react';
import styles from './GrabKeyIndicators.module.css';
import grabManager from '../grab-manager.js';
import { KeyIndicator } from './KeyIndicator';

export const GrabKeyIndicators = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(false);

  useEffect(() => {
    const toggleEditMode = e => {
      setIsEditMode(e.data.isEditMode);
    };
    grabManager.addEventListener('toggleeditmode', toggleEditMode);

    const setGridSnap = e => {
      setGridSnapEnabled(e.data.gridSnap > 0);
    };
    grabManager.addEventListener('setgridsnap', setGridSnap);
  });

  return (
    <div>
      {isEditMode ? (
        <ul className={styles.indicatorlist}>
          <li><KeyIndicator indicatorSvg="./images/ui/lmb.svg" label="Take or place object"></KeyIndicator></li>
          <li><KeyIndicator indicator="X" label="Remove object"></KeyIndicator></li>
          <li><KeyIndicator indicator="V" label="Grid Snapping: Off"></KeyIndicator></li>
        </ul>
      ) : null}
    </div>
  );
};