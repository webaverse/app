import React, {useState, useEffect} from 'react'
import logo from './logo.svg'
import classes from './App.module.css'
import MagicMenu from './MagicMenu.jsx';
import App from '/app.js';

const _startApp = () => {
  const app = new App();

  app.bootstrapFromUrl(location);

  app.bindLogin();
  app.bindInput();
  app.bindInterface();
  const uploadFileInput = document.getElementById('upload-file-input');
  app.bindUploadFileInput(uploadFileInput);
  const canvas = document.getElementById('canvas');
  app.bindCanvas(canvas);

  const mapCanvas = document.getElementById('map-canvas')
  app.bindMinimap(mapCanvas);

  app.setPossessed(true);

  const enterXrButton = document.getElementById('enter-xr-button');
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
  });

  app.waitForLoad()
    .then(() => {
      app.startLoop();
    });
};

function RootNode() {
  // const [count, setCount] = useState(0)
  useEffect(() => {
    _startApp();
  }, []);

  return (
    <div className={classes.App}>
      <MagicMenu />
    </div>
  );
}
export default RootNode;
