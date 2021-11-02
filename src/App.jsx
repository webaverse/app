import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import logo from './logo.svg';
import styles from './App.module.css';
import MagicMenu from './MagicMenu.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

import Webaverse from '../webaverse.js';
import * as universe from '../universe.js';
import metaversefileApi from '../metaversefile-api.js';
const {useLocalPlayer} = metaversefileApi;

const _startApp = async (weba, canvas) => {
  weba.setContentLoaded();

  weba.bindInput();
  weba.bindInterface();
  weba.bindCanvas(canvas);

  await weba.waitForLoad();
  universe.handleUrlUpdate();
  await weba.startLoop();
  
  {
    const defaultAvatarUrl = './avatars/citrine.vrm';
    const contentId = defaultAvatarUrl;
    const avatarApp = await metaversefileApi.load(contentId);
    avatarApp.instanceId = metaversefileApi.getNextInstanceId();
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
