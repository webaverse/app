
import React, { useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';

import metaversefile from '../../../../metaversefile-api.js';
import { defaultPlayerName } from '../../../../ai/lore/lore-model.js';
import cameraManager from '../../../../camera-manager.js';

import { AppContext } from '../../app';

import styles from './character.module.css';

const emotions = [
    'joy',
    'sorrow',
    'angry',
    'fun',
    'surprise'
];

//

export const Character = ({ game, wearActions, dioramaCanvasRef }) => {

    const { state, setState } = useContext( AppContext );

    const emotionStates = emotions.map(e => {

        const [ action, setAction ] = useState(null);
        const [ value, setValue ] = useState(0);

        return {
            action,
            setAction,
            value,
            setValue
        };

    });

    const [ dragEmotionIndex, setDragEmotionIndex ] = useState( -1 );
    const emotionsRef = useRef();
    const localPlayer = metaversefile.useLocalPlayer();
    const sideSize = 400;

    //

    const handleCharacterBtnClick = () => {

        setState({ openedPanel: ( state.openedPanel === 'CharacterPanel' ? null : 'CharacterPanel' ) });

        if ( state.openedPanel === 'CharacterPanel' ) {

            cameraManager.requestPointerLock();

        }

    };

    //

    useEffect( () => {

        if ( game.playerDiorama ) {

            const canvas = dioramaCanvasRef.current;

            if ( canvas && state.openedPanel === 'CharacterPanel' ) {

                game.playerDiorama.addCanvas( canvas );

                return () => {

                    game.playerDiorama.removeCanvas( canvas );

                };

            }

        }

    }, [ dioramaCanvasRef, state.openedPanel ] );

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

    function onCanvasClick () {

        game.playerDiorama.toggleShader();

    };

    //

    return (
        <div className={ classnames( styles.characterWrapper, state.openedPanel === 'CharacterPanel' ? styles.opened : null ) } >
            <div className={ styles.characterBtn } onClick={ handleCharacterBtnClick } >
                <img src="images/webpencil.svg" className={ styles.background } />
                <span className={ styles.btnText } >人 Character</span>
                <span className={ styles.btnShortKey } >Tab</span>
            </div>

            <div className={ styles.characterPanel } >
                <div
                    className={styles.emotions}
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

                <canvas className={ styles.avatar } ref={ dioramaCanvasRef } width={ sideSize } height={ sideSize } onClick={ onCanvasClick } />

                <div className={ styles.header } >
                    <div className={ classnames( styles.section, styles.name ) } >
                        <h1>{defaultPlayerName}</h1>
                    </div>
                    <div className={ classnames( styles.section, styles.namePlaceholder ) } />
                    <div className={ classnames( styles.section, styles.mainStats ) } >
                        <div className={ styles.row } >
                            <h2>HP</h2>
                            <progress value={61} />
                        </div>
                        <div className={ styles.row } >
                            <h2>MP</h2>
                            <progress value={83} />
                        </div>
                    </div>
                </div>

                {wearActions.map((wearAction, i) => {

                    const app = metaversefile.getAppByInstanceId(wearAction.instanceId);

                    return (
                        <div
                            className={styles.equipment}
                            key={i}
                            onMouseEnter={e => {
                                game.setMouseHoverObject(null);
                                const physicsId = app.getPhysicsObjects()[0]?.physicsId;
                                game.setMouseDomEquipmentHoverObject(app, physicsId);
                            }}
                            onMouseLeave={e => {
                                game.setMouseDomEquipmentHoverObject(null);
                            }}
                        >
                            <img src="images/webpencil.svg" className={classnames(styles.background, styles.violet)} />
                            <img src="images/flower.png" className={styles.icon} />
                            <div className={styles.name}>{app.name}</div>
                            <button className={styles.button} onClick={e => {
                                localPlayer.unwear(app);
                            }}>
                                <img src="images/remove.svg" />
                            </button>
                            <div className={styles.background2} />
                        </div>
                    );

                })}

            </div>
        </div>
    );

};
