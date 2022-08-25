import React, { useState, useEffect, useRef, useContext } from 'react';
import classnames from 'classnames';
// import { AppContext } from '../../../app';

import styles from './lore-ai-panel.module.css';

export function LoreAiPanel() {
  /* const { state, setState } = useContext( AppContext );
  const [page, setPage] = useState('input');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [compiling, setCompiling] = useState(false);
  const [ai, setAi] = useState(null);
  const inputTextarea = useRef();
  const outputTextarea = useRef(); */

  //

  const _generate = () => {
    // XXX
  };

  //
  
  return (
        <div className={classnames(styles.panel, styles.lorePanel)}>
            {/* <textarea className={styles.textarea} placeholder="insects chirp in a windy field"></textarea> */}
            <div className={styles.buttons}>
                <button className={styles.button} onClick={_generate}>Generate lore</button>
            </div>
        </div>
    );
}