// import * as THREE from 'three';
import React from 'react';
import classnames from 'classnames';
import styles from './build-version.module.css';

//

export const BuildVersionLayer = ({
  color,
  backgroundImage,
  clear = false,
  animate = false,
}) => {
  /* console.log('got classname', {
    classnames: classnames(styles.buildVersion, clear ? styles.clear : null),
    backgroundImage,
  }); */

  /* console.log('got colors', {
    color,
    backgroundImage,
    // we need to special case dash prefixed properties in React
    // '-webkit-text-fill-color',
    WebkitTextFillColor: color,
  }); */

  return (
    <div
      className={classnames(
        styles.buildVersion,
        clear ? styles.clear : null,
        animate ? styles.animate : null,
      )}
      style={{
        color,
        // backgroundImage,
        // background: `url(${backgroundImage})`,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : null,
        // we need to special case dash prefixed properties in React
        // '-webkit-text-fill-color',
        // WebkitTextFillColor: color,
      }}
    >
      <div className={styles.wrap}>
        <div className={styles.text}>Dev Alpha</div>
        <div className={styles.subtext}>Season 0.51</div>
      </div>
    </div>
  );
};

export const BuildVersion = () => {
  return (
    <div className={styles.buildVersions}>
      <BuildVersionLayer color="#000000" />
      {/* <BuildVersionLayer color="#FFFFFF" backgroundImage="images/ui/line-highlight-white.svg" clear animate /> */}
      <BuildVersionLayer color="#FFFFFF" backgroundImage="images/ui/line-slash.svg" clear animate />
    </div>
  );
};