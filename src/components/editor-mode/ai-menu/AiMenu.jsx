import React, {useState, useContext, useEffect} from 'react';
import classnames from 'classnames';
import {registerIoEventHandler, unregisterIoEventHandler} from '../../general/io-handler';
import {AppContext} from '../../app';

import {ImageAiPanel} from './panels/image-ai-panel.jsx';
import {AudioAiPanel} from './panels/audio-ai-panel.jsx';
import {ModelAiPanel} from './panels/model-ai-panel.jsx';
import {CameraAiPanel} from './panels/camera-ai-panel.jsx';
import {LoreAiPanel} from './panels/lore-ai-panel.jsx';
import {CodeAiPanel} from './panels/code-ai-panel.jsx';

import styles from './ai-menu.module.css';

import game from '../../../../game';

//

export function AiMenu () {
    const {state, setState} = useContext( AppContext );
    const [panel, setPanel] = useState('image');

    //

    const stopPropagation = (event) => {
        event.stopPropagation();
    };

    //

    useEffect(() => {
        const handleKeyUp = (event) => {
            /* if (
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
            } */

            if (event.which === 191) { // /
                if (game.inputFocused()) {
                    return true;
                } else {
                    const newOpened = state.openedPanel !== 'AiPanel';
                    const newOpenedPanel = newOpened ? 'AiPanel' : null;
                    setState({
                        openedPanel: newOpenedPanel,
                    });
                    return false;
                }
            }

            return true;
        };

        registerIoEventHandler('keyup', handleKeyUp);

        return () => {
            unregisterIoEventHandler('keyup', handleKeyUp);
        };
    }, [state.openedPanel]);

    //

    return (
        <div
            className={classnames(styles.AiMenu, state.openedPanel === 'AiPanel' ? styles.open : '')}
            onClick={stopPropagation}
        >
            <div className={styles.container}>
                <div className={styles.panelButtons}>
                    <div className={classnames(styles.panelButton, panel === 'image' ? styles.selected : null)} onClick={() => {
                        setPanel('image');
                    }}>
                        <div className={styles.block}>
                            <img src={'/images/ui/paintbrush.svg'} className={styles.icon} />
                        </div>
                    </div>
                    <div className={classnames(styles.panelButton, panel === 'audio' ? styles.selected : null)} onClick={() => {
                        setPanel('audio');
                    }}>
                        <div className={styles.block}>
                            <img src={'/images/ui/audio-speaker.svg'} className={styles.icon} />
                        </div>
                    </div>
                    <div className={classnames(styles.panelButton, panel === 'model' ? styles.selected : null)} onClick={() => {
                        setPanel('model');
                    }}>
                        <div className={styles.block}>
                            <img src={'/images/ui/sword.svg'} className={styles.icon} />
                        </div>
                    </div>
                    <div className={classnames(styles.panelButton, panel === 'camera' ? styles.selected : null)} onClick={() => {
                        setPanel('camera');
                    }}>
                        <div className={styles.block}>
                            <img src={'/images/ui/camera.svg'} className={styles.icon} />
                        </div>
                    </div>
                    <div className={classnames(styles.panelButton, panel === 'lore' ? styles.selected : null)} onClick={() => {
                        setPanel('lore');
                    }}>
                        <div className={styles.block}>
                            <img src={'/images/ui/brain.svg'} className={styles.icon} />
                        </div>
                    </div>
                    <div className={classnames(styles.panelButton, panel === 'code' ? styles.selected : null)} onClick={() => {
                        setPanel('code');
                    }}>
                        <div className={styles.block}>
                            <img src={'/images/ui/magic-scroll.svg'} className={styles.icon} />
                        </div>
                    </div>
                </div>
                {
                    (() => {
                        switch (panel) {
                            case 'image': {
                                return (
                                    <ImageAiPanel />
                                );
                            }
                            case 'audio': {
                                return (
                                    <AudioAiPanel />
                                );
                            }
                            case 'model': {
                                return (
                                    <ModelAiPanel />
                                );
                            }
                            case 'camera': {
                                return (
                                    <CameraAiPanel />
                                );
                            }
                            case 'lore': {
                                return (
                                    <LoreAiPanel />
                                );
                            }
                            case 'code': {
                                return (
                                    <CodeAiPanel />
                                );
                            }
                            default: {
                                return null;
                            }
                        }
                    })()
                }
            </div>
        </div>
    );
};
