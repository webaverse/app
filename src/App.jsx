import React, {useState, useEffect, useRef} from 'react'
import logo from './logo.svg'
import classes from './App.module.css'
import MagicMenu from './MagicMenu.jsx';
import Footer from './Footer.jsx';
import App from '/app.js';

const _startApp = async (canvas) => {
  const app = new App();

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

  await app.waitForLoad();
  await app.startLoop();
};

function RootNode() {
  // const [count, setCount] = useState(0)
  const canvasRef = useRef();
  
  useEffect(() => {
    if (canvasRef.current) {
      _startApp(canvasRef.current);
    }
  }, [canvasRef.current]);

  console.log('got classes', {classes});

  return (
    <div className={classes.App}>
      <MagicMenu />
      <canvas id="canvas" className={classes.canvas} ref={canvasRef} />
      <Footer />
    </div>
  );
}
export default RootNode;
