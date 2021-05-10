// import * as React2 from 'react';
// import React from 'react';
// import ReactDOM from 'react-dom';
import * as THREE from 'three';
import React from 'react';
// import ReactDOM from 'react-dom';
import ReactThreeFiber from '@react-three/fiber';
// import {render} from '@react-three/fiber';
// import * as THREE from 'three';
import BabelStandalone from '@babel/standalone';
import JSZip from 'jszip';
// import {EditorView, EditorState, basicSetup, javascript} from 'codemirror';
import {storageHost} from './constants.js';
// console.log('got jszip', BabelStandalone, JSZip);

import App from '/app.js';

const app = new App();
// app.bootstrapFromUrl(location);
app.bindLogin();
app.bindInput();
app.bindInterface();
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
    app.startLoop();
  });

const renderer = app.getRenderer();
const scene = app.getScene();
const camera = app.getCamera();

const editorSize = 500;
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
    const spec = BabelStandalone.transform(script, {
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
const codeEl = document.getElementById('code');
codeEl.innerHTML = s;
const editor = CodeMirror.fromTextArea(codeEl, {
  lineNumbers: true,
  styleActiveLine: true,
  matchBrackets: true,
  lineWrapping: true,
  extraKeys: {
    'Ctrl-S': function(cm) {
      loadText();
    },
    'Ctrl-L': function(cm) {
      uploadNft();
    },
  },
});
editor.display.wrapper.addEventListener('wheel', e => {
  e.stopPropagation();
});
console.log('got editor', editor);
editor.setOption('theme', 'material-ocean');
/* editor.on('keydown', e => {
  if (e.ctrlKey && e.which === 83) { // ctrl-s
    console.log('got save', e);
    e.preventDefault();
  }
}); */

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
  const ipfsUrl = `${storageHost}/ipfs/${rootDirectoryHash}/${start_url}`;
  console.log('got ipfs url', ipfsUrl);
  return ipfsUrl;
};
// const container = document.getElementById('container');
let rootDiv = null;
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
};
const loadText = async () => {
  const s = editor.getValue();
  const b = new Blob([
    s,
  ], {
    type: 'application/javascript',
  });
  // const u = URL.createObjectUrl(b);
  b.name = 'index.js';
  const zipData = await fetchAndCompileBlob(b);
  const files = await fetchZipFiles(zipData);
  const u = await uploadFiles(files);
  console.log('load text', u);
  const el = await loadModule(u);
};
const uploadNft = async () => {
  console.log('upload nft');
};

// loadText();
(async () => {
  const url = new URL(`https://avaer.github.io/chest-rtfjs/index.js`);
  const res = await fetch(url.href);
  const b = await res.blob();
  b.name = url;
  const zipData = await fetchAndCompileBlob(b);
  const files = await fetchZipFiles(zipData);
  const u = await uploadFiles(files);
  const el = await loadModule(u);
  console.log('done render', el);
})();

};