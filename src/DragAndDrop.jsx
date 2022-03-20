import React, {useEffect} from 'react';
import style from './DragAndDrop.module.css';
import {handleUpload} from '../util.js';
import {registerIoEventHandler, unregisterIoEventHandler} from './IoHandler.jsx';

const _upload = () => {
  const input = document.createElement('input');
  input.type = 'file';
  // input.setAttribute('webkitdirectory', '');
  // input.setAttribute('directory', '');
  input.setAttribute('multiple', '');
  input.click();
  input.addEventListener('change', e => {
    handleUpload(e.target.files);
  });
};

const DragAndDrop = () => {
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