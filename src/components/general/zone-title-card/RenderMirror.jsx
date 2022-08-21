import React, {useState, useEffect, useRef} from 'react';
// import classnames from 'classnames';

import styles from './zone-title-card.module.css';

//

export const RenderMirror = ({
  app,
  width,
  enabled,
}) => {
  const aspectRatio = 16 / 9;
  const height = Math.floor(width / aspectRatio);

  const canvasRef = useRef();

  useEffect(() => {
    if (canvasRef.current && enabled) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      async function frameend(e) {
        const {canvas: mainCanvas} = e.data;
        ctx.drawImage(mainCanvas, 0, 0, mainCanvas.width, mainCanvas.height, 0, 0, canvas.width, canvas.height);
        // const imageBitmap = await createImageBitmap(mainCanvas, 0, 0, canvas.width, canvas.height);
        // ctx.transferFromImageBitmap(imageBitmap);
      }
      app.addEventListener('frameend', frameend);
      return () => {
        app.removeEventListener('frameend', frameend);
      };
    }
  }, [canvasRef, width, enabled]);

  return (
    <canvas className={styles.renderMirror} width={width} height={height} ref={canvasRef} />
  );
};
