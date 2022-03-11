import React, {useState, useEffect, useRef} from 'react'
// import classes from './MagicMenu.module.css'
import ioManager from '../io-manager.js';
// import * as codeAi from '../ai/code/code-ai.js';
// import metaversefile from 'metaversefile';

const types = ['keyup', 'click', 'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave', 'paste'];
const ioEventHandlers = {};
for (const type of types.concat([''])) {
  ioEventHandlers[type] = [];
}
function registerIoEventHandler(type, fn) {
  ioEventHandlers[type].push(fn);
}
function unregisterIoEventHandler(type, fn) {
  const hs = ioEventHandlers[type];
  const index = hs.indexOf(fn);
  if (index !== -1) {
    hs.splice(index, 1);
  }
}

function IoHandler() {
  useEffect(() => {
    const cleanups = types.map(type => {
      const fn = e => {
        // console.log('got event', type, e);

        let broke = false;
        
        // type
        for (let i = 0; i < ioEventHandlers[type].length; i++) {
          const result = ioEventHandlers[type][i](e);
          if (result === false) {
            // console.log('handled 1', type);
            broke = true;
            break;
          }
        }

        // all
        if (!broke) {
          const type = '';
          for (let i = 0; i < ioEventHandlers[type].length; i++) {
            const result = ioEventHandlers[type][i](e);
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
  IoHandler,
  registerIoEventHandler,
  unregisterIoEventHandler,
};