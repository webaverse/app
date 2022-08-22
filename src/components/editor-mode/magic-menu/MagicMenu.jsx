
import React, { useState, useEffect, useRef, useContext } from 'react'

import * as codeAi from '../../../../ai/code/code-ai';
import metaversefile from 'metaversefile';
import game from '../../../../game';

import { registerIoEventHandler, unregisterIoEventHandler } from '../../general/io-handler';
import { AppContext } from '../../app';

import styles from './magic-menu.module.css';

//

export function MagicMenu () {

    const { state, setState } = useContext( AppContext );
    const [page, setPage] = useState('input');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [compiling, setCompiling] = useState(false);
    const [loading, setLoading] = useState(false);
    const [needsFocus, setNeedsFocus] = useState(false);
    const [ai, setAi] = useState(null);
    const inputTextarea = useRef();
    const outputTextarea = useRef();

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

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

        const output = outputTextarea.current.value;
        const dataUri = metaversefile.createModule(output);

        (async () => {

            // await metaversefile.load(dataUri);

        })();

        setState({ openedPanel: null });

    };

    //

    useEffect( () => {

        const handleKeyUp = ( event ) => {

            if ( event.which === 13 && window.document.activeElement !== outputTextarea.current && state.openedPanel === 'MagicPanel' ) { // enter

                if ( page === 'input' ) {

                    _compile();

                } else if ( page === 'output' ) {

                    _run();

                }

                return false;

            }

            if ( event.which === 191 ) { // /

                if ( game.inputFocused() ) return true;

                setState({ openedPanel: ( state.openedPanel === 'MagicPanel' ? null : 'MagicPanel' ) });

                if ( page === 'input' ) {

                    inputTextarea.current.focus();

                } else if ( page === 'output' ) {

                    if ( document.activeElement ) {

                        document.activeElement.blur();

                    }

                }

                return false;

            }

            return true;

        };

        registerIoEventHandler( 'keyup', handleKeyUp );

        //

        return () => {

            unregisterIoEventHandler( 'keyup', handleKeyUp );

        };

    }, [] );

    useEffect( () => {

        function all ( event ) {

            if ( window.document.activeElement === inputTextarea.current || event.target === inputTextarea.current ) {

                return false;

            } else {

                return true;

            }

        };

        registerIoEventHandler( '', all );

        return () => {

            unregisterIoEventHandler( '', all );

        };

    }, [] );

    //

    return (
        <div className={ styles.MagicMenu + ' ' + ( state.openedPanel === 'MagicPanel' ? styles.open : '' ) } onClick={ stopPropagation } >
            <div className={styles.container}>
                <textarea className={styles.textarea} value={input} rows={1} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" onFocus={e => {
                    if (page !== 'input') {
                        setPage('input');
                        const oldAi = ai;
                        if (oldAi) {
                            oldAi.destroy();
                            setAi(null);
                        }
                        setCompiling(false);
                    }
                }} onChange={e => { console.log( e.target.value ); setInput(e.target.value); }} placeholder="Ask for it..." ref={inputTextarea} />
                {
                    (() => {
                        switch (page) {
                            case 'input': {
                                return (
                                    <>
                                        <div className={styles.buttons}>
                                            <button className={styles.button + ' ' + (compiling ? styles.disabled : '')} onClick={_compile}>Generate</button>
                                        </div>
                                    </>
                                );
                            }
                            case 'output': {
                                return (
                                    <>
                                        <textarea className={styles.output} value={output} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" onChange={e => { setOutput(e.target.value); }} placeholder="" ref={outputTextarea} />
                                        <div className={styles.buttons}>
                                            <button className={styles.button} onClick={_run}>Run</button>
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

};
