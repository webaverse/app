import React, { useState, useEffect, useRef, useContext } from 'react';
import classnames from 'classnames';
import { AppContext } from '../../../app';

import { registerIoEventHandler, unregisterIoEventHandler } from '../../../general/io-handler';

import styles from './code-ai-panel.module.css';

// import game from '../../../../../game';

export function CodeAiPanel() {
    const { state, setState } = useContext( AppContext );
    const [page, setPage] = useState('input');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [compiling, setCompiling] = useState(false);
    const [ai, setAi] = useState(null);
    const inputTextarea = useRef();
    const outputTextarea = useRef();

    //

    const _compile = async () => {

        if ( ! compiling ) {

            setCompiling( true );

            const oldAi = ai;

            if ( oldAi ) {

                oldAi.destroy();
                setAi(null);

            }

            let newAi = null;

            try {

                const input = inputTextarea.current.value;
                newAi = codeAi.generateStream(input);
                setAi(newAi);
                setPage('output');
                setOutput('');
                // setNeedsFocus(true);

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

        const output = outputTextarea.current.value;
        const dataUri = metaversefile.createModule(output);

        (async () => {

            // XXX unlock this
            // await metaversefile.load(dataUri);

        })();

        setState({ openedPanel: null });

    };

    //

    useEffect(() => {
        const handleKeyUp = ( event ) => {
            if (
                event.which === 13 && // enter
                window.document.activeElement !== outputTextarea.current &&
                state.openedPanel === 'AiPanel'
            ) {
                if (panel === 'input') {
                    _compile();
                } else if (panel === 'output') {
                    _run();
                }
                return false;
            }

            /* if (event.which === 191) { // /
                if (game.inputFocused()) {
                    return true;
                } else {
                    setState({
                        openedPanel: state.openedPanel === 'AiPanel' ? null : 'AiPanel',
                    });
                    if (page === 'input') {
                        inputTextarea.current.focus();
                    } else if (page === 'output') {
                        if (document.activeElement) {
                            document.activeElement.blur();
                        }
                    }
                    return false;
                }
            } */

            return true;
        };

        registerIoEventHandler( 'keyup', handleKeyUp );

        return () => {
            unregisterIoEventHandler( 'keyup', handleKeyUp );
        };
    }, []);

    //
  
    return (
        <div className={classnames(styles.panel, styles.codeAiPanel)}>
            <div className={styles.textarea}>
            <textarea className={styles.textarea} value={input} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" onFocus={e => {
                if (page !== 'input') {
                    setPage('input');
                    const oldAi = ai;
                    if (oldAi) {
                        oldAi.destroy();
                        setAi(null);
                    }
                    setCompiling(false);
                }
            }} onChange={e => { console.log( e.target.value ); setInput(e.target.value); }} placeholder="Teleport me to the nearest object" ref={inputTextarea} />
            {
                (() => {
                    switch (page) {
                        case 'input': {
                            return (
                                <>
                                    <div className={styles.buttons}>
                                        <button className={styles.button + ' ' + (compiling ? styles.disabled : '')} onClick={_compile}>Generate code</button>
                                    </div>
                                </>
                            );
                        }
                        case 'output': {
                            return (
                                <>
                                    <textarea className={styles.output} value={output} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" onChange={e => { setOutput(e.target.value); }} placeholder="" ref={outputTextarea} />
                                    <div className={styles.buttons}>
                                        <button className={styles.button} onClick={_run}>Run code</button>
                                    </div>
                                </>
                            );
                        }
                    }
                })()
            }
            </div>
        </div>
    );
}