import * as THREE from 'three'
import React, {useState, useEffect, useRef} from 'react'
import classnames from 'classnames'
import logo from './logo.svg'
import styles from './App.module.css'
import MagicMenu from './MagicMenu.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

import Webaverse from '../webaverse.js';
import * as universe from '../universe.js';
import metaversefileApi from '../metaversefile-api.js';
const {useLocalPlayer} = metaversefileApi;

const _startApp = async (weba, canvas) => {
  weba.setContentLoaded();

  // weba.bindLogin();
  weba.bindInput();
  weba.bindInterface();
  // const uploadFileInput = document.getElementById('upload-file-input');
  // weba.bindUploadFileInput(uploadFileInput);
  // const canvas = document.getElementById('canvas');
  weba.bindCanvas(canvas);

  // const mapCanvas = document.getElementById('map-canvas')
  // weba.bindMinimap(mapCanvas);

  /* const enterXrButton = document.getElementById('enter-xr-button');
  const noXrButton = document.getElementById('no-xr-button');
  weba.bindXrButton({
    enterXrButton,
    // noXrButton,
    onSupported(ok) {
      if (ok) {
        enterXrButton.style.display = null;
        noXrButton.style.display = 'none';
      }
    },
  }); */

  await weba.waitForLoad();
  universe.handleUrlUpdate();
  await weba.startLoop();
  
  {
    const defaultAvatarUrl = './avatars/citrine.vrm';
    const contentId = defaultAvatarUrl;
    const avatarApp = await metaversefileApi.load(contentId);
    avatarApp.contentId = contentId;
    metaversefileApi.addAppToList(avatarApp);
    const localPlayer = useLocalPlayer();
    localPlayer.setAvatar(avatarApp);
  }
};

const Crosshair = () => (
  <div className={styles.crosshair} id="crosshair">
    <img src="./assets/crosshair.svg" width={30} height={30} />
  </div>
);

function RootNode() {
  // const [count, setCount] = useState(0)
  const canvasRef = useRef();
  const [app, setApp] = useState(() => new Webaverse());
  
  useEffect(() => {
    if (canvasRef.current) {
      _startApp(app, canvasRef.current);
    }
  }, [canvasRef.current]);

  return (
    <div className={styles.App} id="app">
      <Header app={app} />
      <Crosshair />
      <canvas id="canvas" className={styles.canvas} ref={canvasRef} />
      <Footer />
    </div>
  );
}
export default RootNode;
