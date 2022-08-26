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

const panels = [
    {
        name: 'image',
        iconUrl: `/images/ui/paintbrush.svg`,
        component: ImageAiPanel,
    },
    {
        name: 'audio',
        iconUrl: `/images/ui/audio-speaker.svg`,
        component: AudioAiPanel,
    },
    {
        name: 'model',
        iconUrl: `/images/ui/sword.svg`,
        component: ModelAiPanel,
    },
    {
        name: 'camera',
        iconUrl: `/images/ui/camera.svg`,
        component: CameraAiPanel,
    },
    {
        name: 'lore',
        iconUrl: `/images/ui/brain.svg`,
        component: LoreAiPanel,
    },
    {
        name: 'code',
        iconUrl: `/images/ui/magic-scroll.svg`,
        component: CodeAiPanel,
    },
];
const defaultPanel = panels[0];

export function AiMenu () {
    const {state, setState} = useContext(AppContext);
    const [selectedPanel, setSelectedPanel] = useState(defaultPanel);
    const [lastOpenedPanel, setLastOpenedPanel] = useState(state.openedPanel);

    //

    const stopPropagation = (event) => {
        event.stopPropagation();
    };

    //

    // key bindings
    useEffect(() => {
        const handleKeyUp = (event) => {
            if (game.inputFocused()) {
                return true;
            } else {
                if (event.which === 191) { // /
                    const newOpened = state.openedPanel !== 'AiPanel';
                    const newOpenedPanel = newOpened ? 'AiPanel' : null;
                    setState({
                        openedPanel: newOpenedPanel,
                    });
                    if (newOpened) {
                        setSelectedPanel(defaultPanel);
                    } else {
                        if (!cameraManager.pointerLockElement) {
                            cameraManager.requestPointerLock();
                        }
                    }

                    return false;
                } else if (event.which === 37) { // left
                    let panelIndex = panels.indexOf(selectedPanel);
                    panelIndex--;
                    if (panelIndex < 0) {
                        panelIndex = panels.length - 1;
                    }
                    setSelectedPanel(panels[panelIndex]);
                    sounds.playSoundName('menuBeepLow');

                    return false;
                } else if (event.which === 39) { // right
                    let panelIndex = panels.indexOf(selectedPanel);
                    panelIndex++;
                    if (panelIndex >= panels.length) {
                        panelIndex = 0;
                    }
                    setSelectedPanel(panels[panelIndex]);
                    sounds.playSoundName('menuBeepLow');
                    
                    return false;
                }
                return true;
            }
        };

        registerIoEventHandler('keyup', handleKeyUp);

        return () => {
            unregisterIoEventHandler('keyup', handleKeyUp);
        };
    }, [state.openedPanel, selectedPanel]);

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
                    {panels.map((panel, i) => {
                        return (
                            <div
                                className={classnames(styles.panelButton, panel === selectedPanel ? styles.selected : null)}
                                onClick={() => {
                                    setSelectedPanel(panel);
                                    sounds.playSoundName('menuBeepLow');
                                }}
                                key={i}
                            >
                                <div className={styles.block}>
                                    <div className={styles.inner}>
                                        <img src={panel.iconUrl} className={styles.icon} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <selectedPanel.component />
            </div>
        </div>
    );
};