import React, {useEffect} from 'react';
import style from './DragAndDrop.module.css';
import {handleUpload} from '../util.js';
import {registerIoEventHandler, unregisterIoEventHandler} from './IoHandler.jsx';
import {registerLoad} from './LoadingBox.jsx';

const DragAndDrop = () => {
  const _upload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    // input.setAttribute('webkitdirectory', '');
    // input.setAttribute('directory', '');
    input.setAttribute('multiple', '');
    input.click();
    input.addEventListener('change', async e => {
      const load = registerLoad('loading', 'file', 0);
      const u = await handleUpload(e.target.files);
      load.update(1);
    });
  };

  useEffect(() => {
    function keydown(e) {
      if (e.which === 85) { // U
        _upload();
      }
    }
    registerIoEventHandler('keydown', keydown);
    return () => {
      unregisterIoEventHandler('keydown');
    };
  }, []);

  return (
    <div className={style.dragAndDrop}>
      
    </div>
  );
};
export {
  DragAndDrop,
};