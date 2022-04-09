import React, {useState, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './MegaHotBox.module.css';

const width = 400;

export const MegaHotBox = ({
  open = true,
  spritesheet = null,
}) => {
    const canvasRef = useRef();
    const [height, setHeight] = useState(window.innerHeight);
    // const [selected, setSelected] = useState(false);

    /* useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas && npcPlayer) {
        let live = true;
        let diorama = null;
        {
          diorama = dioramaManager.createPlayerDiorama({
            target: npcPlayer,
            objects: [
              npcPlayer.avatar.model,
            ],
            cameraOffset: new THREE.Vector3(-0.8, 0, -0.4),
            // label: true,
            // outline: true,
            // grassBackground: true,
            // glyphBackground: true,
            dotsBackground: true,
          });
          diorama.addCanvas(canvas);
          diorama.enabled = true;
        }
  
        const frame = e => {
          const {timestamp, timeDiff} = e.data;
          if (diorama) {
            diorama.update(timestamp, timeDiff);
          }
        };
        world.appManager.addEventListener('frame', frame);
        const resize = e => {
          diorama.setSize(width, window.innerHeight);
        };
        window.addEventListener('resize', resize);
  
        return () => {
          if (diorama) {
            diorama.removeCanvas(canvas);
            diorama.destroy();
          }
          world.appManager.removeEventListener('frame', frame);
          window.removeEventListener('resize', resize);
          live = false;
        };
      }
    }, []); */
    
    const pixelRatio = window.devicePixelRatio;

    return (
      <div className={ classnames(styles.megaHotBox, open ? styles.open : null) } >
        <div className={ styles.box } />
        <div className={ styles.label }>
          <div className={ styles.background } />
          <div className={ styles.text }>{''}</div>
        </div>
        <canvas
          className={ styles.canvas }
          width={width * pixelRatio}
          height={height * pixelRatio}
          ref={canvasRef}
        />
      </div>
    );
};