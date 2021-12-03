import React from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';
import metaversefile from '../../metaversefile-api.js';

export const Character = ({open, game, wearActions, previewCanvasRef, panelsRef, setOpen, toggleOpen}) => {
  return (
    <Tab
      type="character"
      top
      left
      label={
        <div className={styles.label}>
          <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
          <span className={styles.text}>人 Character</span>
          <span className={styles.key}>Tab</span>
        </div>
      }
      panels={[
        (<div className={styles.panel} key="left">
          <div className={styles['panel-header']}>
            <h1>Sheila</h1>
          </div>
          <canvas id="previewCanvas" className={styles.avatar} ref={previewCanvasRef} />
          {/* <div className={styles['panel-header']}>
              <h1>Equipment</h1>
            </div> */}
          {wearActions.map((wearAction, i) => {
            return (
              <div
                className={styles.equipment}
                key={i}
                onMouseEnter={e => {
                  const app = metaversefile.getAppByInstanceId(wearAction.instanceId);
                  game.setMouseHoverObject(null);
                  const physicsId = app.getPhysicsObjects()[0]?.physicsId;
                  game.setMouseDomEquipmentHoverObject(app, physicsId);
                }}
                onMouseLeave={e => {
                  game.setMouseDomEquipmentHoverObject(null);
                }}
              >
                <img src="images/webpencil.svg" className={classnames(styles.background, styles.violet)} />
                <img src="images/flower.png" className={styles.icon} />
                <div className={styles.name}>{wearAction.instanceId}</div>
                <button className={styles.button} onClick={e => {
                  const localPlayer = metaversefile.useLocalPlayer();
                  const app = metaversefile.getAppByInstanceId(wearAction.instanceId);
                  localPlayer.unwear(app);
                }}>
                  <img src="images/remove.svg" />
                </button>
                <div className={styles.background2} />
              </div>
            );
          })}
        </div>),
      ]}
      open={open}
      toggleOpen={toggleOpen}
      panelsRef={panelsRef}
    />
  );
};
