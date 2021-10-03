import React, {useState, useEffect, useRef} from 'react'
import logo from './logo.svg'
import classes from './App.module.css'
import MagicMenu from './MagicMenu.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import App from '../app.js';
import {world} from '../world.js';
import metaversefileApi from '../metaversefile-api.js';
const {useLocalPlayer} = metaversefileApi;

const _startApp = async (app, canvas) => {
  app.bootstrapFromUrl(location);

  app.bindLogin();
  app.bindInput();
  app.bindInterface();
  // const uploadFileInput = document.getElementById('upload-file-input');
  // app.bindUploadFileInput(uploadFileInput);
  // const canvas = document.getElementById('canvas');
  app.bindCanvas(canvas);

  // const mapCanvas = document.getElementById('map-canvas')
  // app.bindMinimap(mapCanvas);

  app.setPossessed(true);

  /* const enterXrButton = document.getElementById('enter-xr-button');
  const noXrButton = document.getElementById('no-xr-button');
  app.bindXrButton({
    enterXrButton,
    // noXrButton,
    onSupported(ok) {
      if (ok) {
        enterXrButton.style.display = null;
        noXrButton.style.display = 'none';
      }
    },
  }); */

  await app.waitForLoad();
  await app.startLoop();
  
  {
    const defaultAvatarUrl = './avatars/citrine.vrm';
    const avatarApp = await world.addObject(defaultAvatarUrl);
    const localPlayer = useLocalPlayer();
    localPlayer.setAvatar(avatarApp);
  }
};

function RootNode() {
  // const [count, setCount] = useState(0)
  const canvasRef = useRef();
  const [app, setApp] = useState(() => new App());
  
  useEffect(() => {
    if (canvasRef.current) {
      _startApp(app, canvasRef.current);
    }
  }, [canvasRef.current]);

  // console.log('got classes', {classes});

  return (
    <div className={classes.App} id="app">
      <Header app={app} />
      <div className={classes.crosshair} id="crosshair">
        <img src="./assets/crosshair.svg" width={30} height={30} />
      </div>
      <canvas id="canvas" className={classes.canvas} ref={canvasRef} />
      <MagicMenu />
      <Footer />
    </div>
  );
}
export default RootNode;
