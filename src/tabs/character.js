import React, {useEffect, useState, useRef} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';
import metaversefile from '../../metaversefile-api.js';
import game from '../../game.js';
import {getRenderer} from '../../renderer.js';
import {generatePreview} from '../../preview.js';

// export const generatePreview = async (url, type, width, height, _resolve, _reject) => {

const previewImgSize = 70;

const Equipment = ({wearAction}) => {
  const world = metaversefile.useWorld();
  const localPlayer = metaversefile.useLocalPlayer();

  const previewRef = useRef();
  useEffect(() => {
    const previewImg = previewRef.current;
    if (previewImg) {
      const renderer = getRenderer();
      const pixelRatio = renderer.getPixelRatio();
      // const app = world.appManager.getAppByInstanceId(wearAction.instanceId);
      const app = localPlayer.appManager.getAppByInstanceId(wearAction.instanceId);
      generatePreview(app.contentId, 'png', previewImgSize*pixelRatio, previewImgSize*pixelRatio, result => {
        console.log('got preview', result);
      }, err => {
        console.warn('error generating preview', err);
      });
    }
  }, [previewRef.current]);

  return (
    <div
      className={styles.equipment}
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
      <img className={styles.icon} ref={previewRef} />
      {/* <img src="images/flower.png" className={styles.icon} /> */}
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
};

export const Character = ({open, game, wearActions, panelsRef, setOpen, toggleOpen, previewCanvasRef}) => {
  const sideSize = 400;

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
          <canvas id="previewCanvas" className={styles.avatar} ref={previewCanvasRef} width={sideSize} height={sideSize} />
          <div className={styles['panel-header']}>
            <div className={classnames(styles['panel-section'], styles.name)}>
              <h1>Scillia</h1>
            </div>
            <div className={classnames(styles['panel-section'], styles['name-placeholder'])} />
            <div className={classnames(styles['panel-section'], styles['main-stats'])}>
              <div className={styles['panel-row']}>
                <h2>HP</h2>
                <progress value={61} />
              </div>
              <div className={styles['panel-row']}>
                <h2>MP</h2>
                <progress value={83} />
              </div>
            </div>
          </div>
          {/* <div className={styles['panel-header']}>
          <h1>Equipment</h1>
        </div> */}
          {wearActions.map((wearAction, i) => {
            return (
              <Equipment wearAction={wearAction} key={i} />
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
