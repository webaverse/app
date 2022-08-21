import * as THREE from 'three';
import React, {useState, useEffect} from 'react';
import classnames from 'classnames';
import style from './FocusBar.module.css';
import cameraManager from '../camera-manager.js';

const FocusBar = () => {
  // const { state, setState, } = useContext( AppContext )
  // const [queue, setQueue] = useState([]);
  // const [currentApp, setCurrentApp] = useState(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    function focuschange(e) {
      const {focus} = e.data;
      setFocused(focus);
    }
    cameraManager.addEventListener('focuschange', focuschange);
    return () => {
      cameraManager.removeEventListener('focuschange', focuschange);
    };
  }, []);

  return (
    <div className={classnames(style.focusBar, focused ? style.focused : null)}>
      <div className={style.topBar} />
      <div className={style.bottomBar} />
    </div>
  );
};
export {
  FocusBar,
};