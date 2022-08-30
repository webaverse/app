
import React, { useEffect, useState, useRef } from 'react';
import classnames from 'classnames';

import metaversefile from '../../../../metaversefile-api.js';
import {avatarManager} from '../../../../avatar-manager.js';

import styles from './emotions.module.css';

export const emotions = [
    'joy',
    'sorrow',
    'angry',
    'fun',
    'surprise',
];

export const setFacePoseValue = (emotion, value) => {
    const localPlayer = metaversefile.useLocalPlayer();

    const facePoseActionIndex = localPlayer.findActionIndex( a => a.type === 'facepose' && a.emotion === emotion );
    if ( facePoseActionIndex !== -1 ) {

        localPlayer.removeActionIndex( facePoseActionIndex );

    }

    if ( value > 0 ) {

        const newAction = {
            type: 'facepose',
            emotion,
            value,
        };
        localPlayer.addAction(newAction);

    }
};

export const Emotions = ({
    parentOpened,
}) => {
    const [ emotionsOpen, setEmotionsOpen ] = useState( false );
    const emotionStates = emotions.map(emotion => {
        const [ value, setValue ] = useState(0);

        return {
            value,
            setValue,
        };
    });
    const [ dragEmotionIndex, setDragEmotionIndex ] = useState( -1 );
    const emotionsRef = useRef();

    const localPlayer = metaversefile.useLocalPlayer();

    // handle mouse events
    useEffect( () => {

        function mousemove ( e ) {

            const emotionsEl = emotionsRef.current;

            if ( document.pointerLockElement === emotionsEl ) {

                const { /*movementX, */movementY } = e;

                if ( dragEmotionIndex !== -1 ) {

                    const emotion = emotions[dragEmotionIndex];
                    const emotionState = emotionStates[dragEmotionIndex];
                    const oldValue = emotionState.value;
                    const value = Math.min(Math.max(oldValue - movementY * 0.01, 0), 1);

                    setFacePoseValue(emotion, value);

                    // this set is redundant, but it ensures zero values from setFacePoseValue do not interfere with the drag
                    emotionState.setValue( value );

                }

            }

        }

        document.addEventListener( 'mousemove', mousemove );

        return () => {

            document.removeEventListener( 'mousemove', mousemove );

        };

    }, [ emotionsRef, dragEmotionIndex ].concat( emotionStates.map(e => e.value ) ) );

    // update UI from external actions
    useEffect( () => {

        const actionadd = e => {

            const {action} = e.data;
            if (action.type === 'facepose') {
                const {emotion, value} = action;
                const emotionIndex = emotions.indexOf(emotion);
                if (emotionIndex !== -1) {
                    const emotionState = emotionStates[emotionIndex];
                    emotionState.setValue(value);
                }
            }

        };
        avatarManager.addEventListener('actionadd', actionadd);

        const actionremove = e => {

            const {action} = e.data;
            if (action.type === 'facepose') {
                const {emotion} = action;
                const emotionIndex = emotions.indexOf(emotion);
                if (emotionIndex !== -1) {
                    const emotionState = emotionStates[emotionIndex];
                    emotionState.setValue(0);
                }
            }

        };
        avatarManager.addEventListener('actionremove', actionremove);
    
        return () => {

            avatarManager.removeEventListener('actionadd', actionadd);
            avatarManager.removeEventListener('actionremove', actionremove);

        };

    }, []);

    return (
        <div
            className={classnames(
                styles.emotions,
                parentOpened ? styles.parentOpened : null,
                emotionsOpen ? styles.open : null,
            )}
            onMouseEnter={e => {
                setEmotionsOpen(true);
            }}
            onMouseLeave={e => {
                setEmotionsOpen(false);
            }}
            onMouseUp={e => {
                document.exitPointerLock();
                setDragEmotionIndex(-1);
            }}
            ref={emotionsRef}
        >
            {emotions.map((emotion, emotionIndex) => {
                return (
                    <div
                        className={classnames(
                            styles.emotion,
                            emotionStates[emotionIndex].value > 0 ? styles.nonzero : null,
                            emotionStates[emotionIndex].value === 1 ? styles.full : null,
                        )}
                        onMouseDown={e => {
                            e.preventDefault();
                            e.stopPropagation();

                            (async () => {
                            const emotionsEl = emotionsRef.current;
                            await emotionsEl.requestPointerLock();
                            })();

                            setDragEmotionIndex(emotionIndex);
                        }}
                        key={emotion}
                    >
                        <div className={styles.emotionIconPlaceholder} />
                        <div className={styles.emotionNamePlaceholder} />
                        <progress className={classnames(styles.emotionProgress)} value={emotionStates[emotionIndex].value} />
                        <img src={`images/emotions/${emotion}.svg`} className={styles.emotionIcon} />
                        <div className={styles.emotionName}>{emotion}</div>
                    </div>
                );
            })}
        </div>
    );
};