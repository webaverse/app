import React from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';

export const XR = ({app, xrSupported, open, toggleOpen, panelsRef}) => {
  return (
    <Tab
      type="xr"
      newStyles={styles}
      onclick={async e => {
        if (xrSupported) {
          await app.enterXr();
        }
      }}
      bottom
      right
      disabled={!xrSupported}
      label={
        <div className={styles.label}>
          <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
          <span className={styles.text}>仮想現実 VR{xrSupported ? '' : ' (no)'}</span>
        </div>
      }
      open={open}
      toggleOpen={toggleOpen}
      panelsRef={panelsRef}
    />
  );
};
