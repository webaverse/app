import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import style from './LoadingBox.module.css';
import {loadImage} from '../util.js';

const loadManager = new EventTarget();
const _updateLoadManager = () => {
  loadManager.dispatchEvent(new MessageEvent('update'));
};

const loads = [];
const _getCurrentProgress = () => {
  let progress = 0;
  let total = 0;
  if (loads.length > 0) {
    for (const load of loads) {
      if (!isNaN(load.progress)) {
        progress += load.progress;
      }
      if (!isNaN(load.total)) {
        total += load.total;
      }
    }
  } else {
    progress = 1;
    total = 1;
  }
  return {
    progress,
    total,
  };
};
export const registerLoad = (type = 'download', name = '', progress = NaN, total = NaN) => {
  const load = {
    type,
    name,
    progress,
    total,
  };
  loads.push(load);
  _updateLoadManager();

  return {
    update(progress, total) {
      load.progress = progress;
      load.total = total;
      if (load.progress >= load.total) {
        loads.splice(loads.indexOf(load), 1);
      }

      _updateLoadManager();
    },
    end() {
      loads.splice(loads.indexOf(load), 1);

      _updateLoadManager();
    },
  };
};

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0b';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['b', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const size = 90;

const LoadingBox = () => {
  // const [name, setName] = useState('Loading');
  // const [detail, setDetail] = useState('32.4KB / 1.2MB');
  const [images, setImages] = useState(null);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [load, setLoad] = useState(null);
  const canvasRef = useRef();

  useEffect(async () => {
    const [
      upRight,
      up,
      down,
    ] = await Promise.all([
      './images/ui/upright.png',
      './images/ui/up.png',
      './images/ui/down.png',
    ].map(loadImage));

    setImages({
      upRight,
      up,
      down,
    });
  }, []);

  useEffect(async () => {
    function update(e) {
      const load = loads.length > 0 ? loads[0] : null;
      setOpen(!!load);
      setLoad(load);

      const progress = _getCurrentProgress();
      setProgress(progress);
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

      const {upRight, up, down} = images;

      const _frame = () => {
        const now = performance.now();
        const f = (now / 1000) % 1

        // const _render = f => {
          ctx.resetTransform();
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (load) {
            if (load.type === 'download') {
              const w = canvas.width;
              const h = canvas.height * up.height / up.width;

              let fx = (-0.5 + f) * h*2.5;

              // ctx.filter = `hue-rotate(145deg)`;

              ctx.resetTransform();
              ctx.translate(w / 2, h / 2);
              ctx.rotate(Math.PI);
              ctx.translate(-w / 2, -h / 2);
              ctx.drawImage(up, 0, 0, up.width, up.height, 0, -fx, w, h);

              const w2 = canvas.width;
              const h2 = canvas.height * down.height / down.width;

              ctx.resetTransform();
              ctx.drawImage(down, 0, 0, down.width, down.height, 0, fx + h - h2/2, w2, h2);
            } else {
              const fx = (-0.5 + f) * 2 * 130;

              ctx.resetTransform();
              ctx.rotate(Math.PI/4);
              ctx.drawImage(up, 0, 0, up.width, up.height, -3, - fx*Math.SQRT2, up.width * Math.SQRT2, up.height * Math.SQRT2);
            
              ctx.resetTransform();
              ctx.drawImage(upRight, fx, -fx);
            }
          }
        // };
        /* _render(f + 0.75);
        _render(f + 0.5);
        _render(f + 0.25); */
        // _render(f);

        frame = requestAnimationFrame(_frame);
      };
      let frame = requestAnimationFrame(_frame);
      return () => {
        cancelAnimationFrame(frame);
      };
    }
  }, [canvasRef, images, open, load]);

  const name = load ? capitalize(load.type + 'ing') : 'Loading';
  const detail = (open && progress.total > 0) ? `${formatBytes(progress.progress)} / ${formatBytes(progress.total)}` : '';
  
  return (
    <div className={classnames(style.loadingBox, open ? style.open : null)}>
      <canvas className={style.canvas} width={size} height={size} ref={canvasRef} />
      <div className={style.wrap}>
        <div className={style.name}>{name}</div>
        <div className={style.detail}>{detail}</div>
        <progress className={style.progress} value={progress.progress} max={progress.total} />
      </div>
    </div>
  );
};
export {
  LoadingBox,
};