import React, { useEffect, useState, useRef, useContext } from 'react';
import styles from './GrabKeyIndicators.module.css';
import grabManager from '../grab-manager';

export const GrabKeyIndicators = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  return (
    <div>
      <ul
        className={styles.indicatorlist}
        width={400}
        height={400}
      >
        {/* <li><img className={styles.indicator} src={`./images/indicator.svg`} /> Take or place object</li> */}
        <li>Remove object</li>
        <li>Grid Snapping: Off</li>
      </ul>
    </div>
  );
};