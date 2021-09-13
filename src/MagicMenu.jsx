import React, {useState, useEffect, useRef} from 'react'
// import logo from './logo.svg'
import classes from './MagicMenu.module.css'
// import MagicMenu from './magic-menu.js';
// import App from '/app.js';
import ioManager from '../io-manager.js';
import metaversefile from 'metaversefile';

window.metaversefile = metaversefile; // XXX
const makeAi = prompt => {
  const es = new EventSource('/ai?p=' + encodeURIComponent(prompt));
  let fullS = '';
  es.addEventListener('message', e => {
    const s = e.data;
    if (s !== '[DONE]') {
      const j = JSON.parse(s);
      const {choices} = j;
      const {text} = choices[0];
      fullS += text;
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

  const _compile = () => {
    if (!compiling) {
      setCompiling(true);
      
      const oldAi = ai;
      if (oldAi) {
        oldAi.destroy();
        setAi(null);
      }

      const input = inputTextarea.current.value;
      const newAi = makeAi(input);
      setAi(newAi);
      setPage('output');
      setOutput('');
      setNeedsFocus(true);
      newAi.addEventListener('update', e => {
        const s = e.data;
        setOutput(s);
      });
      newAi.addEventListener('done', e => {
        setCompiling(false);
        setAi(null);
      });
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
      if (!open && e.which === 9) { // tab
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
        } else if (e.which === 13) { // enter
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
                  <textarea className={classes.output} value={output} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" onChange={e => { setOutput(e.target.value); }} placeholder="" value={output} ref={outputTextarea} />
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
