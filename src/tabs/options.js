import React from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';

export const Options = ({app, open, toggleOpen, panelsRef}) => {
  return (
    <Tab
      type="options"
      onclick={async e => {
        toggleOpen('options')
      }}
      bottom
      right
      index={1}
      label={
        <div className={styles.label}>
          <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
          <span className={styles.text}>オプション Option</span>
        </div>
      }
      open={open}
      toggleOpen={toggleOpen}
      panelsRef={panelsRef}
    />
  );
};
