
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
const mainStatSpecs = [
    {
        // imgSrc: 'images/stats/noun-support-cure-2360283.svg',
        // imgSrc: 'images/stats/noun-heart-1014575.svg',
        // imgSrc: 'images/stats/noun-heart-4690409.svg',
        imgSrc: 'images/stats/noun-angel-heart-1927972.svg',
        name: 'HP',
        className: 'hp',
        progress: 61,
    },
    {
        // imgSrc: 'images/stats/noun-item-crystal-2360128.svg',
        // imgSrc: 'images/stats/noun-lightning-132277.svg',
        // imgSrc: 'images/stats/noun-lightning-bolt-102450.svg',
        // imgSrc: 'images/stats/noun-galaxy-1903702.svg',
        // imgSrc: 'images/stats/noun-vortex-2806401.svg',
        imgSrc: 'images/stats/noun-vortex-2806369.svg',
        name: 'MP',
        className: 'mp',
        progress: 23,
    },
];
const statSpecs = [
    {
        // imgSrc: 'images/noun-abnormal-bleeding-2360001.svg',
        imgSrc: 'images/stats/noun-skill-sword-swing-2360242.svg',
        // imgSrc: 'images/noun-effect-circle-strike-2360022.svg',
        name: 'Atk',
        value: 23,
    },
    {
        imgSrc: 'images/stats/noun-abnormal-burned-2359995.svg',
        name: 'Def',
        value: 17,
    },
    {
        // imgSrc: 'images/stats/noun-skill-magic-shock-2360168.svg',
        // imgSrc: 'images/noun-classes-magician-2360012.svg',
        imgSrc: 'images/stats/noun-skill-dna-2360269.svg',
        name: 'Vit',
        value: 10,
    },
    {
        imgSrc: 'images/stats/noun-skill-magic-chain-lightning-2360268.svg',
        name: 'Spr',
        value: 9,
    },
    {
        imgSrc: 'images/stats/noun-skill-speed-down-2360205.svg',
        name: 'Dex',
        value: 50,
    },
    {
        imgSrc: 'images/stats/noun-effect-circle-strike-2360022.svg',
        name: 'Lck',
        value: 7,
    },
];

//

const Stat = ({
    statSpec,
}) => {
    return (
        <div className={styles.stat}>
            <img className={styles.icon} src={statSpec.imgSrc} />
            <div className={styles.wrap}>
                <div className={styles.row}>
                    <div className={styles.statName}>{statSpec.name}</div>
                    <div className={styles.statValue}>{statSpec.value}</div>
                </div>
                {statSpec.progress ? (
                    <progress className={styles.progress} value={statSpec.progress} />
                )  : null}
            </div>
        </div>
    );
};

export const Character = ({ game, /* wearActions,*/ dioramaCanvasRef }) => {

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
    const [ emotionsOpen, setEmotionsOpen ] = useState( false );
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

    function onCharacterSelectClick(e) {
        setState({ openedPanel: ( state.openedPanel === 'CharacterSelect' ? null : 'CharacterSelect' ) });

        /* if ( state.openedPanel === 'CharacterSelect' ) {

            // cameraManager.requestPointerLock();

        } */
    }
    function onDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        game.handleDropJsonItemToPlayer(e.dataTransfer.items[0]);
    }
    const characterSelectOpen = state.openedPanel === 'CharacterSelect';

    //

    return (
        <div
            className={ classnames( styles.characterWrapper, state.openedPanel === 'CharacterPanel' ? styles.opened : null ) }
            onDrop={onDrop}
        >
            <div className={ styles.characterBtn } onClick={ handleCharacterBtnClick } >
                <img src="images/webpencil.svg" className={ styles.background } />
                <span className={ styles.btnText } >人 Character</span>
                <span className={ styles.btnShortKey } >Tab</span>
            </div>

            <div className={ styles.characterPanel } >
                <div
                    className={classnames(styles.emotions, emotionsOpen ? styles.open : null)}
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

                <canvas className={ styles.avatar } ref={ dioramaCanvasRef } width={ sideSize } height={ sideSize } onClick={ onCanvasClick } />

                <div className={styles['panel-body']}>
                    <div className={styles['panel-header']}>
                        <div className={styles.row}>
                            <div className={classnames(styles['panel-section'], styles.name)}>
                                <h1>{defaultPlayerName}</h1>
                            </div>
                            <div className={classnames(styles['panel-section'], styles.level)}>
                                <h2>Lv. {6}</h2>
                                <progress className={styles.progress} value={20} max={100} />
                            </div>
                        </div>
                        {/* <div className={styles['xp']}>
                            <progress className={styles.progress} value={20} max={100} />
                            <img className={styles.icon} src="images/ui/xp-bar.svg" />
                        </div> */}
                        {/* <div className={classnames(styles['panel-section'], styles['name-placeholder'])} /> */}
                    </div>
                    <div className={classnames(styles.stats, styles.main)}>
                        {mainStatSpecs.map((statSpec, i) => {
                            return <Stat statSpec={statSpec} key={i} />;
                        })}
                    </div>
                    <div className={classnames(styles.stats, styles.sub)}>
                        {statSpecs.map((statSpec, i) => {
                            return <Stat statSpec={statSpec} key={i} />;
                        })}
                    </div>
                    {/* wearActions.map((wearAction, i) => {
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
                    }) */}
                </div>

                {/* wearActions.map((wearAction, i) => {

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

                }) */}

                <div
                    className={classnames(styles.selectButton, characterSelectOpen ? styles.highlight : null)}
                    onClick={onCharacterSelectClick}
                >
                    Character Select
                </div>

            </div>

        </div>
    );

};
