// import * as React2 from 'react';
// import React from 'react';
// import ReactDOM from 'react-dom';
import * as THREE from 'three';
import ReactDOM from 'react';
import ReactThreeFiber from '@react-three/fiber';
// import {render} from '@react-three/fiber';
// import * as THREE from 'three';
import BabelStandalone from '@babel/standalone';
import JSZip from 'jszip';
// import {EditorView, EditorState, basicSetup, javascript} from 'codemirror';
import {storageHost} from './constants.js';
// console.log('got jszip', BabelStandalone, JSZip);

// const {babelStandalone} = window.browser;
/* window.React = React;
window.ReactDOM = ReactDOM;
window.babelStandalone = babelStandalone;
window.reactThreeFiber = reactThreeFiber; */

const editorSize = 400;

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

console.log('got react three fiber', ReactThreeFiber);

const fetchAndCompile = async (scriptUrl) => {
  const res = await fetch(scriptUrl);
  let s = await res.text();
  
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
  const p = new URL(scriptUrl).pathname.replace(/^\//, '');
  urlCache[p] = s;
  
  const zip = new JSZip();
  for (const p in urlCache) {
    const d = urlCache[p];
    console.log('add file', p);
    zip.file(p, d);
  }
  const ab = await zip.generateAsync({
    type: 'arraybuffer',
  });
  return new Uint8Array(ab);
};

const s = `\
  import React, {Fragment, useState, useRef} from 'react';
  import ReactThreeFiber from 'react-three-fiber';
  const {Canvas, useFrame, useThree} = ReactThreeFiber;

  function Box(props) {
    // This reference will give us direct access to the THREE.Mesh object
    const mesh = useRef()
    // Set up state for the hovered and active state
    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(false)
    // Subscribe this component to the render-loop, rotate the mesh every frame
    useFrame((state, delta) => {
      mesh.current.rotation.x += 0.01;
    });
    // Return the view, these are regular Threejs elements expressed in JSX
    return (
      <mesh
        {...props}
        ref={mesh}
        scale={active ? 1.5 : 1}
        onClick={(event) => setActive(!active)}
        onPointerOver={(event) => setHover(true)}
        onPointerOut={(event) => setHover(false)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
      </mesh>
    )
  }
  function Camera(props) {
    const ref = useRef()
    const set = useThree(state => state.set)
    // Make the camera known to the system
    useEffect(() => void set({ camera: ref.current }), [])
    // Update it every frame
    useFrame(() => ref.current.updateMatrixWorld())
    return <perspectiveCamera ref={ref} {...props} />
  }
  const render = () => {
    // console.log('render', r, React, r === React);
    return (
      <Fragment>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Box position={[-1.2, 0, 0]} />
        <Box position={[1.2, 0, 0]} />
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
      _load();
    },
  },
});
editor.setOption('theme', 'material-ocean');
/* editor.on('keydown', e => {
  if (e.ctrlKey && e.which === 83) { // ctrl-s
    console.log('got save', e);
    e.preventDefault();
  }
}); */

(async () => {
  const url = new URL(`${window.location.protocol}//${window.location.host}/chest-rtfjs/index.js`);
  const zipData = await fetchAndCompile(url.href);
  
  const zip = await JSZip.loadAsync(zipData);
  // console.log('load file 4', zip.files);

  const fileNames = [];
  const localFileNames = {};
  const isDirectoryName = fileName => /\/$/.test(fileName);
  for (const fileName in zip.files) {
    // if (filePredicate(fileName)) {
      fileNames.push(fileName);

      let basename = fileName
        // .replace(/^[^\/]*\/(.*)$/, '$1')
        // .slice(tail.length);
      localFileNames[fileName] = basename;
    // }
  }
  let files = await Promise.all(fileNames.map(async fileName => {
    const file = zip.file(fileName);
    
    const b = file && await file.async('blob');
    return {
      name: fileName,
      data: b,
    };
  }));
  // files = files.filter(f => !!f);
  // console.log('load file 9');
  console.log('got files', files);
  
  const fd = new FormData();
  let hasRootDirectory = false;
  for (const file of files) {
    const {name} = file;
    const basename = localFileNames[name];
    console.log('append', basename, name);
    if (isDirectoryName(name)) {
      fd.append(
        name,
        new Blob([], {
          type: 'application/x-directory',
        }),
        basename
      );
      if (basename === '') {
        hasRootDirectory = true;
      }
    } else {
      fd.append(name, file.data, basename);
    }
  }

  {
    const uploadFilesRes = await fetch(storageHost, {
      method: 'POST',
      body: fd,
    });
    const hashes = await uploadFilesRes.json();
    // console.log('got hashes', hashes);
    const mainDirectory = hashes.find(h => h.name === 'chest-rtfjs');
    const mainFile = hashes.find(h => h.name === 'chest-rtfjs/index.js');
    const mainDirectoryHash = mainDirectory.hash;
    const mainFileName = mainFile.name.slice(mainDirectory.name.length + 1);
    
    // const indexJsFile = zip.files[url.pathname.slice(1)];
    // const data = await indexJsFile.async('uint8array');
    // const s = new TextDecoder().decode(data);
  
    const root = document.getElementById('root');
    const canvas = document.getElementById('canvas');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    renderer.setSize(window.innerWidth - editorSize, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();

    // console.log('got s', s);

    console.log('loading', `${storageHost}/ipfs/${mainDirectoryHash}/${mainFileName}`);
    const m = await import(`${storageHost}/ipfs/${mainDirectoryHash}/${mainFileName}`);
    const fn = m.default;
    console.log('got fn', fn);

    // const el = ReactDOM.render(fn(), root);
    const size = renderer.getSize(new THREE.Vector2());
    // window.THREE1 = THREE;
    // debugger;
    const el = ReactThreeFiber.render(fn(), canvas, {
      gl: renderer,
      size: {
        width: size.x,
        height: size.y,
      },
      events: createPointerEvents,
    });
    
    console.log('done render', el);
  }
})();

// import browser from './dist/browser2.js';
// window.browser = browser;
/* window.addEventListener('message', async e => {
  const zip = new JSZip();
  const spec = BabelStandalone.transform(e.data, {
    presets: ['react'],
  });
  console.log('got spec', spec);
  const {code} = spec;
  const zipBuffer = new TextEncoder().encode(code);
  const file = new Blob([
    zipBuffer,
  ], {
    type: 'application/zip',
  });
  window.parent.postMessage({
    file,
  }, '*', [file]);
});
window.parent.addEventListener('message', e => {
  console.log('got result', e.data);
});
window.postMessage(new MessageEvent('message', {
  data: `<mesh x={7}/>`,
}), '*'); */

};