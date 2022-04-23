import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
import styles from './equipment.module.css';
import { AppContext } from '../../app';
import { MegaHotBox } from '../../play-mode/mega-hotbox';
import { Spritesheet } from '../spritesheet';
import game from '../../../../game.js';
import {transparentPngUrl} from '../../../../constants.js';

//

const size = 2048;
const numFrames = 128;
// const numFramesPow2 = Math.pow(2, Math.ceil(Math.log2(numFrames)));
// const numFramesPerRow = Math.ceil(Math.sqrt(numFramesPow2));
// const frameSize = size / numFramesPerRow;
// const frameLoopTime = 2000;
// const frameTime = frameLoopTime / numFrames;

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
    };
    const onMouseDown = object => () => {
        setSelectObject(selectObject !== object ? object : null);

        // game.renderCard(object);
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

    const selectedMenuIndex = 0;

    return (
        <div className={styles.equipment}>
            <div className={classnames(styles.menus, open ? styles.open : null)}>
                <div className={styles.menu}>
                    <div className={classnames(styles.wing, styles.left)}>
                        <img className={styles.arrow} src="./images/chevron2.svg" />
                        <div className={styles.text}>Inventory</div>
                    </div>
                    <div className={classnames(styles.wing, styles.right)}>
                        <div className={styles.text}>Series</div>
                        <img className={styles.arrow} src="./images/chevron2.svg" />
                    </div>
                    <div className={styles.section}>
                        <div className={styles.subheading}>
                            <h2>Tokens</h2>
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
            </div>

            <div className={classnames(styles.menuFooter, open ? styles.open : null)}>
                <div className={styles.menuFooterWrap}>
                    <div className={classnames(styles.menuFooterItem, selectedMenuIndex === 0 ? styles.selected : null)}>
                        <img className={styles.img} src="./images/equipment/noun-backpack-16741.svg" />
                    </div>
                    <div className={classnames(styles.menuFooterItem, selectedMenuIndex === 1 ? styles.selected : null)}>
                        <img className={styles.img} src="./images/equipment/noun-box-4775546.svg" />
                    </div>
                    <div className={classnames(styles.menuFooterItem, selectedMenuIndex === 2 ? styles.selected : null)}>
                        <img className={styles.img} src="./images/equipment/noun-key-1173931.svg" />
                    </div>
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