import React from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';
import metaversefile from '../../metaversefile-api.js';

const _formatContentId = contentId => contentId.replace(/^[\s\S]*\/([^\/]+)$/, '$1');


const NumberInput = ({input}) => {
  return <input type="number" className={styles.input} value={input.value} onChange={input.onChange} onKeyDown={e => {
    if (e.which === 13) {
      e.target.blur();
    }
  }} />;
};

export const World = ({open, game, apps, selectedApp, selectApp, setSelectedApp, px, py, pz, rx, ry, rz, sx, sy, sz, panelsRef, setOpen, toggleOpen}) => {
  return (
    <Tab
      type="world"
      newStyles={styles}
      top
      right
      className={styles['selected-panel-' + (selectedApp ? 2 : 1)]}
      label={
        <div className={styles.label}>
          <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
          <span className={styles.text}>世 World</span>
          <span className={styles.key}>Z</span>
        </div>
      }
      panels={[
        (<div className={styles.panel} key="left">
          <div className={styles['panel-header']}>
            <h1>Tokens</h1>
          </div>
          <div className={styles.objects}>
            {apps.map((app, i) => {
              return (
                <div className={classnames(styles.object, app === selectedApp ? styles.selected : null)} key={i} onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();

                  const physicsObjects = app.getPhysicsObjects();
                  const physicsObject = physicsObjects[0] || null;
                  const physicsId = physicsObject ? physicsObject.physicsId : 0;
                  selectApp(app, physicsId);

                  const localPlayer = metaversefile.useLocalPlayer();
                  localPlayer.lookAt(app.position);
                }} onMouseEnter={e => {
                  const physicsObjects = app.getPhysicsObjects();
                  const physicsObject = physicsObjects[0] || null;
                  const physicsId = physicsObject ? physicsObject.physicsId : 0;

                  game.setMouseHoverObject(null);
                  game.setMouseDomHoverObject(app, physicsId);
                }} onMouseLeave={e => {
                  game.setMouseDomHoverObject(null);
                }} onMouseMove={e => {
                  e.stopPropagation();
                  // game.setMouseSelectedObject(null);
                }}>
                  <img src="images/webpencil.svg" className={classnames(styles['background-inner'], styles.lime)} />
                  <img src="images/object.jpg" className={styles.img} />
                  <div className={styles.wrap}>
                    <div className={styles.name}>{app.contentId.replace(/^[\s\S]*\/([^\/]+)$/, '$1')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>),
        (selectedApp ? <div className={styles.panel} key="right">
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
        </div> : null),
      ]}
      open={open}
      toggleOpen={toggleOpen}
      panelsRef={panelsRef}
    />
  );
};
