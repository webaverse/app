import React, {useRef, useEffect} from 'react';
// import classnames from 'classnames';

export const ImageBitmapCanvas = ({
  imageBitmap = null,
  className,
  style,
}) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (imageBitmap) {
        ctx.drawImage(imageBitmap, 0, 0);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } 
  }, [canvasRef, imageBitmap]);
  
  return imageBitmap ? (
    <canvas
      width={imageBitmap.width}
      height={imageBitmap.height}
      className={className}
      style={style}
      ref={canvasRef}
    />
  ) : null;
};