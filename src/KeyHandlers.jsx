import React, {useState, useEffect, useRef} from 'react'
// import classes from './MagicMenu.module.css'
import ioManager from '../io-manager.js';
// import * as codeAi from '../ai/code/code-ai.js';
// import metaversefile from 'metaversefile';

const types = ['keyup', 'click', 'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave', 'paste'];
const keyHandlers = {};
for (const type of types.concat([''])) {
  keyHandlers[type] = [];
}
function registerKeyHandler(type, fn) {
  keyHandlers[type].push(fn);
}
function unregisterKeyHandler(type, fn) {
  const khs = keyHandlers[type];
  const index = khs.indexOf(fn);
  if (index !== -1) {
    khs.splice(index, 1);
  }
}

function KeyHandlers() {
  useEffect(() => {
    const cleanups = types.map(type => {
      const fn = e => {
        // console.log('got event', type, e);

        let broke = false;
        
        // type
        for (let i = 0; i < keyHandlers[type].length; i++) {
          const result = keyHandlers[type][i](e);
          if (result === false) {
            // console.log('handled 1', type);
            broke = true;
            break;
          }
        }

        // all
        if (!broke) {
          const type = '';
          for (let i = 0; i < keyHandlers[type].length; i++) {
            const result = keyHandlers[type][i](e);
            if (result === false) {
              // console.log('handled 2', type);
              broke = true;
              break;
            }
          }
        }
        
        // default
        if (!broke) {
          // console.log('default handle e', type);
          ioManager[type](e);
        }
      };
      window.addEventListener(type, fn);
      return () => {
        // console.log('clear event');
        window.removeEventListener(type, fn);
      };
    });
    return () => {
      for (const fn of cleanups) {
        fn();
      }
    };
  }, []);
  
  return (
    <></>
  );
}
export {
  KeyHandlers,
  registerKeyHandler,
  unregisterKeyHandler,
};