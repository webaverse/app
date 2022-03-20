import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import style from './LoadingBox.module.css';
import {loadImage} from '../util.js';
// import {registerIoEventHandler, unregisterIoEventHandler} from './IoHandler.jsx';

const loadManager = new EventTarget();
const _updateLoadManager = () => {
  loadManager.dispatchEvent(new MessageEvent('update'));
};

const loads = [];
const _getCurrentProgress = () => {
  if (loads.length > 0) {
    let progress = 0;
    for (const load of loads) {
      progress += load.progress;
    }
    return progress / loads.length;
  } else {
    return 1;
  }
};
export const registerLoad = (name, description, progress) => {
  const load = {
    name,
    description,
    progress,
  };
  loads.push(load);
  _updateLoadManager();

  return {
    update(progress) {
      load.progress = progress;
      if (load.progress >= 1) {
        loads.splice(loads.indexOf(load), 1);
      }

      _updateLoadManager();
    },
  };
};

const size = 90;

const LoadingBox = () => {
  const [name, setName] = useState('Loading');
  const [detail, setDetail] = useState('32.4KB / 1.2MB');
  const [images, setImages] = useState(null);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef();

  useEffect(async () => {
    const [
      upRight,
      up,
    ] = await Promise.all([
      './images/ui/upright.png',
      './images/ui/up.png',
    ].map(loadImage));

    setImages({
      upRight,
      up,
    });
  }, []);

  useEffect(async () => {
    function update(e) {
      const progress = _getCurrentProgress();
      console.log('got progress', progress);
      setProgress(progress);
      setOpen(progress < 1);
    }
    loadManager.addEventListener('update', update);
    return () => {
      loadManager.removeEventListener('update', update);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && images && open) {
      const ctx = canvas.getContext('2d');

      const {upRight, up} = images;

      const _frame = () => {
        const now = performance.now();
        const f = (now / 1000) % 1

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const _render = f => {
          const fx = (-0.5 + f) * 2 * 130;

          ctx.rotate(Math.PI/4);
          ctx.drawImage(up, 0, 0, up.width, up.height, -3, - fx*Math.SQRT2, up.width * Math.SQRT2, up.height * Math.SQRT2);
        
          ctx.resetTransform();
          ctx.drawImage(upRight, fx, -fx);
        };
        /* _render(f + 0.75);
        _render(f + 0.5);
        _render(f + 0.25); */
        _render(f);

        frame = requestAnimationFrame(_frame);
      };
      let frame = requestAnimationFrame(_frame);
      return () => {
        cancelAnimationFrame(frame);
      };
    }
  }, [canvasRef, images, open]);
  
  return (
    <div className={classnames(style.loadingBox, open ? style.open : null)}>
      <canvas className={style.canvas} width={size} height={size} ref={canvasRef} />
      <div className={style.wrap}>
        <div className={style.name}>{name}</div>
        <div className={style.detail}>{detail}</div>
        <progress className={style.progress} value={progress} max={1} />
      </div>
    </div>
  );
};
export {
  LoadingBox,
};