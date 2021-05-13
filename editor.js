import * as THREE from 'three';
import React from 'react';
const {Fragment, useState, useEffect, useRef} = React;
import ReactDOM from 'react-dom';
import ReactThreeFiber from '@react-three/fiber';
import Babel from '@babel/standalone';
import JSZip from 'jszip';
// import {jsx} from 'jsx-tmpl';
import {world} from './world.js';
import physicsManager from './physics-manager.js';
import {storageHost} from './constants.js';

import App from '/app.js';

import BrowserFS from '/browserfs.js';
BrowserFS.configure({
    fs: "IndexedDB",
    options: {
       storeName : "webaverse-editor",
    }
  }, function(e) {
    if (e) {
      // An error happened!
      throw e;
    }
    // Otherwise, BrowserFS is ready-to-use!
  });
const fs = (() => {
  const exports = {};
  BrowserFS.install(exports);
  const {require} = exports;
  const fs = require('fs');
  return fs;
})();

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();

let getEditor = () => null;
let getFiles = () => null;
let getSelectedFileIndex = () => null;
// let isChanging = false;

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

window.onload = async () => {

const bindTextarea = codeEl => {
  const editor = CodeMirror.fromTextArea(codeEl, {
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
  {
    const stopPropagation = e => {
      e.stopPropagation();
    };
    [
      'wheel',
      'keydown',
      'keypress',
      'keyup',
      'paste',
    ].forEach(n => {
      editor.display.wrapper.addEventListener(n, stopPropagation);
    });
  }
  // console.log('got editor', editor);
  editor.setOption('theme', 'material');
  // editor.setOption('theme', 'material-ocean');
  // editor.setOption('theme', 'icecoder');
  /* editor.on('keydown', e => {
    if (e.ctrlKey && e.which === 83) { // ctrl-s
      console.log('got save', e);
      e.preventDefault();
    }
  }); */
  return editor;
};
{
  const _ = React.createElement;
  const container = document.getElementById('container');
  
  const defaultFiles = [
    {
      name: 'index.rtfjs',
      value: '// default content',
    },
    {
      name: '.metaversefile',
      value: '{}',
    },
  ];
  const jsx = `
    (() => {
      const width = 50;
      
      const Search = React.memo(({
        q,
        setQ,
        onEnter,
      }) => {
        return (
          <label className="search">
            <img className="search-image" src="/assets/search.svg" />
            <input
              type="text"
              value={q}
              onChange={e => {
                setQ(e.target.value);
              }}
              onKeyDown={e => {
                if (e.which === 13) {
                  onEnter && onEnter(e, {q});
                }
              }}
            />
          </label>
        );
      });
      const User = () => {
        return (
          <div className="user">
            <img src="https://preview.exokit.org/[https://webaverse.github.io/assets/sacks3.vrm]/preview.png" className="img" />
            <div className="name">avaer</div>
          </div>
        );
      };
      const Textarea = React.memo(props => {
        const {setEditor} = props;
        
        const el = useRef();
        useEffect(() => {
          // el.current.innerHTML = s;
          const editor = bindTextarea(el.current);
          setEditor(editor);
        }, []);
        
        return (
          <textarea className="section code" ref={el} id="code"></textarea>
        );
      });
      const Editor = React.memo(({open, files, setFiles, selectedTab, selectedFileIndex, setSelectedFileIndex, templateOptions, selectedTemplateOption, setSelectedTemplateOption, setEditor}) => {
        return (
          <Fragment>
            {open ?
              <div className="header">
                {/* !open ?
                  <div className="icon-button" onClick={() => setOpen(true)}>
                    <img src="/assets/chevron-left.svg" className="icon" />
                  </div>
                : null */}
                <button className="button" onClick={() => run()}>
                  <img src="/assets/comet-spark.svg" className="icon" />
                  <div className="label">Run code</div>
                </button>
                <button className="button" onClick={() => mintNft()}>
                  <img src="/assets/mint.svg" className="icon" />
                  <div className="label">Mint NFT</div>
                </button>
                <button className="button" onClick={e => {
                  const newFiles = files.concat({
                    name: 'untitled',
                    doc: new CodeMirror.Doc('', 'javascript'),
                  });
                  setFiles(newFiles);
                }}>
                  <img src="/assets/noun_Plus_950.svg" className="icon" />
                  <div className="label">New file</div>
                </button>
                <button className="button">
                  <img src="/assets/family-tree.svg" className="icon" />
                  <div className="label">Import URL...</div>
                </button>
                <select name="nfttype" id="nfttype" value={selectedTemplateOption} onChange={e => {
                  // console.log('got change', e);
                  setSelectedTemplateOption(e.target.value);
                }}>
                  {templateOptions.map((o, i) => {
                    return (
                      <option
                        value={o}
                        key={i}
                      >{o}</option>
                    );
                  })}
                </select>
              </div>
            : null}
            <div className={['editor', 'page', open ? 'open' : '', 'sections'].join(' ')}>
              <div className="section files">
              {files.map((file, i) => {
                return (
                  <div
                    className={['file', selectedFileIndex === i ? 'selected' : ''].join(' ')}
                    onClick={e => setSelectedFileIndex(i)}
                    key={i}
                  >
                    <div className="file-inner">{file.name}</div>
                  </div>
                );
              })}
              </div>
              <Textarea
                setEditor={setEditor}
              />
            </div>
          </Fragment>
        );
      });
      const MiniCard = React.memo(({
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
      });
      const Scene = React.memo(({objects, open, selectedObjectIndex, setSelectedObjectIndex, selectedObject}) => {
        const [px, setPX] = useState(0);
        const [py, setPY] = useState(0);
        const [pz, setPZ] = useState(0);
        const [rx, setRX] = useState(0);
        const [ry, setRY] = useState(0);
        const [rz, setRZ] = useState(0);
        const [rw, setRW] = useState(0);
        const [sx, setSX] = useState(1);
        const [sy, setSY] = useState(1);
        const [sz, setSZ] = useState(1);
        
        useEffect(() => {
          if (selectedObject) {
            setPX(selectedObject.position.x);
            setPY(selectedObject.position.y);
            setPZ(selectedObject.position.z);
            
            setRX(selectedObject.quaternion.x);
            setRY(selectedObject.quaternion.y);
            setRZ(selectedObject.quaternion.z);
            setRW(selectedObject.quaternion.w);
            
            setSX(selectedObject.scale.x);
            setSY(selectedObject.scale.y);
            setSZ(selectedObject.scale.z);
          }
        }, [selectedObject]);
        
        useEffect(() => {
          // console.log('update selected object', selectedObject);
          
          if (selectedObject) {
            const oldMatrix = localMatrix.copy(selectedObject.matrixWorld);
            
            selectedObject.position.set(px, py, pz);
            selectedObject.quaternion.set(rx, ry, rz, rw);
            selectedObject.scale.set(sx, sy, sz);
            selectedObject.updateMatrixWorld();
            const newMatrix = localMatrix2.copy(selectedObject.matrixWorld);

            if (selectedObject.getPhysicsIds) {
              const physicsIds = selectedObject.getPhysicsIds();
              for (const physicsId of physicsIds) {
                const physicsTransform = physicsManager.getPhysicsTransform(physicsId);

                const oldTransformMatrix = localMatrix3.compose(physicsTransform.position, physicsTransform.quaternion, physicsTransform.scale);
                oldTransformMatrix.clone()
                  .premultiply(oldMatrix.invert())
                  .premultiply(newMatrix)
                  .decompose(localVector, localQuaternion, localVector2);
                physicsManager.setPhysicsTransform(physicsId, localVector, localQuaternion, localVector2);
              }
            }

            selectedObject.setPose(
              localVector.copy(selectedObject.position),
              localQuaternion.copy(selectedObject.quaternion),
              localVector2.copy(selectedObject.scale)
            );
          }
        }, [
          px, py, pz,
          rx, ry, rz, rw,
          sx, sy, sz,
        ]);
        
        return (
          <div className={['scene', 'page', open ? 'open' : '', 'sections'].join(' ')}>
            <div className="section objects">
              {objects.map((object, i) => {
                return (
                  <div
                    className={['object', selectedObjectIndex === i ? 'selected' : ''].join(' ')}
                    onClick={e => setSelectedObjectIndex(i)}
                    key={i}
                  >
                    <div className="object-inner">{object.contentId.match(/([^\/]*)$/)[1]}</div>
                  </div>
                );
              })}
            </div>
            <div className="section details">
              {/* <img src="/assets/cards-placeholder.png" className="section-icon" /> */}
              
              <div className="label">Position</div>
              <label className="row">
                <span className="sublabel">X</span>
                <input type="number" className="value" value={px} onChange={e => {
                  setPX(e.target.value);
                  // updateObject();
                }} />
              </label>
              <label className="row">
                <span className="sublabel">Y</span>
                <input type="number" className="value" value={py} onChange={e => {
                  setPY(e.target.value);
                  // updateObject();
                }} />
              </label>
              <label className="row">
                <span className="sublabel">Z</span>
                <input type="number" className="value" value={pz} onChange={e => {
                  setPZ(e.target.value);
                  // updateObject();
                }} />
              </label>
              
              <div className="label">Rotation</div>
              <label className="row">
                <span className="sublabel">X</span>
                <input type="number" className="value" value={rx} onChange={e => {
                  setRX(e.target.value);
                  // updateObject();
                }} />
              </label>
              <label className="row">
                <span className="sublabel">Y</span>
                <input type="number" className="value" value={ry} onChange={e => {
                  setRY(e.target.value);
                  // updateObject();
                }} />
              </label>
              <label className="row">
                <span className="sublabel">Z</span>
                <input type="number" className="value" value={rz} onChange={e => {
                  setRZ(e.target.value);
                  // updateObject();
                }} />
              </label>
              <label className="row">
                <span className="sublabel">W</span>
                <input type="number" className="value" value={rw} onChange={e => {
                  setRW(e.target.value);
                  // updateObject();
               }} />
              </label>
              
              <div className="label">Scale</div>
              <label className="row">
                <span className="sublabel">X</span>
                <input type="number" className="value" value={sx} onChange={e => {
                  setSX(e.target.value);
                  // updateObject();
                }} />
              </label>
              <label className="row">
                <span className="sublabel">Y</span>
                <input type="number" className="value" value={sy} onChange={e => {
                  setSY(e.target.value);
                  // updateObject();
                }} />
              </label>
              <label className="row">
                <span className="sublabel">Z</span>
                <input type="number" className="value" value={sz} onChange={e => {
                  setSZ(e.target.value);
                  // updateObject();
                }} />
              </label>
            </div>
          </div>
        );
      });
      const Library = React.memo(({cards, open, q, setQ, setCurrentQ, searchResults, setSearchResults}) => {
        return (
          <div className={['library', 'page', open ? 'open' : '', 'sections'].join(' ')}>
            <Search
              q={q}
              setQ={setQ}
              onEnter={(e, {q}) => {
                setCurrentQ(q);
                // console.log('get search', {q});
              }}
            />
            <div className="cards">
              {(searchResults || cards).map((card, i) => {
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
      });
      const Settings = React.memo(({open}) => {
        return (
          <div className={['settings', 'page', open ? 'open' : '', 'sections'].join(' ')}>
            <label>
              <input type="checkbox" />
              <span className="label">Green screen</span>
            </label>
          </div>
        );
      });
      
      return () => {
        const [open, setOpen] = useState(true);
        const [selectedTab, setSelectedTab] = useState('editor');
        const [cards, setCards] = useState([]);
        const [searchResults, setSearchResults] = useState(null);
        const [objects, setObjects] = useState([]);
        const [selectedFileIndex, setSelectedFileIndex] = useState(-1);
        const [lastSelectedFileIndex, setLastSelectedFileIndex] = useState(0);
        const [selectedObjectIndex, setSelectedObjectIndex] = useState(0);
        const [q, setQ] = useState('');
        const [currentQ, setCurrentQ] = useState('');
        const [lastQ, setLastQ] = useState('');
        const [templateOptions, setTemplateOptions] = useState([]);
        const [selectedTemplateOption, setSelectedTemplateOption] = useState();
        const [files, setFiles] = useState(defaultFiles);
        const [editor, setEditor] = useState(null);
        
        getEditor = () => editor;
        getFiles = () => files;
        getSelectedFileIndex = () => selectedFileIndex;
        
        // console.log('set objects', objects);
        
        useEffect(async () => {
          const res = await fetch('https://tokens.webaverse.com/1-100');
          const j = await res.json();
          setCards(j);
        }, []);
        
        useEffect(async () => {
          const objects = world.getObjects();
          setObjects(objects);
          
          const _objectsupdate = e => {
            const objects = world.getObjects();
            setObjects(objects);
          };
          world.addEventListener('objectsadd', _objectsupdate);
          world.addEventListener('objectsremove', _objectsupdate);
          return () => {
            world.removeEventListener('objectsadd', _objectsupdate);
            world.removeEventListener('objectsremove', _objectsupdate);
          };
        }, []);

        useEffect(() => {
          if (currentQ !== lastQ) {
            setLastQ(currentQ);

            if (currentQ) {
              setQ(currentQ);
              (async () => {      
                const res = await fetch('https://tokens.webaverse.com/search?q=' + currentQ);
                const tokens = await res.json();
                setSearchResults(tokens);
              })().catch(err => {
                console.warn(err);
              });
            } else {
              setQ('');
              setSearchResults(null);
            }
          }
        }, [currentQ, lastQ]);
        
        useEffect(async () => {
          const res = await fetch('https://templates.webaverse.com/index.json');
          const j = await res.json();
          const {templates} = j;
          setTemplateOptions(templates);
          setSelectedTemplateOption(templates[0]);
        }, []);
        
        useEffect(async () => {
          if (editor && selectedTemplateOption) {
            const u = 'https://templates.webaverse.com/' + selectedTemplateOption;
            const res = await fetch(u);
            const text = await res.text();
            const files = [
              {
                name: selectedTemplateOption,
                doc: new CodeMirror.Doc(text, 'javascript'),
              },
            ];
            setFiles(files);
            setSelectedFileIndex(0);
          }
        }, [editor, selectedTemplateOption]);
        
        useEffect(async () => {
          if (editor && selectedFileIndex !== lastSelectedFileIndex) {
            const file = files[selectedFileIndex];
            console.log('load file', file);
            if (file) {
              editor.swapDoc(file.doc);
            } /* else {
              editor.setValue('');
            } */
            setLastSelectedFileIndex(selectedFileIndex);
          }
        }, [editor, files, selectedFileIndex, lastSelectedFileIndex]);
        
        return <div className="root">
          <div className="left">
            <div className="top">
              <div className="canvas-placeholder">
                <canvas id="canvas" className="canvas" />
              </div>
            </div>
            <div className="bottom"></div>
          </div>
          <div className="right">
            <div className="controls">
              <div className="top">
                {/* <div className="control">
                  <User />
                </div> */}
              </div>
              <div className="bottom">
                {/* <div className="control" onClick={() => reset()}>
                  <img src="/assets/new-shoot.svg" className="icon" />
                  <div className="label">Reset</div>
                </div> */}
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
                  <div className="label">Editor</div>
                </nav>
                <nav className={['tab', selectedTab === 'scene' ? 'selected' : ''].join(' ')} onClick={e => setSelectedTab('scene')}>
                  <div className="label">Scene</div>
                </nav>
                <nav className={['tab', selectedTab === 'library' ? 'selected' : ''].join(' ')} onClick={e => setSelectedTab('library')}>
                  <div className="label">Library</div>
                </nav>
                <nav className={['tab', selectedTab === 'settings' ? 'selected' : ''].join(' ')} onClick={e => setSelectedTab('settings')}>
                  <div className="label">Settings</div>
                </nav>
                <User />
              </div>
              <Editor
                open={selectedTab === 'editor'}
                files={files}
                setFiles={setFiles}
                selectedTab={selectedTab}
                selectedFileIndex={selectedFileIndex}
                setSelectedFileIndex={setSelectedFileIndex}
                // lastSelectedFileIndex={lastSelectedFileIndex}
                // setLastSelectedFileIndex={setLastSelectedFileIndex}
                templateOptions={templateOptions}
                selectedTemplateOption={selectedTemplateOption}
                setSelectedTemplateOption={setSelectedTemplateOption}
                setEditor={setEditor}
              />
              <Scene
                open={selectedTab === 'scene'}
                objects={objects}
                selectedObjectIndex={selectedObjectIndex}
                setSelectedObjectIndex={setSelectedObjectIndex}
                selectedObject={objects[selectedObjectIndex]}
              />
              <Library
                cards={cards}
                open={selectedTab === 'library'}
                objects={objects}
                q={q}
                setQ={setQ}
                setCurrentQ={setCurrentQ}
                searchResults={searchResults}
                setSearchResults={setSearchResults}
              />
              <Settings
                open={selectedTab === 'settings'}
              />
            </div>
          </div>
        </div>
      };
    })()
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
  // console.log('got code', code);
  const fn = eval(code);
  // console.log('got fn', fn);
  
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
      // console.log('append file', name);
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
  const editor = getEditor();
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
  const url = new URL(`https://avaer.github.io/chest-rtfjs/index.rtfjs`);
  // const url = new URL(`chest-rtfjs/index.rtfjs`, window.location.href);
  const res = await fetch(url);
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