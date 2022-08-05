// import * as THREE from 'three';
import React from 'react';
import styles from './build-version.module.css';

//

export const BuildVersion = () => {
  return (
    <div className={styles.buildVersion}>
    <div className={styles.wrap}>
        <div className={styles.text}>Dev Alpha</div>
        <div className={styles.subtext}>Season 0.51</div>
        {/* <img src="/image/ui/line-highlight.svg" className={styles.img} /> */}
      </div>
    </div>
  );
};