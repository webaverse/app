import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
// import classnames from 'classnames';
// import dioramaManager from '../diorama.js';
// import game from '../game.js';
import dioramaManager from '../diorama.js';
import {NpcPlayer} from '../character-controller.js';
import {world} from '../world.js';
import styles from './MegaHup.module.css';
// import {RpgText} from './RpgText.jsx';
// import {chatTextSpeed} from '../constants.js';
import metaversefile from 'metaversefile';
// const {useLocalPlayer} = metaversefile;
// import {chatTextSpeed} from '../constants.js';

const width = 400;
const height = 800;

const MegaHup = function({
  character,
}) {
  const {vrmSrc = null} = character ?? {};

  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && vrmSrc) {
      let live = true;
      let diorama = null;
      let npcPlayer = null;
      (async () => {
        const avatarApp = await metaversefile.createAppAsync({
          start_url: vrmSrc,
        });
        if (!live) return;
        npcPlayer = new NpcPlayer();
        npcPlayer.setAvatarApp(avatarApp);
  
        diorama = dioramaManager.createPlayerDiorama({
          target: npcPlayer,
          objects: [
            npcPlayer.avatar.model,
          ],
          cameraOffset: new THREE.Vector3(-0.5, 0, -0.25),
          // label: true,
          outline: true,
          // grassBackground: true,
          // glyphBackground: true,
        });
        diorama.addCanvas(canvas);
        diorama.enabled = true;
      })();

      const frame = e => {
        const {timestamp, timeDiff} = e.data;
        if (npcPlayer) {
          npcPlayer.updateAvatar(timestamp, timeDiff);
        }
        if (diorama) {
          diorama.update(timestamp, timeDiff);
        }
      };
      world.appManager.addEventListener('frame', frame);

      return () => {
        if (diorama) {
          diorama.removeCanvas(canvas);
          diorama.destroy();
        }
        world.appManager.removeEventListener('frame', frame);
        live = false;
      };
    }
  }, [canvasRef, vrmSrc]);

  return (
    <div className={styles.megaHup}>
      {/* <RpgText className={styles.text} styles={styles} text={text} textSpeed={chatTextSpeed} /> */}
      {vrmSrc ? (
        <canvas
          className={styles.canvas}
          width={width}
          height={height}
          ref={canvasRef}
        />
      ) : null}
    </div>
  );
};
export {
  MegaHup,
};