import React, {useEffect, useState} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';
import metaversefile from '../../metaversefile-api.js';
import {preview} from '../../preview.js';

export const Character = ({open, game, wearActions, panelsRef, setOpen, toggleOpen}) => {
  const [previews, setPreviews] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const sideSize = 400;
  
  useEffect(() => {
    const localPlayer = metaversefile.useLocalPlayer();
    localPlayer.addEventListener('avatarupdate', e => {
      if (e.app && e.app.contentId !== avatarPreview) {
        let u = e.app.contentId;
        setAvatarPreview(u);
        if (u) {
          if (u.startsWith('.')) {
            u = u.slice(1, u.length);
          }
        }
        if (u.startsWith('/')) {
          u = window.origin + u;
        }
        preview(u, e.app.appType, 'png', 400, 200, 1).then(res => {
          const imageObjectURL = URL.createObjectURL(res.blob);
          previews[e.app.contentId] = imageObjectURL;
          setPreviews(previews);
        });
      }
    });
  }, []);

  useEffect(() => {
    if (wearActions) {
      for (const app of wearActions) {
        if (!previews[app.contentId]) {
          previews[app.contentId] = 'images/flower.png';
          preview(app.contentId, app.appType, 'png', 100, 100).then(res => {
            const imageObjectURL = URL.createObjectURL(res.blob);
            previews[app.contentId] = imageObjectURL;
            setPreviews(previews);
          });
        }
      }
      setPreviews(previews);
    }
  }, [wearActions]);

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
          {/* <canvas id="previewCanvas" className={styles.avatar} ref={previewCanvasRef} width={sideSize} height={sideSize} /> */}
          <img className={styles.avatar} src={ previews[avatarPreview] || '/images/loader.gif'} />
              <div className={styles['panel-header']}>
                <div className={classnames(styles['panel-section'], styles['name'])}>
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
