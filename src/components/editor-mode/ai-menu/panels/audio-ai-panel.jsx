import React, { useState, useEffect, useRef, useContext } from 'react';
// import { AppContext } from '../../../app';

import styles from './audio-ai-panel.module.css';

export function AudioAiPanel() {
  /* const { state, setState } = useContext( AppContext );
  const [page, setPage] = useState('input');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [compiling, setCompiling] = useState(false);
  const [ai, setAi] = useState(null);
  const inputTextarea = useRef();
  const outputTextarea = useRef(); */
  const audioRef = useRef();

  //

  const _generate = () => {
    // XXX
  };

  //
  
  return (
        <div className={styles.panel}>
            <textarea className={styles.textarea} placeholder="insects chirp in a windy field"></textarea>
            <audio className={styles.audio} ref={audioRef} />
            <div className={styles.buttons}>
                <button className={styles.button} onClick={_generate}>Generate sound</button>
            </div>
        </div>
    );
}