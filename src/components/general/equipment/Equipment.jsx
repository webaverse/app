import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
import styles from './equipment.module.css';
import { AppContext } from '../../app';
import { MegaHotBox } from '../../play-mode/mega-hotbox';
import { ItemLoader } from '../../../ItemLoader.jsx';
// import {EquipmentPopover} from '../../play-mode/equipment-popover';
import { Spritesheet } from '../spritesheet';
import game from '../../../../game.js';
import { transparentPngUrl } from '../../../../constants.js';
import * as sounds from '../../../../sounds.js';
import { mod } from '../../../../util.js';
import dropManager from '../../../../drop-manager';
import offscreenEngineManager from '../../../../offscreen-engine-manager.js';

//

const size = 2048;
const numFrames = 128;
const width = 400;

const equipmentTabs = [
    `noun-backpack-16741.svg`,
    `noun-box-4775546.svg`,
    `noun-key-1173931.svg`,
    `noun-arc-de-triomphe-4009238.svg`,
];

const userTokenObjects = []; // Array(2);
for (let i = 0; i < userTokenObjects.length; i++) {
    userTokenObjects[i] = {
        name: '',
        start_url: '',
        level: 0,
    };
}
const objects = {
    upstreet: [
        {
            name: 'Silsword',
            start_url: 'https://webaverse.github.io/silsword/',
            description: 'A sword of great lore.',
            level: 6,
        },
        {
            name: 'Dragon',
            start_url: 'https://webaverse.github.io/dragon-mount/',
            description: 'A cute dragon. But something is wrong with it...',
            level: 5,
        },
        {
            name: 'Bow',
            start_url: 'https://webaverse.github.io/bow/',
            description: 'A nature-themed bow. It seems unbelievably magical for some reason.',
            level: 9,
        },
        /* {
            name: 'Silk',
            start_url: './metaverse_modules/silk/',
            level: 1,
        }, */
    ],
};

//

const EquipmentItem = ({
    object,
    enabled,
    hovered,
    selected,
    // loading,
    onMouseEnter,
    onMouseDown,
    onDragStart,
    onDoubleClick,
    highlight,
}) => {
    return (
        <div
            className={classnames(
                styles.item,
                hovered ? styles.hovered : null,
                selected ? styles.selected : null,
                highlight ? styles.highlighted : null,
            )}
            draggable
            onMouseEnter={onMouseEnter}
            onMouseDown={onMouseDown}
            onDragStart={onDragStart}
            onDoubleClick={onDoubleClick}
            // ref={ref}
        >

            <div className={styles.background} />
            <div className={styles.highlight} />

            <Spritesheet
                className={styles.canvas}
                startUrl={object?.start_url}
                enabled={enabled}
                size={size}
                numFrames={numFrames}
            />

            <div className={styles.row}>
                <div className={styles.name}>{object?.name}</div>
                <div className={styles.level}>Lv. {object?.level}</div>
            </div>

            {/* selected && loading ? <EquipmentPopover /> : null */}

        </div>
    );
};

const EquipmentItems = ({
    leftText,
    rightText,
    sections,
    hoverObject,
    selectObject,
    loading,
    onMouseEnter,
    onMouseDown,
    onDragStart,
    onDoubleClick,
    menuLeft,
    menuRight,
    highlights,
}) => {
    return (<div className={styles.menu}>
        <div className={classnames(styles.wing, styles.left)} onClick={menuLeft}>
            <img className={styles.arrow} src="./images/chevron3.svg" />
            <div className={styles.text}>{leftText}</div>
        </div>
        <div className={classnames(styles.wing, styles.right)} onClick={menuRight}>
            <div className={styles.text}>{rightText}</div>
            <img className={styles.arrow} src="./images/chevron3.svg" />
        </div>
        {sections.map((section, i) => {
            const {name, tokens} = section;

            /* const refsMap = (() => {
                const map = new Map();
                for (const tokenObject of tokens) {
                    map.set(tokenObject, useRef(null));
                }
                for (const k in objects) {
                    for (const object of objects[k]) {
                        map.set(object, useRef(null));
                    }
                }
                return map;
            })(); */

            return (
                <div className={styles.section} key={i}>
                    <div className={styles.subheading}>
                        <h2>{name}</h2>
                    </div>
                    <ul className={styles.list}>
                        {tokens.map((object, i) =>
                            <EquipmentItem
                                object={object}
                                enabled={open}
                                hovered={object === hoverObject}
                                selected={object === selectObject}
                                loading={loading}
                                highlight={highlights}
                                onMouseEnter={onMouseEnter(object)}
                                onMouseDown={onMouseDown(object)}
                                onDragStart={onDragStart(object)}
                                onDoubleClick={onDoubleClick(object)}
                                key={i}
                                // ref={refsMap.get(object)}
                            />
                        )}
                    </ul>
                </div>
            );
        })}
    </div>);
};

const _generateObjectUrlCardRemote = (() => {
    let generateObjectUrlCardRemoteFn = null;
    return async function() {
        if (!generateObjectUrlCardRemoteFn) {
            generateObjectUrlCardRemoteFn = offscreenEngineManager.createFunction([
                `\
                import {generateObjectUrlCard} from './card-generator.js';
                `,
                async function(o) {
                    const imageBitmap = await generateObjectUrlCard(o);
                    return imageBitmap;
                }
            ]);
        }
        const result = await generateObjectUrlCardRemoteFn.apply(this, arguments);
        return result;
    };
})();
export const Equipment = () => {
    const { state, setState } = useContext( AppContext );
    const [ hoverObject, setHoverObject ] = useState(null);
    const [ selectObject, setSelectObject ] = useState(null);
    // const [ spritesheet, setSpritesheet ] = useState(null);
    const [ faceIndex, setFaceIndex ] = useState(1);
    const [ claims, setClaims ] = useState([]);
    const [ itemLoader, setItemLoader ] = useState(() => new ItemLoader({
        async loadFn(url, value, {signal}) {            
            const {start_url} = value;
            const imageBitmap = await _generateObjectUrlCardRemote([
                {
                    start_url,
                    width,
                }
            ], {
                signal,
            });
            return imageBitmap;
        },
    }));
    const [ loading, setLoading ] = useState(false);
    const [ imageBitmap, setImageBitmap ] = useState(null);

    const selectedMenuIndex = mod(faceIndex, 4);

    const open = state.openedPanel === 'CharacterPanel';

    const onMouseEnter = object => () => {
        setHoverObject(object);

        sounds.playSoundName('menuClick');
    };
    const onMouseDown = object => () => {
        // const newSelectObject = selectObject !== object ? object : null;
        setSelectObject(object);

        if (object) {
            sounds.playSoundName('menuNext');
        } /* else {
            const audioSpec = soundFiles.menuBack[Math.floor(Math.random() * soundFiles.menuBack.length)];
            sounds.playSoundName('menuBack');
        } */
    };
    const onDragStart = object => e => {
        e.dataTransfer.setData('application/json', JSON.stringify(object));
        e.dataTransfer.effectAllowed = 'all';
        e.dataTransfer.dropEffect = 'move';

        const transparentPng = new Image();
        transparentPng.src = transparentPngUrl;
        e.dataTransfer.setDragImage(transparentPng, 0, 0);

        setSelectObject(object);
    };
    const onDoubleClick = object => () => {
        game.handleDropJsonToPlayer(object);

        setSelectObject(object);
    };
    const menuLeft = () => {
        setFaceIndex(faceIndex - 1);

        sounds.playSoundName('menuNext');
    };
    const menuRight = () => {
        setFaceIndex(faceIndex + 1);
    
        sounds.playSoundName('menuNext');
    };
    const selectClassName = styles[`select-${selectedMenuIndex}`];

    useEffect(() => {
        const claimschange = e => {
            const {claims} = e.data;
            setClaims(claims.slice());
        };
        dropManager.addEventListener('claimschange', claimschange);
        return () => {
            dropManager.removeEventListener('claimschange', claimschange);
        };
    }, [claims]);

    useEffect(() => {
        if (itemLoader) {
            const loadingchange = e => {
                setLoading(e.data.loading);
            };
            itemLoader.addEventListener('loadingchange', loadingchange);
            return () => {
                itemLoader.removeEventListener('loadingchange', loadingchange);
            };
        }
    }, [itemLoader]);

    useEffect(() => {
        if (open) {
            const start_url = selectObject ? selectObject.start_url : '';
            if (start_url) {
                const abortController = new AbortController();
                (async () => {
                    const imageBitmap = await itemLoader.loadItem(start_url, selectObject, {
                        signal: abortController.signal,
                    });
                    if (imageBitmap !== null) {
                        setImageBitmap(imageBitmap);
                    }
                })();
                setImageBitmap(null);
                return () => {
                    abortController.abort();
                };
            }
        } else {
            if (selectObject) {
                setSelectObject(null);
            }
        }
    }, [open, selectObject]);

    useEffect(() => {
        setSelectObject(null);
    }, [faceIndex]);

    return (
        <div className={styles.equipment}>
            <div className={classnames(
                styles.menus,
                open ? styles.open : null,
                selectClassName,
            )}>
                <div
                    className={styles.scene}
                    style={{
                        transform: `translateX(300px) translateZ(-300px) rotateY(${-faceIndex * 90}deg) translateX(-300px)`,
                    }}
                >
                    <EquipmentItems
                        leftText="Land"
                        rightText="Season"
                        sections={[
                            {
                                name: 'Inventory',
                                tokens: claims,
                            },
                        ]}
                        hoverObject={hoverObject}
                        selectObject={selectObject}
                        loading={loading}
                        onMouseEnter={onMouseEnter}
                        onMouseDown={onMouseDown}
                        onDragStart={onDragStart}
                        onDoubleClick={onDoubleClick}
                        menuLeft={menuLeft}
                        menuRight={menuRight}
                        highlights={true}
                    />
                    <EquipmentItems
                        leftText="Inventory"
                        rightText="Account"
                        sections={[
                            {
                                name: 'Season',
                                tokens: userTokenObjects,
                            },
                            {
                                name: 'From Upstreet',
                                tokens: objects.upstreet,
                            },
                        ]}
                        hoverObject={hoverObject}
                        selectObject={selectObject}
                        loading={loading}
                        onMouseEnter={onMouseEnter}
                        onMouseDown={onMouseDown}
                        onDragStart={onDragStart}
                        onDoubleClick={onDoubleClick}
                        menuLeft={menuLeft}
                        menuRight={menuRight}
                        highlights={false}
                    />
                    <EquipmentItems
                        leftText="Season"
                        rightText="Land"
                        sections={[
                            {
                                name: 'Account',
                                tokens: [],
                            },
                        ]}
                        hoverObject={hoverObject}
                        selectObject={selectObject}
                        loading={loading}
                        onMouseEnter={onMouseEnter}
                        onMouseDown={onMouseDown}
                        onDragStart={onDragStart}
                        onDoubleClick={onDoubleClick}
                        menuLeft={menuLeft}
                        menuRight={menuRight}
                        highlights={false}
                    />
                    <EquipmentItems
                        leftText="Account"
                        rightText="Inventory"
                        sections={[
                            {
                                name: 'Land',
                                tokens: [],
                            },
                        ]}
                        hoverObject={hoverObject}
                        selectObject={selectObject}
                        loading={loading}
                        onMouseEnter={onMouseEnter}
                        onMouseDown={onMouseDown}
                        onDragStart={onDragStart}
                        onDoubleClick={onDoubleClick}
                        menuLeft={menuLeft}
                        menuRight={menuRight}
                        highlights={false}
                    />
                </div>
            </div>

            <div className={classnames(
                styles.menuFooter,
                open ? styles.open : null,
                selectClassName,
            )}>
                <div className={styles.menuFooterWrap}>
                    {equipmentTabs.map((imgFileName, i) => {
                        return (
                            <div
                                className={classnames(
                                    styles.menuFooterItem,
                                    selectedMenuIndex === i ? styles.selected : null,
                                )}
                                onClick={e => {
                                    const delta = i - selectedMenuIndex;
                                    setFaceIndex(faceIndex + delta);

                                    sounds.playSoundName('menuNext');
                                }}
                                key={i}
                            >
                                <img className={styles.img} src={`./images/equipment/${imgFileName}`} />
                            </div>
                        );
                    })}
                    <div className={styles.bar} />
                </div>
            </div>

            <MegaHotBox
                open={!!selectObject}
                loading={loading}
                name={selectObject ? selectObject.name : null}
                description={selectObject ? selectObject.description : null}
                imageBitmap={imageBitmap}
                onActivate={onDoubleClick(selectObject)}
                onClose={e => {
                    setSelectObject(null);
                }}
            />
        </div>
    );
};