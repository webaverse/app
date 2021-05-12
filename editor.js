import * as THREE from 'three';
import React from 'react';
const {Fragment, useState, useEffect, useRef} = React;
import ReactDOM from 'react-dom';
import ReactThreeFiber from '@react-three/fiber';
import Babel from '@babel/standalone';
import JSZip from 'jszip';
// import {jsx} from 'jsx-tmpl';
import {world} from './world.js';
import {storageHost} from './constants.js';

import App from '/app.js';

function createPointerEvents(store) {
  // const { handlePointer } = createEvents(store)
  const handlePointer = key => e => {
    // const handlers = eventObject.__r3f.handlers;
    // console.log('handle pointer', key, e);
  };
  const names = {
    onClick: 'click',
    onContextMenu: 'contextmenu',
    onDoubleClick: 'dblclick',
    onWheel: 'wheel',
    onPointerDown: 'pointerdown',
    onPointerUp: 'pointerup',
    onPointerLeave: 'pointerleave',
    onPointerMove: 'pointermove',
    onPointerCancel: 'pointercancel',
    onLostPointerCapture: 'lostpointercapture',
  }

  return {
    connected: false,
    handlers: (Object.keys(names).reduce(
      (acc, key) => ({ ...acc, [key]: handlePointer(key) }),
      {},
    )),
    connect: (target) => {
      const { set, events } = store.getState()
      events.disconnect?.()
      set((state) => ({ events: { ...state.events, connected: target } }))
      Object.entries(events?.handlers ?? []).forEach(([name, event]) =>
        target.addEventListener(names[name], event, { passive: true }),
      )
    },
    disconnect: () => {
      const { set, events } = store.getState()
      if (events.connected) {
        Object.entries(events.handlers ?? []).forEach(([name, event]) => {
          if (events && events.connected instanceof HTMLElement) {
            events.connected.removeEventListener(names[name], event)
          }
        })
        set((state) => ({ events: { ...state.events, connected: false } }))
      }
    },
  }
}

window.onload = () => {

const s = `\
  import * as THREE from 'three';
  import React, {Fragment, useState, useRef} from 'react';
  import ReactThreeFiber from '@react-three/fiber';
  const {Canvas, useFrame, useThree} = ReactThreeFiber;

  function Box(props) {
    // This reference will give us direct access to the THREE.Mesh object
    const mesh = useRef()
    // Set up state for the hovered and active state
    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(false)
    // Subscribe this component to the render-loop, rotate the mesh every frame
    /* useFrame((state, delta) => {
      mesh.current.rotation.x += 0.01;
    }); */
    if (props.animate) {
      useFrame((state, delta) => {
        const t = 2000;
        const f = (Date.now() % t) / t;
        mesh.current.position.x = Math.cos(f * Math.PI * 2);
        mesh.current.position.y = Math.sin(f * Math.PI * 2);
      });
    }
    // Return the view, these are regular Threejs elements expressed in JSX
    return (
      <mesh
        {...props}
        ref={mesh}
        // scale={active ? 1.5 : 1}
        onClick={(event) => setActive(!active)}
        onPointerOver={(event) => setHover(true)}
        onPointerOut={(event) => setHover(false)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={props.color} roughness={1} metalness={0} />
      </mesh>
    )
  }
  /* function Camera(props) {
    const ref = useRef()
    const set = useThree(state => state.set)
    // Make the camera known to the system
    useEffect(() => void set({ camera: ref.current }), [])
    // Update it every frame
    useFrame(() => ref.current.updateMatrixWorld())
    return <perspectiveCamera ref={ref} {...props} />
  } */
  const lightQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, -1, -1).normalize()).toArray();
  const render = () => {
    // console.log('render', r, React, r === React);
    return (
      <Fragment>
        <ambientLight />
        <directionalLight position={[1, 1, 1]} quaternion={lightQuaternion} intensity={2}/>
        <Box position={[0, 1, 0]} color="hotpink" animate />
        <Box position={[0, -2, 0]} color={0x0049ef4} scale={[10, 0.1, 10]} />
      </Fragment>
    );
  };
  export default render;
`;
let editor = null;
const bindTextarea = codeEl => {
  editor = CodeMirror.fromTextArea(codeEl, {
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    lineWrapping: true,
    extraKeys: {
      'Ctrl-S': function(cm) {
        run();
      },
      'Ctrl-L': function(cm) {
        mintNft();
      },
    },
  });
  editor.display.wrapper.addEventListener('wheel', e => {
    e.stopPropagation();
  });
  // console.log('got editor', editor);
  editor.setOption('theme', 'material-ocean');
  /* editor.on('keydown', e => {
    if (e.ctrlKey && e.which === 83) { // ctrl-s
      console.log('got save', e);
      e.preventDefault();
    }
  }); */
};
{
  const _ = React.createElement;
  const container = document.getElementById('container');
  
  const jsx = `
    (() => {
      const [open, setOpen] = useState(true);
      const [selectedTab, setSelectedTab] = useState('editor');
      const [cards, setCards] = useState([]);
      
      const width = 50;
      
      useEffect(async () => {
        const res = await fetch('https://tokens.webaverse.com/1-100');
        const j = await res.json();
        setCards(j);
      }, []);
      
      const Textarea = () => {
        const el = useRef();
        useEffect(() => {
          el.current.innerHTML = s;
          bindTextarea(el.current);
        }, []);
        
        return (
          <textarea className="section code" ref={el} id="code"></textarea>
        );
      };
      const Editor = ({open}) => {
        return (
          <div className={['editor', 'page', open ? 'open' : '', 'sections'].join(' ')}>
            <div className="section files">
              <div className="file selected">
                <div className="file-inner">.metaversefile</div>
              </div>
              <div className="file">
                <div className="file-inner">index.rtfjs</div>
              </div>
            </div>
            <Textarea />
          </div>
        );
      };
      const MiniCard = ({
        // url,
        img,
        name,
        hash,
        ext,
      }) => {
        // console.log('render url', {url, img, name});
        return (
          <nav
            className="card"
            onDragStart={e => {
              const j = {
                hash,
                ext,
              };
              e.dataTransfer.setData('application/json', JSON.stringify(j));
              console.log('drag start', e);
            }}
            draggable
          >
            <div className="inner">
              <img src={img} className="img" />
              <div className="name">{name}</div>
            </div>
          </nav>
        );
      };
      const Scene = ({cards, open}) => {
        return (
          <div className={['scene', 'page', open ? 'open' : '', 'sections'].join(' ')}>
            <div className="section objects">
              <div className="object selected">
                <div className="object-inner">[edited nft]</div>
              </div>
              <div className="object">
                <div className="object-inner">Box</div>
              </div>
            </div>
            <div className="section cards">
              {cards.map((card, i) => {
                const img = "https://card-preview.exokit.org/?w=" + Math.floor(width * window.devicePixelRatio) + "&ext=jpg&t=" + card.id;
                return (
                  <MiniCard
                    img={img}
                    name={card.name}
                    hash={card.hash}
                    ext={card.ext}
                    key={i}
                  />
                );
              })}
            </div>
          </div>
        );
      };
      
      return <div className="root">
        <div className="canvas-placeholder">
          <canvas id="canvas" className="canvas" />
        </div>
        <div className="controls">
          <div className="top">
            {/* <div className="control">
              <div className="user">
                <img src="https://preview.exokit.org/[https://webaverse.github.io/assets/sacks3.vrm]/preview.png" className="img" />
                <div className="name">avaer</div>
              </div>
            </div> */}
          </div>
          <div className="bottom">
            <div className="control" onClick={() => reset()}>
              <img src="/assets/new-shoot.svg" className="icon" />
              <div className="label">Reset</div>
            </div>
            <div className="control" onClick={() => setCameraMode('firstperson')}>
              {/* <video
                src="https://preview.exokit.org/[https://webaverse.github.io/assets/sacks3.vrm]/preview.webm"
                className="video"
                autoPlay
                muted
                loop
              /> */}
              <img src="/assets/video-camera.svg" className="icon" />
              <div className="label">Camera</div>
            </div>
            <div className="control" onClick={() => setCameraMode('avatar')}>
              <img src="/assets/teleport.svg" className="icon" />
              <div className="label">Avatar</div>
            </div>
          </div>
        </div>
        <div className="right">
          <div className="header">
            <nav className={['tab', selectedTab === 'editor' ? 'selected' : ''].join(' ')} onClick={e => setSelectedTab('editor')}>
              <img src="/assets/noun_Plus_950.svg" className="icon" />
              <div className="label">Editor</div>
            </nav>
            <nav className={['tab', selectedTab === 'scene' ? 'selected' : ''].join(' ')} onClick={e => setSelectedTab('scene')}>
              <img src="/assets/noun_Plus_950.svg" className="icon" />
              <div className="label">Scene</div>
            </nav>
            <div className="user">
              <img src="https://preview.exokit.org/[https://webaverse.github.io/assets/sacks3.vrm]/preview.png" className="img" />
              <div className="name">avaer</div>
            </div>
          </div>
          <div className="header">
            {!open ?
              <div className="icon-button" onClick={() => setOpen(true)}>
                <img src="/assets/chevron-left.svg" className="icon" />
              </div>
            : null}
            <button className="button" onClick={() => run()}>
              <img src="/assets/comet-spark.svg" className="icon" />
              <div className="label">Run code</div>
            </button>
            <button className="button" onClick={() => mintNft()}>
              <img src="/assets/mint.svg" className="icon" />
              <div className="label">Mint NFT</div>
            </button>
            <button className="button">
              <img src="/assets/noun_Plus_950.svg" className="icon" />
              <div className="label">New file</div>
            </button>
            <button className="button">
              <img src="/assets/family-tree.svg" className="icon" />
              <div className="label">Import URL...</div>
            </button>
            <select name="nfttype" id="nfttype">
              <option value="react-three-fiber">react-three-fiber</option>
              <option value="threejs">three.js</option>
              <option value="3d-model">3D model</option>
            </select>
          </div>
          <Editor
            open={selectedTab === 'editor'}
          />
          <Scene
            cards={cards}
            open={selectedTab === 'scene'}
          />
        </div>
      </div>
    })
  `;
  const reset = () => {
    console.log('reset');
  };
  let cameraMode = 'camera';
  const setCameraMode = newCameraMode => {
    cameraMode = newCameraMode;
    console.log('got new camera mode', {cameraMode});
    if (cameraMode === 'avatar') {
      app.setAvatarUrl(`https://webaverse.github.io/assets/sacks3.vrm`, 'vrm');
    } else {
      app.setAvatarUrl(null);
    }
  };
  const spec = Babel.transform(jsx, {
    presets: ['react'],
    // compact: false,
  });
  const {code} = spec;
  const fn = eval(code);
  console.log('got fn', fn);
  
  ReactDOM.render(
    React.createElement(fn),
    container
  );
}

const app = new App();
// app.bootstrapFromUrl(location);
app.bindLogin();
app.bindInput();
app.bindInterface();
const canvas = document.getElementById('canvas');
app.bindCanvas(canvas);
/* const uploadFileInput = document.getElementById('upload-file-input');
app.bindUploadFileInput(uploadFileInput);
const mapCanvas = document.getElementById('map-canvas')
app.bindMinimap(mapCanvas);

const enterXrButton = document.getElementById('enter-xr-button');
const noXrButton = document.getElementById('no-xr-button');
app.bindXr({
  enterXrButton,
  noXrButton,
  onSupported(ok) {
    if (ok) {
      enterXrButton.style.display = null;
      noXrButton.style.display = 'none';
    }
  },
}); */
app.waitForLoad()
  .then(() => {
    app.contentLoaded = true;
    app.startLoop();
  });

// make sure to update renderer when canvas size changes
const ro = new ResizeObserver(entries => {
  const resizeEvent = new UIEvent('resize');
  window.dispatchEvent(resizeEvent);
});
ro.observe(canvas);

const renderer = app.getRenderer();
const scene = app.getScene();
const camera = app.getCamera();

// console.log('got react three fiber', ReactThreeFiber);

const fetchAndCompileBlob = async file => {
  const res = file;
  const scriptUrl = file.name;
  let s = await file.text();
  
  const urlCache = {};
  const _mapUrl = async (u, scriptUrl) => {
    const cachedContent = urlCache[u];
    if (cachedContent !== undefined) {
      // return u;
      // nothing
    } else {
      const fullUrl = new URL(u, scriptUrl).href;
      const res = await fetch(fullUrl);
      if (res.ok) {
        let importScript = await res.text();
        importScript = await _mapScript(importScript, fullUrl);
        const p = new URL(fullUrl).pathname.replace(/^\//, '');
        urlCache[p] = importScript;
      } else {
        throw new Error('failed to load import url: ' + u);
      }
    }
  };
  const _mapScript = async (script, scriptUrl) => {
    // const r = /^(\s*import[^\n]+from\s*['"])(.+)(['"])/gm;
    // console.log('map script');
    const r = /((?:im|ex)port(?:["'\s]*[\w*{}\n\r\t, ]+from\s*)?["'\s])([@\w_\-\.\/]+)(["'\s].*);?$/gm;
    // console.log('got replacements', script, Array.from(script.matchAll(r)));
    const replacements = await Promise.all(Array.from(script.matchAll(r)).map(async match => {
      let u = match[2];
      // console.log('replacement', u);
      if (/^\.+\//.test(u)) {
        await _mapUrl(u, scriptUrl);
      }
      return u;
    }));
    let index = 0;
    script = script.replace(r, function() {
      return arguments[1] + replacements[index++] + arguments[3];
    });
    const spec = Babel.transform(script, {
      presets: ['react'],
      // compact: false,
    });
    script = spec.code;
    return script;
  };

  s = await _mapScript(s, scriptUrl);
  const o = new URL(scriptUrl, `https://webaverse.com/`);
  const p = o.pathname.replace(/^\//, '');
  urlCache[p] = s;

  urlCache['.metaversefile'] = JSON.stringify({
    start_url: p,
  });
  
  const zip = new JSZip();
  for (const p in urlCache) {
    const d = urlCache[p];
    // console.log('add file', p);
    zip.file(p, d);
  }
  const ab = await zip.generateAsync({
    type: 'arraybuffer',
  });
  return new Uint8Array(ab);
};
const fetchZipFiles = async zipData => {
  const zip = await JSZip.loadAsync(zipData);
  // console.log('load file 4', zip.files);

  const fileNames = [];
  // const localFileNames = {};
  for (const fileName in zip.files) {
    fileNames.push(fileName);
  }
  const files = await Promise.all(fileNames.map(async fileName => {
    const file = zip.file(fileName);
    
    const b = file && await file.async('blob');
    return {
      name: fileName,
      data: b,
    };
  }));
  return files;
};

const isDirectoryName = fileName => /\/$/.test(fileName);
const uploadFiles = async files => {
  const fd = new FormData();
  const directoryMap = {};
  const metaverseFile = files.find(f => f.name === '.metaversefile');
  // console.log('got', metaverseFile);
  const metaverseJson = await (async () => {
    const s = await metaverseFile.data.text();
    const j = JSON.parse(s);
    return j;    
  })();
  const {start_url} = metaverseJson;
  [
    // mainDirectoryName,
    '',
  ].forEach(p => {
    if (!directoryMap[p]) {
      // console.log('missing main directory', {p, directoryMap, files});
      console.log('add missing main directory', [p]);
      fd.append(
        p,
        new Blob([], {
          type: 'application/x-directory',
        }),
        p
      );
    }
  });

  for (const file of files) {
    const {name} = file;
    const basename = name; // localFileNames[name];
    // console.log('append', basename, name);
    if (isDirectoryName(name)) {
      const p = name.replace(/\/+$/, '');
      console.log('append dir', p);
      fd.append(
        p,
        new Blob([], {
          type: 'application/x-directory',
        }),
        p
      );
      directoryMap[p] = true;
    } else {
      console.log('append file', name);
      fd.append(name, file.data, basename);
    }
  }

  const uploadFilesRes = await fetch(storageHost, {
    method: 'POST',
    body: fd,
  });
  const hashes = await uploadFilesRes.json();

  const rootDirectory = hashes.find(h => h.name === '');
  console.log('got hashes', {rootDirectory, hashes});
  const rootDirectoryHash = rootDirectory.hash;
  return rootDirectoryHash;
  /* const ipfsUrl = `${storageHost}/ipfs/${rootDirectoryHash}`;
  console.log('got ipfs url', ipfsUrl);
  return ipfsUrl; */
};
/* let rootDiv = null;
// let state = null;
const loadModule = async u => {
  const m = await import(u);
  const fn = m.default;
  // console.log('got fn', fn);

  // window.ReactThreeFiber = ReactThreeFiber;

  if (rootDiv) {
    const roots = ReactThreeFiber._roots;
    const root = roots.get(rootDiv);
    const fiber = root?.fiber
    if (fiber) {
      const state = root?.store.getState()
      if (state) state.internal.active = false
      await new Promise((accept, reject) => {
        ReactThreeFiber.reconciler.updateContainer(null, fiber, null, () => {
          if (state) {
            // setTimeout(() => {
              state.events.disconnect?.()
              // state.gl?.renderLists?.dispose?.()
              // state.gl?.forceContextLoss?.()
              ReactThreeFiber.dispose(state)
              roots.delete(canvas)
              // if (callback) callback(canvas)
            // }, 500)
          }
          accept();
        });
      });
    }
  }

  const sizeVector = renderer.getSize(new THREE.Vector2());
  rootDiv = document.createElement('div');

  await app.waitForLoad();
  app.addEventListener('frame', () => {
    ReactThreeFiber.render(
      React.createElement(fn),
      rootDiv,
      {
        gl: renderer,
        camera,
        size: {
          width: sizeVector.x,
          height: sizeVector.y,
        },
        events: createPointerEvents,
        onCreated: state => {
          // state = newState;
          // scene.add(state.scene);
          console.log('got state', state);
        },
        frameloop: 'demand',
      }
    );
  });
}; */
// const selectedType = 'rtfjs'; // XXX implement a real selector
const uploadHash = async () => {
  const s = editor.getValue();
  const b = new Blob([
    s,
  ], {
    type: 'application/javascript',
  });
  // const u = URL.createObjectUrl(b);
  b.name = 'index.rtfjs';
  const zipData = await fetchAndCompileBlob(b);
  const files = await fetchZipFiles(zipData);
  const hash = await uploadFiles(files);
  return hash;
};
const run = async () => {
  const hash = await uploadHash();
  console.log('load hash', hash);
  // const el = await loadModule(u);
  await loadHash(hash);
};
let loadedObject = null;
const loadHash = async hash => {
  if (loadedObject) {
    await world.removeObject(loadedObject.instanceId);
    loadedObject = null;
  }

  const u = `${storageHost}/ipfs/${hash}/.metaversefile`;
  const position = new THREE.Vector3();
  const quaternion  = new THREE.Quaternion();
  loadedObject = await world.addObject(u, null, position, quaternion, {
    // physics,
    // physics_url,
    // autoScale,
  });
};
const mintNft = async () => {
  const hash = await uploadHash();
  console.log('upload nft', hash);
  window.location.href = `https://webaverse.com/mint?hash=${hash}&ext=metaversefile`;
};

// loadText();
(async () => {
  const url = new URL(`https://127.0.0.1:3001/chest-rtfjs/index.js`);
  const res = await fetch(url.href);
  const b = await res.blob();
  b.name = url;
  const zipData = await fetchAndCompileBlob(b);
  const files = await fetchZipFiles(zipData);
  const hash = await uploadFiles(files);
  const o = await loadHash(hash);
  // const u = `${storageHost}/ipfs/${hash}/chest-rtfjs/index.js`;
  // const el = await loadModule(u);
  // console.log('done render', el);
})();

};