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
      top
      right
      index={1}
      label={
        <div className={styles.label}>
          <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
          <span className={styles.text}>オプション Option</span>
        </div>
      }
      panels={[
        (<div className={styles.panel} key="left">
          <div className={styles['panel-header']}>
            <h1>Options</h1>
          </div>
          <h1>Avatar style</h1>
          <input type="range" min={1} max={4} step={1} className={styles['slider']} />
          <p className={styles['description']}></p>
        </div>),
        /* (selectedApp ? <div className={styles.panel} key="right">
          <div className={styles['panel-header']}>
            <div className={classnames(styles.button, styles.back)} onClick={e => {
              e.preventDefault();
              e.stopPropagation();

              setSelectedApp(null);
            }}>
              <img src="images/webchevron.svg" className={styles.img} />
            </div>
            <h1>{_formatContentId(selectedApp.contentId)}</h1>
          </div>
          <div className={styles['panel-subheader']}>Position</div>
          <div className={styles.inputs}>
            <NumberInput input={px} />
            <NumberInput input={py} />
            <NumberInput input={pz} />
          </div>
          <div className={styles['panel-subheader']}>Rotation</div>
          <div className={styles.inputs}>
            <NumberInput input={rx} />
            <NumberInput input={ry} />
            <NumberInput input={rz} />
          </div>
          <div className={styles['panel-subheader']}>Scale</div>
          <div className={styles.inputs}>
            <NumberInput input={sx} />
            <NumberInput input={sy} />
            <NumberInput input={sz} />
          </div>
        </div> : null), */
      ]}
      open={open}
      toggleOpen={toggleOpen}
      panelsRef={panelsRef}
    />
  );
};
