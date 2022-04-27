import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
import styles from './equipment.module.css';
import { AppContext } from '../../app';
import { MegaHotBox } from '../../play-mode/mega-hotbox';
import { Spritesheet } from '../spritesheet';
import game from '../../../../game.js';
import {transparentPngUrl} from '../../../../constants.js';
import * as sounds from '../../../../sounds.js';
import {mod} from '../../../../util.js';

//

const size = 2048;
const numFrames = 128;

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
            level: 6,
        },
        {
            name: 'Dragon',
            start_url: 'https://webaverse.github.io/dragon-mount/',
            level: 5,
        },
        {
            name: 'Bow',
            start_url: 'https://webaverse.github.io/bow/',
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

const Item = forwardRef(({
    object,
    enabled,
    hovered,
    selected,
    onMouseEnter,
    onMouseDown,
    onDragStart,
    onDoubleClick,
}, ref) => {
    return (
        <div
            className={classnames(
                styles.item,
                hovered ? styles.hovered : null,
                selected ? styles.selected : null,
            )}
            draggable
            onMouseEnter={onMouseEnter}
            onMouseDown={onMouseDown}
            onDragStart={onDragStart}
            onDoubleClick={onDoubleClick}
            ref={ref}
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

        </div>
    );
});

export const Equipment = () => {
    const { state, setState } = useContext( AppContext );
    const [ hoverObject, setHoverObject ] = useState(null);
    const [ selectObject, setSelectObject ] = useState(null);
    const [ spritesheet, setSpritesheet ] = useState(null);
    const [ faceIndex, setFaceIndex ] = useState(1);
    const selectedMenuIndex = mod(faceIndex, 4);

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

    const open = state.openedPanel === 'CharacterPanel';

    const onMouseEnter = object => () => {
        setHoverObject(object);

        sounds.playSoundName('menuClick');
    };
    const onMouseDown = object => () => {
        const newSelectObject = selectObject !== object ? object : null;
        setSelectObject(newSelectObject);

        // game.renderCard(object);

        if (newSelectObject) {
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
                    <div className={styles.menu}>
                        <div className={classnames(styles.wing, styles.left)} onClick={menuLeft}>
                            <img className={styles.arrow} src="./images/chevron3.svg" />
                            <div className={styles.text}>Land</div>
                        </div>
                        <div className={classnames(styles.wing, styles.right)} onClick={menuRight}>
                            <div className={styles.text}>Season</div>
                            <img className={styles.arrow} src="./images/chevron3.svg" />
                        </div>
                        <div className={styles.section}>
                            <div className={styles.subheading}>
                                <h2>Inventory</h2>
                            </div>
                        </div>
                    </div>
                    <div className={styles.menu}>
                        <div className={classnames(styles.wing, styles.left)} onClick={menuLeft}>
                            <img className={styles.arrow} src="./images/chevron3.svg" />
                            <div className={styles.text}>Inventory</div>
                        </div>
                        <div className={classnames(styles.wing, styles.right)} onClick={menuRight}>
                            <div className={styles.text}>Account</div>
                            <img className={styles.arrow} src="./images/chevron3.svg" />
                        </div>
                        <div className={styles.section}>
                            <div className={styles.subheading}>
                                <h2>Season</h2>
                            </div>
                            <ul className={styles.list}>
                                {userTokenObjects.map((object, i) =>
                                    <Item
                                        object={object}
                                        enabled={open}
                                        hovered={object === hoverObject}
                                        selected={object === selectObject}
                                        onMouseEnter={onMouseEnter(object)}
                                        onMouseDown={onMouseDown(object)}
                                        onDragStart={onDragStart(object)}
                                        onDoubleClick={onDoubleClick(object)}
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
                                        <Item
                                            object={object}
                                            enabled={open}
                                            hovered={object === hoverObject}
                                            selected={object === selectObject}
                                            onMouseEnter={onMouseEnter(object)}
                                            onMouseDown={onMouseDown(object)}
                                            onDragStart={onDragStart(object)}
                                            onDoubleClick={onDoubleClick(object)}
                                            key={i}
                                            ref={refsMap.get(object)}
                                        />
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                    <div className={styles.menu}>
                        <div className={classnames(styles.wing, styles.left)} onClick={menuLeft}>
                            <img className={styles.arrow} src="./images/chevron3.svg" />
                            <div className={styles.text}>Season</div>
                        </div>
                        <div className={classnames(styles.wing, styles.right)} onClick={menuRight}>
                            <div className={styles.text}>Land</div>
                            <img className={styles.arrow} src="./images/chevron3.svg" />
                        </div>
                        <div className={styles.section}>
                            <div className={styles.subheading}>
                                <h2>Account</h2>
                            </div>
                        </div>
                    </div>
                    <div className={styles.menu}>
                        <div className={classnames(styles.wing, styles.left)} onClick={menuLeft}>
                            <img className={styles.arrow} src="./images/chevron3.svg" />
                            <div className={styles.text}>Account</div>
                        </div>
                        <div className={classnames(styles.wing, styles.right)} onClick={menuRight}>
                            <div className={styles.text}>Inventory</div>
                            <img className={styles.arrow} src="./images/chevron3.svg" />
                        </div>
                        <div className={styles.section}>
                            <div className={styles.subheading}>
                                <h2>Land</h2>
                            </div>
                        </div>
                    </div>
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
                open={open}
                spritesheet={spritesheet}
            />
        </div>
    );
};