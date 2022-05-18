import React, {useRef, useEffect} from 'react';
import classnames from 'classnames';

import styles from './ImageBitmapCanvas.module.css';

export const ImageBitmapCanvas = ({
  imageBitmap = null,
  backImageBitmap = null,
  className,
  canvasClassName,
  // style,
  flip = false,
  rotateX = 0,
  rotateY = 0,
}) => {
  const frontCanvasRef = useRef();
  const backCanvasRef = useRef();

  useEffect(() => {
    const canvas = frontCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (imageBitmap) {
        ctx.drawImage(imageBitmap, 0, 0);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } 
  }, [frontCanvasRef, imageBitmap]);

  useEffect(() => {
    const canvas = backCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (backImageBitmap) {
        ctx.drawImage(backImageBitmap, 0, 0);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } 
  }, [backCanvasRef, backImageBitmap]);
  
  const _getStyle = front => {
    return {
      transform: `rotateY(${(rotateY + ((+flip ^ +front) ? 0 : Math.PI)).toFixed(8)}rad) rotateX(${rotateX.toFixed(8)}rad)`,
    };
  };

  return (
    <div
      className={classnames(styles.imageBitmapCanvas, className)}
    >
      {backImageBitmap ? (
        <canvas
          className={classnames(canvasClassName, styles.canvas, styles.backCanvas)}
          style={_getStyle(false)}
          width={backImageBitmap.width}
          height={backImageBitmap.height}
          ref={backCanvasRef}
        />
      ) : null}
      {imageBitmap ? (
        <canvas
          className={classnames(canvasClassName, styles.canvas, styles.frontCanvas)}
          style={_getStyle(true)}
          width={imageBitmap.width}
          height={imageBitmap.height}
          ref={frontCanvasRef}
        />
      ) : null}
    </div>
  );
};