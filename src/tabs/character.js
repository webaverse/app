import React, {useEffect, useState, useRef} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';
import metaversefile from '../../metaversefile-api.js';
import game from '../../game.js';
import {getRenderer} from '../../renderer.js';
import {preview} from '../../preview.js';

// export const generatePreview = async (url, type, width, height, _resolve, _reject) => {

const size = 1024;
const displaySize = 512;
const texSize = 128;
const numSlots = size / texSize;
const numAngles = 64;
const width = size;
const height = size;
const previewImgSize = 70;
const loopTime = 2000;

const _makeCanvasCopier = (result, canvas) => {
  // console.log('make canvas copier', result, canvas);
  const ctx = canvas.getContext('2d');
  let lastFrameIndex = 0;
  return {
    update() {
      const frameIndex = Math.floor((performance.now() % loopTime) / loopTime * numAngles);
      if (frameIndex !== lastFrameIndex) {
        const x = frameIndex % numSlots;
        const y = (frameIndex - x) / numSlots;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          result,
          x * texSize, y * texSize, texSize, texSize,
          0, 0, canvas.width, canvas.height
        );
        lastFrameIndex = frameIndex;
      }
    },
  };
};

const Equipment = ({wearAction}) => {
  // const world = metaversefile.useWorld();
  const localPlayer = metaversefile.useLocalPlayer();

  const previewRef = useRef();
  useEffect(() => {
    const previewImg = previewRef.current;
    if (previewImg) {
      const renderer = getRenderer();
      const pixelRatio = renderer.getPixelRatio();
      // const app = world.appManager.getAppByInstanceId(wearAction.instanceId);
      const app = localPlayer.appManager.getAppByInstanceId(wearAction.instanceId);
      
      (async () => {
        const result = await preview(app.contentId, '360-spritesheet', previewImgSize*pixelRatio, previewImgSize*pixelRatio);
        // console.log('got result', result);
        
        if (live) {
          const canvasCopier = _makeCanvasCopier(result, previewImg);
          function frame() {
            if (live) {
              window.requestAnimationFrame(frame);
              canvasCopier.update();
            }
          }
          window.requestAnimationFrame(frame);
        }
      })().catch(err => {
        console.warn(err);
      });

      let live = true;
      return () => {
        live = false;
      };
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
      <canvas width={previewImgSize} height={previewImgSize} className={styles.icon} ref={previewRef}></canvas>
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
