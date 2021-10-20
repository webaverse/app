import React, {useState, useEffect, useRef} from 'react'
// import logo from './logo.svg'
import classes from './MagicMenu.module.css'
// import MagicMenu from './magic-menu.js';
// import App from '/app.js';
import ioManager from '../io-manager.js';
import {aiHost} from '../constants.js';
import metaversefile from 'metaversefile';

function parseQueryString(queryString) {
  const query = {};
  const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}
const openAiKey = (() => {
  const q = parseQueryString(window.location.search);
  if (q.openAiKey) {
    localStorage.setItem('openAiKey', q.openAiKey);
    window.location.search = '';
  }
  return localStorage.getItem('openAiKey') || null;
})();

window.metaversefile = metaversefile; // XXX
const makeAi = prompt => {
  if (openAiKey) {
    const es = new EventSource(`${aiHost}/code?p=${encodeURIComponent(prompt)}&a=${encodeURIComponent(openAiKey)}`);
    let fullS = '';
    es.addEventListener('message', e => {
      const s = e.data;
      if (s !== '[DONE]') {
        const j = JSON.parse(s);
        const {choices} = j;
        const {text} = choices[0];
        fullS += text;
        if (!fullS) {
          fullS = '// nope';
        }
        result.dispatchEvent(new MessageEvent('update', {
          data: fullS,
        }));
      } else {
        es.close();
        result.dispatchEvent(new MessageEvent('done'));
      }
    });
    const result = new EventTarget();
    result.destroy = () => {
      es.close();
    };
    return result;
  } else {
    throw new Error('no beta password found in query string');
  }
};

function MagicMenu() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [compiling, setCompiling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pointerLockElement, setPointerLockElement] = useState(null);
  const [needsFocus, setNeedsFocus] = useState(false);
  const [ai, setAi] = useState(null);
  const inputTextarea = useRef();
  const outputTextarea = useRef();

  const _compile = async () => {
    if (!compiling) {
      setCompiling(true);
      
      const oldAi = ai;
      if (oldAi) {
        oldAi.destroy();
        setAi(null);
      }

      let newAi = null;
      try {
        const input = inputTextarea.current.value;
        newAi = makeAi(input);
        setAi(newAi);
        setPage('output');
        setOutput('');
        setNeedsFocus(true);
        newAi.addEventListener('update', e => {
          const s = e.data;
          console.log('got data', {s});
          setOutput(s);
        });
        await new Promise((accept, reject) => {
          newAi.addEventListener('done', e => {
            console.log('ai done');
            accept();
          });
        });
      } catch(err) {
        console.warn('ai error', err);
        
        setPage('input');
      } finally {
        console.log('ai finally', newAi);
        setCompiling(false);
        
        if (newAi) {
          newAi.destroy();
          setAi(null);
        }
      }
    }
  };  
  const _run = () => {
    ioManager.click(new MouseEvent('click'));
    
    const output = outputTextarea.current.value;
    const dataUri = metaversefile.createModule(output);
    (async () => {
      await metaversefile.load(dataUri);
    })();
  };

  useEffect(() => {
    const keydown = e => {
      if (!open && e.which === 191 && !ioManager.inputFocused()) { // /
        e.preventDefault();

        const newOpen = !open;
        if (newOpen) {
          setPage('input');
          setInput('');
          setNeedsFocus(true);
          setOpen(true);
        }
      } else if (open) {
        e.stopPropagation();

        if (e.which === 9) { // tab
          e.preventDefault();
          ioManager.click(new MouseEvent('click'));
        } else if (e.which === 13 && window.document.activeElement !== outputTextarea.current) { // enter
          e.preventDefault();
          
          if (page === 'input') {
            _compile();
          } else if (page === 'output') {
            _run();
          }
        }
      } else {
        // e.stopPropagation();
        ioManager.keydown(e);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('keydown', keydown);
    };
  }, [open, page]);
  useEffect(() => {
    const types = ['keyup', 'click', 'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave', 'paste'];
    const cleanups = types.map(type => {
      const fn = e => {
        if (window.document.activeElement === inputTextarea.current || e.target === inputTextarea.current) {
          // nothing
        } else {
          ioManager[type](e);
        }
      };
      window.addEventListener(type, fn);
      return () => {
        window.removeEventListener(type, fn);
      };
    });
    return () => {
      for (const fn of cleanups) {
        fn();
      }
    };
  }, []);
  useEffect(() => {
    if (open) {
      if (needsFocus && pointerLockElement) {
        document.exitPointerLock();
      } else if (needsFocus) {
        if (page === 'input') {
          inputTextarea.current.focus();
        } else if (page === 'output') {
          if (document.activeElement) {
            document.activeElement.blur();
          }
        }
        setNeedsFocus(false);
      } else if (!needsFocus && pointerLockElement) {
        setOpen(false);
      }
    }
  }, [open, inputTextarea.current, needsFocus, pointerLockElement]);
  useEffect(() => {
    const pointerlockchange = e => {
      setPointerLockElement(window.document.pointerLockElement);
    };
    window.document.addEventListener('pointerlockchange', pointerlockchange);
    return () => {
      window.removeEventListener('pointerlockchange', pointerlockchange);
    };
  }, [pointerLockElement]);
  
  return (
    <div className={classes.MagicMenu + ' ' + (open ? classes.open : '')}>
      <div className={classes.container} onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}>
        <textarea className={classes.textarea} value={input} rows={1} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" onFocus={e => {
          if (page !== 'input') {
            setPage('input');
            const oldAi = ai;
            if (oldAi) {
              oldAi.destroy();
              setAi(null);
            }
            setCompiling(false);
          }
        }} onChange={e => { setInput(e.target.value); }} placeholder="Ask for it..." ref={inputTextarea} />
        {(() => {
          switch (page) {
            case 'input': {
              return (
                <>
                  <div className={classes.buttons}>
                    <button className={classes.button + ' ' + (compiling ? classes.disabled : '')} onClick={_compile}>Generate</button>
                  </div>
                </>
              );
            }
            case 'output': {
              return (
                <>
                  <textarea className={classes.output} value={output} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" onChange={e => { setOutput(e.target.value); }} placeholder="" ref={outputTextarea} />
                  <div className={classes.buttons}>
                    <button className={classes.button} onClick={_run}>Run</button>
                  </div>
                </>
              );
            }
          }
        })()}
      </div>
    </div>
  );
}
export default MagicMenu;
