(() => {

const width = 50;
/* const defaultServers = [
  {
    name: 'magic land',
  },
  {
    name: 'lollercopter landing pad',
  },
]; */

const getDocFromFile = async (blob, name) => {
  let doc;
  if (/\.(?:html|js|metaversefile|rtf.js|t.js|txt|jsx)$/.test(name)) {
    const text = await blob.text();
    doc = new CodeMirror.Doc(text, 'javascript');
  } else {
    doc = null;
  }
  return doc;
};
const FileInput = ({
  className,
  file,
  setFile,
  children,
}) => {
  return (
    <div className={'file-input ' + className}>
      {children}
      <input type="file" placeholder="File" onChange={e => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          setFile(files[0]);
        } else {
          setFile(null);
        }
      }} />
    </div>
  );
};
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
const Dropdown = ({
  options,
  selectedOption,
  setSelectedOption,
}) => {
  return (
    <select className="select" name="nfttype" id="nfttype" value={selectedOption} onChange={e => {
      // console.log('got change', e);
      setSelectedOption(e.target.value);
    }}>
      {options.map((o, i) => {
        return (
          <option
            value={o}
            key={i}
          >{o}</option>
        );
      })}
    </select> 
  );
};
const Editor = React.memo(({open, files, setFiles, selectedTab, selectedFileIndex, setSelectedFileIndex, templateOptions, selectedTemplateOption, setSelectedTemplateOption, setEditor, errors}) => {
  const [fileRenameIndex, setFileRenameIndex] = useState(-1);
  const [fileRenameName, setFileRenameName] = useState('');
  const [file, setFile] = useState(null);
  
  useEffect(async () => {
    if (file) {
      // console.log('got file', file);
      const {name} = file;
      const doc = await getDocFromFile(file, name);
      const files = getFiles();
      const newFiles = files.concat({
        name,
        doc,
      });
      setFiles(newFiles);
      setFile(null);
    }
  }, [file]);
  
  return (
    <Fragment>
      <div className={['editor', 'page', open ? 'open' : '', 'sections'].join(' ')}>
        <div className="left">
          <div className="top">
            <div className="header">
              <div className="super">Template</div>
              <Dropdown
                options={templateOptions}
                selectedOption={selectedTemplateOption}
                setSelectedOption={setSelectedTemplateOption}
              />
            </div>
          </div>
          <div className="bottom">
            <div className="label">Files</div>
            <div className="files">
              {files.map((file, i) => {
                return (fileRenameIndex === i ?
                  <input
                    type="text"
                    className="file-rename"
                    value={fileRenameName}
                    onChange={e => {
                      setFileRenameName(e.target.value);
                    }}
                    onKeyDown={e => {
                      console.log('got which', e.which);
                      if (e.which === 13) {
                        setFileRenameIndex(-1);
                      } else if (e.which === 27) {
                        setFileRenameIndex(-1);
                      }
                    }}
                    key={i}
                  />
                :
                  <div
                    className={['file', selectedFileIndex === i ? 'selected' : ''].join(' ')}
                    onClick={e => setSelectedFileIndex(i)}
                    tabIndex={-1}
                    onKeyDown={e => {
                      if (e.which === 46) {
                        let newFiles = getFiles();
                        newFiles = newFiles.slice();
                        newFiles.splice(i, 1);
                        setFiles(newFiles);
                      }
                    }}
                    key={i}
                  >
                    <div className="file-inner">
                      <span className="text">{file.name}</span>
                      <nav className="rename-icon" onClick={e => {
                        e.stopPropagation();
                        setFileRenameName(file.name);
                        setFileRenameIndex(i);
                      }}>
                        <img src="/assets/pencil.svg" className="img" />
                      </nav>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="header footer">
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
              <FileInput
                className="button"
                file={file}
                setFile={setFile}
              >
                <img src="/assets/upload.svg" className="icon" />
                <div className="label">Upload...</div>
              </FileInput>
            </div>
          </div>
        </div>
        <div className="right">
          <div className="top">
            <div className="header">
              <button className="button" onClick={() => run()}>
                <img src="/assets/comet-spark.svg" className="icon" />
                <div className="label">Run code</div>
              </button>
              <button className="button" onClick={() => mintNft()}>
                <img src="/assets/mint.svg" className="icon" />
                <div className="label">Mint NFT</div>
              </button>
              <button className="button" onClick={downloadZip}>
                <img src="/assets/download.svg" className="icon" />
                <div className="label">Download zip</div>
              </button>
            </div>
          </div>
          <div className="bottom">
            <Textarea
              setEditor={setEditor}
            />
          </div>
          <div className="errors">
            {errors.map((error, i) => {
              return (
                <div className="error" key={i}>
                  <nav className="x-icon" onClick={e => {
                    let errors = getErrors();
                    errors = errors.slice();
                    errors.splice(i, 1);
                    setErrors(errors);
                  }}>
                    <img src="/assets/x.svg" className="img" />
                  </nav>
                  <div className="text">{error.stack}</div>
                </div>
              );
            })}
          </div>
        </div>
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
const Scene = React.memo(({objects, setObjects, open, selectedObjectIndex, setSelectedObjectIndex, selectedObject}) => {
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
  const [objectRenameName, setObjectRenameName] = useState('');
  const [objectRenameIndex, setObjectRenameIndex] = useState(-1);
  
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
      selectedObject.updateMatrixWorld(true);
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
  const object = objects[selectedObjectIndex];
  
  return (
    <div className={['scene', 'page', open ? 'open' : '', 'sections'].join(' ')}>
      <div className="left">
        <div className="label">Objects</div>
        <div className="objects">
          {objects.map((object, i) => {
            return (objectRenameIndex === i ?
              <input
                type="text"
                className="object-rename"
                value={objectRenameName}
                onChange={e => {
                  setObjectRenameName(e.target.value);
                }}
                onKeyDown={e => {
                  if (e.which === 13) {
                    setObjectRenameIndex(-1);
                  } else if (e.which === 27) {
                    setObjectRenameIndex(-1);
                  }
                }}
                key={i}
              />
            :
              <div
                className={['object', selectedObjectIndex === i ? 'selected' : ''].join(' ')}
                onClick={e => {
                  const object = objects[i];
                  const physicsId = object.getPhysicsIds ? object.getPhysicsIds() : 0;
                  weaponsManager.setMouseSelectedObject(object, physicsId);
                }}
                key={i}
              >
                <div className="object-inner">
                  <span className="text">{object.name}</span>
                  <nav className="rename-icon" onClick={e => {
                    e.stopPropagation();
                    setObjectRenameName(object.name);
                    setObjectRenameIndex(i);
                  }}>
                    <img src="/assets/pencil.svg" className="img" />
                  </nav>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="right">
        <div className="details">
          {object ?
            <Fragment>              
              <div className="left">
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
              <div className="right" onClick={e => {
                // console.log('remove', object, selectedObjectIndex);
                if (object) {
                  world.removeObject(object.instanceId);
                }
              }}>
                <div className="label">Actions</div>
                <button className="button warning">Remove</button>
              </div>
            </Fragment>
          : null}
        </div>
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
const Multiplayer = React.memo(({open, servers, refreshServers, selectedServerIndex, setSelectedServerIndex, connectedServerName, setConnectedServerName, connectingServerName, setConnectingServerName}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [serverName, setServerName] = useState('');

  const _createServer = async () => {
    if (serverName) {
      const res = await fetch(`https://worlds.exokit.org/${serverName}`, {
        method: 'POST',
      });
      const j = await res.json();
      
      await refreshServers();
      
      setModalOpen(false);
    }
  };
  
  return (
    <div className={['multiplayer', 'page', open ? 'open' : '', 'sections'].join(' ')}>
      {modalOpen ?
        <div className="modal create-server-modal">
          <div className="label">Server name</div>
          <input type="text" value={serverName} onChange={e => setServerName(e.target.value)} placeholder="erithor" />
          <div className="row">
            <button
              className="button ok"
              onClick={_createServer}
            >
              <img src="/assets/check-mark.svg" className="icon" />
              <div className="label">Create server</div>
            </button>
            <button
              className="button cancel"
              onClick={e => setModalOpen(false)}
            >Cancel</button>
          </div>
        </div>
      :
        <Fragment>
          <div className="label">Servers</div>
          {servers.length > 0 ?
            <div className="servers">
              {servers.map((server, i) => {
                return (
                  <div
                    className={['server', selectedServerIndex === i ? 'selected' : ''].join(' ')}
                    onClick={e => setSelectedServerIndex(i)}
                    key={i}
                  >
                    <img src="/assets/circuitry.svg" className="icon" />
                    <div className="name">{server.name}</div>
                    {connectedServerName === server.name ? (
                      <button
                        className="button disconnect"
                        onClick={e => {
                          // console.log('disconnect 1');
                          world.disconnectRoom();
                          // console.log('disconnect 2');
                        }}
                      >Disconect</button>
                    ) : (connectingServerName === server.name ?
                        <button
                          className="button"
                          /* onClick={e => {
                            setConnectingServerName('');
                          }} */
                        >Connecting...</button>
                      :
                        <button
                          className="button connect"
                          onClick={async e => {
                            setConnectingServerName(server.name);
                            
                            const {publicIp, privateIp, port} = server;
                            // publicIp = `worlds.exokit.org`;
                            const endpoint = publicIp + ':' + port;
                            // console.log('connect to server', server, endpoint);
                            const channelConnection = await world.connectRoom('room', endpoint);
                            
                            channelConnection.addEventListener('close', () => {
                              setConnectedServerName('');
                            });
                            
                            setConnectedServerName(server.name);
                            setConnectingServerName('');
                          }}
                        >Connect</button>
                      )
                    }
                  </div>
                );
              })}
            </div>
          :
            <div className="servers-placeholder">No servers found o;_o</div>
          }
          <button
            className="button create-server-button"
            onClick={e => setModalOpen(true)}
          >
            <img src="/assets/noun_Plus_950.svg" className="icon" />
            <div className="label">Create server</div>
          </button>
        </Fragment>
      }
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
  const [selectedTab, setSelectedTab] = globalState.useState('selectedTab', 'editor');
  const [cards, setCards] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [objects, setObjects] = globalState.useState('objects', []);
  const [selectedFileIndex, setSelectedFileIndex] = globalState.useState('selectedFileIndex', 0);
  const [selectedObjectIndex, setSelectedObjectIndex] = globalState.useState('selectedObjectIndex', -1);
  const [q, setQ] = useState('');
  const [currentQ, setCurrentQ] = useState('');
  const [lastQ, setLastQ] = useState('');
  const [templateOptions, setTemplateOptions] = useState([]);
  const [selectedTemplateOption, setSelectedTemplateOption] = useState();
  const [files, setFiles] = globalState.useState('files', []);
  const [editor, setEditor] = globalState.useState('editor', null);
  const [errors, localSetErrors] = globalState.useState('errors', []);
  const [firstRun, setFirstRun] = useState(false);
  const [secondRun, setSecondRun] = useState(true);
  const [servers, setServers] = useState([]);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [connectedServerName, setConnectedServerName] = useState('');
  const [connectingServerName, setConnectingServerName] = useState('');
  const [microphoneMediaStream, setMicrophoneMediaStream] = useState(null);
  const [isXrSupported, setIsXrSuported] = useState(false);
  const [session, setSession] = useState(null);
  
  // getEditor = () => editor;
  // getFiles = () => files;
  // setSelectedTab = localSetSelectedTab;
  // getObjects = () => objects;
  // getSelectedFileIndex = () => selectedFileIndex;
  // setSelectedFileIndex = localSetSelectedFileIndex;
  // getSelectedObjectIndex = () => selectedObjectIndex;
  // setSelectedObjectIndex = localSetSelectedObjectIndex;
  // getErrors = () => errors;
  // setErrors = localSetErrors;
  
  // console.log('set objects', objects);
  
  useEffect(async () => {
    const res = await fetch('https://tokens.webaverse.com/1-100');
    const j = await res.json();
    setCards(j);
  }, []);
  
  const refreshServers = async () => {
    const res = await fetch('https://worlds.exokit.org');
    const j = await res.json();
    setServers(j);
  };
  useEffect(refreshServers, []);
  
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
    console.log('got templates', templates);
    setTemplateOptions(templates);
    setSelectedTemplateOption(templates[0]);
  }, []);
  
  useEffect(async () => {
    if (editor && selectedTemplateOption) {
      const filesSrc = await ghDownload('https://github.com/webaverse/templates/tree/main/' + selectedTemplateOption);
      
      const files = await Promise.all(filesSrc.map(async file => {
        const {path: name, blob} = file;
        const doc = await getDocFromFile(blob, name);
        return {
          name,
          blob,
          doc,
        };
      }));
      
      setFiles(files);
      setSelectedFileIndex(0);
      if (firstRun) {
        setSecondRun(false);
      }
    }
  }, [editor, selectedTemplateOption]);
  
  useEffect(async () => {
    if (editor) {
      const file = files[selectedFileIndex];
      if (file) {
        if (file.doc) {
          editor.swapDoc(file.doc);
          editor.display.wrapper.style.visibility = null;
        } else {
          editor.display.wrapper.style.visibility = 'hidden';
        }
      } else {
        editor.display.wrapper.style.visibility = 'hidden';
      }
    }
  }, [editor, files, selectedFileIndex]);
  
  useEffect(() => {
    if (!firstRun && editor && files.length > 0) {
      // console.log('run files 1', files.slice());
      setFirstRun(true);
      run();
    }
  }, [firstRun, editor, files]);
  useEffect(() => {
    console.log('run files', secondRun, files.slice());
    if (!secondRun && editor && files.length > 0) {
      setSecondRun(true);
      run();
    }
  }, [secondRun, editor, files]);
  
  /* useEffect(() => {
    const object = objects[selectedObjectIndex] || null;
    transformControls.bind(object);
    if (object && transformControls.getTransformMode() === 'disabled') {
      transformControls.setTransformMode('translate');
    }
  }, [objects, objects.length, selectedObjectIndex]); */
  
  useEffect(async () => {
    const ok = await app.isXrSupported();
    setIsXrSuported(ok);
  }, []);
  
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
          {/* <div className="control" onClick={() => setCameraMode('firstperson')}>
            <video
              src="https://preview.exokit.org/[https://webaverse.github.io/assets/sacks3.vrm]/preview.webm"
              className="video"
              autoPlay
              muted
              loop
            />
            <img src="/assets/video-camera.svg" className="icon" />
            <div className="label">Camera</div>
          </div>
          <div className="control" onClick={() => setCameraMode('avatar')}>
            <img src="/assets/teleport.svg" className="icon" />
            <div className="label">Avatar</div>
          </div> */}
          <div className={['control', 'mic-button', microphoneMediaStream ? 'enabled' : ''].join(' ')} disabled={!isXrSupported} onClick={async () => {
            const microphoneMediaStream = await app.toggleMic();
            setMicrophoneMediaStream(microphoneMediaStream);
          }}>
            <img src="/assets/microphone.svg" className="icon" />
            <div className="label">Mic {microphoneMediaStream ? 'on' : 'off'}</div>
          </div>
          <div className={['control', 'enter-xr-button', session ? 'enabled' : ''].join(' ')} disabled={!isXrSupported} onClick={async () => {
            const promises = [];
            if (!microphoneMediaStream) {
              const p = app.toggleMic()
                .then(microphoneMediaStream => {
                  setMicrophoneMediaStream(microphoneMediaStream);
                });
              promises.push(p);
            }
            {
              const p = app.enterXr()
                .then(() => {
                  const renderer = getRenderer();
                  const session = renderer.xr.getSession();
                  console.log('got session', session);
                  setSession(session);
                  
                  function onSessionEnded(e) {
                    session.removeEventListener('end', onSessionEnded);
                    setSession(null);
                  }
                  session.addEventListener('end', onSessionEnded);
                });
              promises.push(p);
            }
            await Promise.all(promises);
          }}>
            <img src="/assets/protection-glasses.svg" className="icon" />
            <div className="label">VR</div>
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
          <nav className={['tab', selectedTab === 'multiplayer' ? 'selected' : ''].join(' ')} onClick={e => setSelectedTab('multiplayer')}>
            <div className="label">Multiplayer</div>
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
          templateOptions={templateOptions}
          selectedTemplateOption={selectedTemplateOption}
          setSelectedTemplateOption={setSelectedTemplateOption}
          setEditor={setEditor}
          errors={errors}
        />
        <Scene
          open={selectedTab === 'scene'}
          objects={objects}
          setObjects={setObjects}
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
        <Multiplayer
          servers={servers}
          refreshServers={refreshServers}
          open={selectedTab === 'multiplayer'}
          selectedServerIndex={selectedServerIndex}
          setSelectedServerIndex={setSelectedServerIndex}
          connectedServerName={connectedServerName}
          setConnectedServerName={setConnectedServerName}
          connectingServerName={connectingServerName}
          setConnectingServerName={setConnectingServerName}
        />
        <Settings
          open={selectedTab === 'settings'}
        />
      </div>
    </div>
  </div>
};

})();