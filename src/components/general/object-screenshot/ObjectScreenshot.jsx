import React, {useEffect, useState, useRef} from 'react';
import classnames from 'classnames';

import {screenshotObjectApp} from '../../../../object-screenshotter';

import styles from './object-screenshot.module.css';

//

function useOnScreen(ref) {
  const [isIntersecting, setIntersecting] = useState(false);

  const observer = new IntersectionObserver(
    ([entry]) => setIntersecting(entry.isIntersecting),
  );

  useEffect(() => {
    observer.observe(ref.current);
    return () => { observer.disconnect(); };
  }, []);

  return isIntersecting;
}

export const ObjectScreenshot = ({app, visible, width, height, className = ''}) => {
  const canvasRef = useRef(null);

  const [isScreenshotted, setIsScreenshotted] = useState(false);

  const isVisible = useOnScreen(canvasRef);

  useEffect(() => {
    (async () => {
      if (!isVisible) return;
      if (!canvasRef.current) return;
      if (!isScreenshotted) {
        const canvas = await screenshotObjectApp({app, clearAlpha: 0, width, height});
        canvasRef.current.innerHTML = '';
        canvasRef.current.appendChild(canvas);
        setIsScreenshotted(true);
      }
    })();
  }, [app, isVisible]);

  //

  return (
    <div className={classnames(className, styles.imgWrapper)} >
      <div ref={canvasRef} width={width} height={height}></div>
      <div className={styles.background} />
    </div>
  );
};
