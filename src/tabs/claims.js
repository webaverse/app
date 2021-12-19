import React from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';

export const Claims = ({claims, open, toggleOpen, panelsRef}) => {
  return (
    <Tab
      type="claims"
      newStyles={styles}
      bottom
      left
      disabled={claims.length === 0}
      className="skew"
      label={
        <div className={styles.label}>
          <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
          <span className={styles.text}>品 Claims ({claims.length})</span>
        </div>
      }
      after={
        <div className={styles['transparent-panel']}>
          <div className={styles.buttons}>
            <button className={styles.button}>Claim all</button>
            <button className={styles.button}>Reject</button>
          </div>
        </div>
      }
      before={
        <div className={styles.slide} />
      }
      open={open}
      toggleOpen={toggleOpen}
      panelsRef={panelsRef}
    />
  );
};
