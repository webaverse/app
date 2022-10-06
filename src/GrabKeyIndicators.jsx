import React, { useEffect, useState, useRef, useContext } from 'react';
import styles from './GrabKeyIndicators.module.css';
import grabManager from '../grab-manager.js';
import { KeyIndicator } from './KeyIndicator';

export const GrabKeyIndicators = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(0);

  useEffect(() => {
    const showUi = e => setIsEditMode(true);
    const hideUi = e => setIsEditMode(false);

    grabManager.addEventListener('showui', showUi);
    grabManager.addEventListener('hideui', hideUi);

    const setGridSnap = e => {
      setGridSnapEnabled(e.data.gridSnap);
    };
    grabManager.addEventListener('setgridsnap', setGridSnap);
  });

  return (
    <div>
      {isEditMode ? (
        <ul className={styles.indicatorlist}>
          <li><KeyIndicator indicatorSvg="./images/ui/lmb.svg" label="Take or place object"></KeyIndicator></li>
          <li><KeyIndicator indicator="X" label="Remove object"></KeyIndicator></li>
          <li><KeyIndicator indicator="V" label="Grid Snapping: " gridSnapEnabled={gridSnapEnabled}></KeyIndicator></li>
        </ul>
      ) : null}
    </div>
  );
};