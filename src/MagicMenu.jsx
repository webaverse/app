import React, {useState, useEffect, useRef} from 'react'
// import logo from './logo.svg'
import classes from './MagicMenu.module.css'
// import MagicMenu from './magic-menu.js';
// import App from '/app.js';
import ioManager from '../io-manager.js';

function MagicMenu() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [compiling, setCompiling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pointerLockElement, setPointerLockElement] = useState(null);
  const [needsFocus, setNeedsFocus] = useState(false);
  const inputTextarea = useRef();
  const outputTextarea = useRef();

  const _compile = () => {
    if (!compiling) {
      setCompiling(true);
      setTimeout(() => {
        setPage('output');
        setOutput('<mesh></mesh>');
        setCompiling(false);
      }, 1000);
    }
  };
  const _load = () => {
    ioManager.click(new MouseEvent('click'));
  };

  useEffect(() => {
    const cleanups = [];
    const keydown = e => {
      if (window.document.activeElement !== inputTextarea.current && window.document.activeElement !== outputTextarea.current && e.which === 9) { // tab
        e.preventDefault();

        const newOpen = !open;
        if (newOpen) {
          setPage('input');
          setInput('');
          setNeedsFocus(true);
          setOpen(true);
        }
      } else if (window.document.activeElement === inputTextarea.current || window.document.activeElement === outputTextarea.current) {
        e.stopPropagation();

        if (e.which === 9) { // tab
          e.preventDefault();
          ioManager.click(new MouseEvent('click'));
        } else if (e.which === 13) { // enter
          e.preventDefault();
          
          if (page === 'input') {
            _compile();
          } else if (page === 'output') {
            _load();
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
  }, [open, page, inputTextarea.current, outputTextarea.current]);
  useEffect(() => {
    const types = ['keyup', 'click', 'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave'];
    const cleanups = types.map(type => {
      const fn = e => {
        if (window.document.activeElement === inputTextarea.current) {
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
          setNeedsFocus(false);
        } else if (page === 'output') {
          outputTextarea.current.focus();
          setNeedsFocus(false);
        }
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
        {(() => {
          switch (page) {
            case 'input': {
              return (
                <>
                  <textarea className={classes.textarea} value={input} onChange={e => { setInput(e.target.value); }} placeholder="Ask for it..." ref={inputTextarea} />
                  <div className={classes.buttons}>
                    <button className={classes.button + ' ' + (compiling ? classes.disabled : '')} onClick={_compile}>Generate</button>
                  </div>
                </>
              );
            }
            case 'output': {
              return (
                <>
                  <textarea className={classes.output} value={output} onChange={e => { setOutput(e.target.value); }} placeholder="" value={output} ref={outputTextarea} />
                  <div className={classes.buttons}>
                    <button className={classes.button} onClick={e => {
                      setOpen(false);
                    }}>Confirm</button>
                    <button className={classes.button} onClick={e => {
                      setPage('input');
                    }}>Back</button>
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
