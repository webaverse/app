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

import * as sounds from '../../../../sounds';
import game from '../../../../game';
import cameraManager from '../../../../camera-manager';

//

const defaultPanel = 'image';

export function AiMenu () {
    const {state, setState} = useContext( AppContext );
    const [panel, setPanel] = useState(defaultPanel);
    const [lastOpenedPanel, setLastOpenedPanel] = useState(state.openedPanel);

    //

    const stopPropagation = (event) => {
        event.stopPropagation();
    };

    //

    // key bindings
    useEffect(() => {
        const handleKeyUp = (event) => {
            if (event.which === 191) { // /
                if (game.inputFocused()) {
                    return true;
                } else {
                    const newOpened = state.openedPanel !== 'AiPanel';
                    const newOpenedPanel = newOpened ? 'AiPanel' : null;
                    setState({
                        openedPanel: newOpenedPanel,
                    });
                    if (newOpened) {
                        setPanel(defaultPanel);
                    } else {
                        if (!cameraManager.pointerLockElement) {
                            cameraManager.requestPointerLock();
                        }
                    }

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

    // sound effects
    useEffect(() => {
        if (state.openedPanel === 'AiPanel') {
            sounds.playSoundName('menuSweepIn');
        } else if (lastOpenedPanel === 'AiPanel') {
            sounds.playSoundName('menuSweepOut');
        }

        setLastOpenedPanel(state.openedPanel);
    }, [state.openedPanel, lastOpenedPanel]);

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
                        sounds.playSoundName('menuBeepLow');
                    }}>
                        <div className={styles.block}>
                            <div className={styles.inner}>
                                <img src={'/images/ui/paintbrush.svg'} className={styles.icon} />
                            </div>
                        </div>
                    </div>
                    <div className={classnames(styles.panelButton, panel === 'audio' ? styles.selected : null)} onClick={() => {
                        setPanel('audio');
                        sounds.playSoundName('menuBeepLow');
                    }}>
                        <div className={styles.block}>
                            <div className={styles.inner}>
                                <img src={'/images/ui/audio-speaker.svg'} className={styles.icon} />
                            </div>
                        </div>
                    </div>
                    <div className={classnames(styles.panelButton, panel === 'model' ? styles.selected : null)} onClick={() => {
                        setPanel('model');
                        sounds.playSoundName('menuBeepLow');
                    }}>
                        <div className={styles.block}>
                            <div className={styles.inner}>
                                <img src={'/images/ui/sword.svg'} className={styles.icon} />
                            </div>
                        </div>
                    </div>
                    <div className={classnames(styles.panelButton, panel === 'camera' ? styles.selected : null)} onClick={() => {
                        setPanel('camera');
                        sounds.playSoundName('menuBeepLow');
                    }}>
                        <div className={styles.block}>
                            <div className={styles.inner}>
                                <img src={'/images/ui/camera.svg'} className={styles.icon} />
                            </div>
                        </div>
                    </div>
                    <div className={classnames(styles.panelButton, panel === 'lore' ? styles.selected : null)} onClick={() => {
                        setPanel('lore');
                        sounds.playSoundName('menuBeepLow');
                    }}>
                        <div className={styles.block}>
                            <div className={styles.inner}>
                                <img src={'/images/ui/brain.svg'} className={styles.icon} />
                            </div>
                        </div>
                    </div>
                    <div className={classnames(styles.panelButton, panel === 'code' ? styles.selected : null)} onClick={() => {
                        setPanel('code');
                        sounds.playSoundName('menuBeepLow');
                    }}>
                        <div className={styles.block}>
                            <div className={styles.inner}>
                                <img src={'/images/ui/magic-scroll.svg'} className={styles.icon} />
                            </div>
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
