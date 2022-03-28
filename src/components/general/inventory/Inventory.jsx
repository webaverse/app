
import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
// import metaversefile from 'metaversefile';
import styles from './inventory.module.css';
import { AppContext } from '../../app';
import { MegaHotBox } from '../../play-mode/mega-hotbox';
import { LightArrow } from '../../../LightArrow.jsx';
// import { world } from '../../../../world.js';
// import { NpcPlayer } from '../../../../character-controller.js';

//

const userTokenObjects = Array(7);
for (let i = 0; i < userTokenObjects.length; i++) {
    userTokenObjects[i] = {
        name: '',
        start_url: '',
    };
}
const objects = {
    upstreet: [
        {
            name: 'Silsword',
            start_url: 'https://webaverse.github.io/silsword/',
        },
    ],
};

//

const InventoryObject = forwardRef(({
    object,
}, ref) => {
    return (
        <div className={styles.inventoryObject} ref={ref} />
    );
});

export const Inventory = () => {
    const { state, setState } = useContext( AppContext );
    const [ highlightItem, setHighlightItem ] = useState(null);
    // const [ selectCharacter, setSelectCharacter ] = useState(null);
    // const [ arrowPosition, setArrowPosition ] = useState(null);
    // const [ npcPlayer, setNpcPlayer ] = useState(null);
    // const [ npcPlayerCache, setNpcPlayerCache ] = useState(new Map());
    const [ spritesheet, setSpritesheet ] = useState(null);

    const refsMap = (() => {
        const map = new Map();
        for (const userTokenObject of userTokenObjects) {
            map.set(userTokenObject, useRef(null));
        }
        for (const k in objects) {
            for (const object of objects[k]) {
                map.set(object, useRef(null));
            }
        }
        return map;
    })();

    /* const targetCharacter = selectCharacter || highlightCharacter;
    const _updateArrowPosition = () => {
        if (targetCharacter) {
            const ref = refsMap.get(targetCharacter);
            const el = ref.current;
            if (el) {
                const rect = el.getBoundingClientRect();
                const parentRect = el.offsetParent.getBoundingClientRect();
                // window.rect = rect;
                // window.parentRect = parentRect;
                setArrowPosition([
                    Math.floor(rect.left - parentRect.left + rect.width / 2 + 40),
                    Math.floor(rect.top - parentRect.top + rect.height / 2),
                ]);
            } else {
                setArrowPosition(null);
            }
            // console.log('got ref', ref);
            // setArrowPosition([highlightCharacter.x, highlightCharacter.y]);
        } else {
            setArrowPosition(null);
        }
    };
    useEffect(() => {
        _updateArrowPosition();
    }, [targetCharacter]);
    useEffect(() => {
        if (targetCharacter) {
            const {vrmSrc} = targetCharacter;

            let live = true;
            let npcPlayer = npcPlayerCache.get(vrmSrc);
            (async () => {
                if (!npcPlayer) {
                    const avatarApp = await metaversefile.createAppAsync({
                        start_url: vrmSrc,
                    });
                    npcPlayer = new NpcPlayer();
                    npcPlayer.setAvatarApp(avatarApp);
                    npcPlayerCache.set(vrmSrc, npcPlayer);
                    if (!live) return;
                }

                setNpcPlayer(npcPlayer);
            })();

            const frame = e => {
                const {timestamp, timeDiff} = e.data;
                if (npcPlayer) {
                  npcPlayer.updateAvatar(timestamp, timeDiff);
                }
            };
            world.appManager.addEventListener('frame', frame);

            return () => {
                live = false;
                world.appManager.removeEventListener('frame', frame);
            };
        }
    }, [targetCharacter]);

    const opened = state.openedPanel === 'CharacterSelect';
    useEffect(() => {
        if (opened) {
            setSelectCharacter(null);

            const timeout = setTimeout(() => {
                _updateArrowPosition();
            }, 1000);
            return () => {
                clearTimeout(timeout);
            };
        }
    }, [opened, targetCharacter]); */

    /* useEffect(() => {
        
    }, []); */

    const open = state.openedPanel === 'CharacterPanel';
    const targetObject = null;

    return (
        <div className={styles.inventory}>
            <div className={classnames(styles.menu, open ? styles.open : null)}>
                {/* <div className={styles.heading}>
                    <h1>Inventory</h1>
                </div> */}
                <div className={styles.section}>
                    <div className={styles.subheading}>
                        <h2>Tokens</h2>
                    </div>
                    <ul className={styles.list}>
                        {userTokenObjects.map((object, i) =>
                            <InventoryObject
                                object={object}
                                highlight={object === targetObject}
                                // animate={selectCharacter === character}
                                // disabled={!character.name || (!!selectCharacter && selectCharacter !== character)}
                                onMouseEnter={() => {
                                    setHighlightObject(object);
                                }}
                                onClick={e => {
                                    setSelectObject(object);
                                    setTimeout(() => {
                                        setSelectObject(null);
                                    }, 2000);
                                }}
                                key={i}
                                ref={refsMap.get(object)}
                            />
                        )}
                    </ul>
                </div>
                <div className={styles.section}>
                    <div className={styles.subheading}>
                        <h2>From Upstreet</h2>
                    </div>
                    <ul className={styles.list}>
                        {objects.upstreet.map((object, i) => {
                            return (
                                <InventoryObject
                                    object={object}
                                    highlight={object === targetObject}
                                    // animate={selectCharacter === character}
                                    // disabled={!character.name || (!!selectCharacter && selectCharacter !== character)}
                                    onMouseEnter={() => {
                                        setHighlightObject(object);
                                    }}
                                    onClick={e => {
                                        setSelectObject(object);
                                        setTimeout(() => {
                                            setSelectObject(null);
                                        }, 2000);
                                    }}
                                    key={i}
                                    ref={refsMap.get(object)}
                                />
                            );
                        })}
                        {/* <LightArrow
                            enabled={!!arrowPosition}
                            animate={!!selectCharacter}
                            x={arrowPosition?.[0] ?? 0}
                            y={arrowPosition?.[1] ?? 0}
                        /> */}
                    </ul>
                </div>
            </div>

            <MegaHotBox
                open={open}
                spritesheet={spritesheet}
            />
        </div>
    );
};