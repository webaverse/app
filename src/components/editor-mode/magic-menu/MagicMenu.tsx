
import React, { useState, useEffect, useRef } from 'react';

import metaversefile from 'metaversefile';
import ioManager from '../../../../io-manager';
import { aiHost } from '../../../../constants';

import classes from './magic-menu.module.css';

//

const makeAi = ( prompt ) => {

    const es = new EventSource( `${aiHost}/code?p=${encodeURIComponent(prompt)}` );
    let fullS = '';

    es.addEventListener('message', e => {

        const s = e.data;

        if ( s !== '[DONE]' ) {

            const j = JSON.parse( s );
            const { choices } = j;
            const { text } = choices[0];
            fullS += text;

            if ( ! fullS ) {

                fullS = '// nope';

            }

            result.dispatchEvent( new MessageEvent('update', { data: fullS }) );

        } else {

            es.close();
            result.dispatchEvent( new MessageEvent('done') );

        }

    });

    const result = new EventTarget();

    result.destroy = () => {

        es.close();

    };

    return result;

};

export const MagicMenu = ({ open, setOpen }) => {

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

        (async () => { await metaversefile.load(dataUri); })();

    };

    useEffect(() => {

        const types = ['keyup', /* 'click', */ 'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave', 'paste'];

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

        if ( open ) {

            if ( page === 'input' ) {

                inputTextarea.current.focus();

            } else if (page === 'output') {

                if (document.activeElement) {

                    document.activeElement.blur();

                }

            }

            setNeedsFocus(false);

        }

    }, [ open, inputTextarea.current, needsFocus ]);

    const click = e => {

        ioManager.click(new MouseEvent('click'));

    };

    const keydown = e => {

        if ( open ) {

            if (e.which === 13 && window.document.activeElement !== outputTextarea.current) { // enter

                e.preventDefault();
                e.stopPropagation();

                if (page === 'input') {

                    _compile();

                } else if (page === 'output') {

                    _run();

                }

            }

        }

    };

    return (
        <div className={ classes.MagicMenu + ' ' + ( open ? classes.open : '' ) } onClick={ click }>
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
                }} onChange={e => { setInput(e.target.value); }} onKeyDown={keydown} placeholder="Ask for it..." ref={inputTextarea} />

                {
                    (() => {
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
                    })()
                }
            </div>
        </div>
    );

};
