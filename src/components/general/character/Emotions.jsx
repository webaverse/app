
import React, { useEffect, useState, useRef } from 'react';
import classnames from 'classnames';

import metaversefile from '../../../../metaversefile-api.js';

import styles from './emotions.module.css';

const emotions = [
    'joy',
    'sorrow',
    'angry',
    'fun',
    'surprise',
];

export const Emotions = ({
    parentOpened,
}) => {
    const [ emotionsOpen, setEmotionsOpen ] = useState( false );
    const emotionStates = emotions.map(e => {
        const [ action, setAction ] = useState(null);
        const [ value, setValue ] = useState(0);

        return {
            action,
            setAction,
            value,
            setValue,
        };
    });
    const [ dragEmotionIndex, setDragEmotionIndex ] = useState( -1 );
    const emotionsRef = useRef();

    const localPlayer = metaversefile.useLocalPlayer();

    useEffect( () => {

        function mousemove ( e ) {

            const emotionsEl = emotionsRef.current;

            if ( document.pointerLockElement === emotionsEl ) {

                const { /*movementX, */movementY } = e;

                if ( dragEmotionIndex !== -1 ) {

                    const emotion = emotions[dragEmotionIndex];
                    const emotionState = emotionStates[dragEmotionIndex];
                    const oldValue = emotionState.action ? emotionState.action.value : 0;
                    const value = Math.min(Math.max(oldValue - movementY * 0.01, 0), 1);

                    if ( value > 0 ) {

                        if ( emotionState.action === null ) {

                            const newAction = localPlayer.addAction({ type: 'emote', emotion, value });
                            emotionState.setAction( newAction );
                            emotionState.setValue( value );

                        } else {

                            emotionState.action.value = value;
                            emotionState.setValue( value );

                        }

                    } else {

                        const emoteActionIndex = localPlayer.findActionIndex( a => a.type === 'emote' && a.emotion === emotion );

                        if ( emoteActionIndex !== -1 ) {

                            localPlayer.removeActionIndex( emoteActionIndex );
                            emotionState.setAction( null );
                            emotionState.setValue(0);

                        }

                    }

                }

            }

        }

        document.addEventListener( 'mousemove', mousemove );

        return () => {

            document.removeEventListener( 'mousemove', mousemove );

        };

    }, [ emotionsRef, dragEmotionIndex ].concat( emotionStates.flatMap(e => [ e.action, e.value ] ) ) );

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