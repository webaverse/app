import React, {useEffect, useState, useRef} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';
import metaversefile from '../../metaversefile-api.js';
import {defaultPlayerName} from '../../ai/lore/lore-model.js';

const emotions = [
  'joy',
  'sorrow',
  'angry',
  'surprised',
  'fun',
];

export const Character = ({open, game, wearActions, panelsRef, setOpen, toggleOpen, dioramaCanvasRef}) => {
  const emotionsRef = useRef();
  
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
          <div
            className={styles.emotions}
            onMouseUp={e => {
              document.exitPointerLock();
            }}
            ref={emotionsRef}
          >
            {emotions.map(emotion => {
              // const emotionRef = useRef();

              return (
                <div
                  className={styles.emotion}
                  onMouseDown={e => {
                    e.preventDefault();
                    e.stopPropagation();

                    (async () => {
                      const emotionsEl = emotionsRef.current;
                      await emotionsEl.requestPointerLock();
                      /* const emotionEl = emotionRef.current;
                      await emotionEl.requestPointerLock(); */
                    })();
                  }}
                  // ref={emotionRef}
                  key={emotion}
                >
                  <img src={`images/emotions/${emotion}.svg`} className={styles.emotionIcon} />
                  <div className={styles.emotionName}>{emotion}</div>
                </div>
              );
            })}
          </div>
          <canvas id="previewCanvas" className={styles.avatar} ref={dioramaCanvasRef} width={sideSize} height={sideSize} />
          <div className={styles['panel-header']}>
            <div className={classnames(styles['panel-section'], styles.name)}>
              <h1>{defaultPlayerName}</h1>
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
            const app = metaversefile.getAppByInstanceId(wearAction.instanceId);

            return (
              <div
                className={styles.equipment}
                key={i}
                onMouseEnter={e => {
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
                <div className={styles.name}>{app.name}</div>
                <button className={styles.button} onClick={e => {
                  const localPlayer = metaversefile.useLocalPlayer();
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
