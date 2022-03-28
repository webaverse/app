import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
// import metaversefile from 'metaversefile';
import styles from './inventory.module.css';
import { AppContext } from '../../app';
import { MegaHotBox } from '../../play-mode/mega-hotbox';
// import { LightArrow } from '../../../LightArrow.jsx';
import spritesheetManager from '../../../../spritesheet-manager.js';

//

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
            level: 4,
        },
    ],
};

//

const InventoryObject = forwardRef(({
    object,
}, ref) => {
    const [ spritesheet, setSpritesheet ] = useState(null);
    const canvasRef = useRef();

    const size = 2048;
    const numFrames = 128;
    const numFramesPow2 = Math.pow(2, Math.ceil(Math.log2(numFrames)));
    const numFramesPerRow = Math.ceil(Math.sqrt(numFramesPow2));
    const frameSize = size / numFramesPerRow;
    const frameLoopTime = 2000;
    const frameTime = frameLoopTime / numFrames;

    useEffect(() => {
        if (object?.start_url) {
            let live = true;
            (async () => {
                const {name, start_url} = object;
                const spritesheet = await spritesheetManager.getSpriteSheetForAppUrl(start_url, {
                    size,
                    numFrames,
                });
                // console.log('load spritesheet', spritesheet);
                if (!live) {
                    return;
                }
                setSpritesheet(spritesheet);
            })();
            return () => {
              live = false;
            };
        }
    }, [object]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && spritesheet) {
            const ctx = canvas.getContext('2d');
            const imageBitmap = spritesheet.result;
            // console.log('render image bitmap', imageBitmap, size, canvas.width, canvas.height);
            // ctx.drawImage(imageBitmap, 0, 0, size, size, 0, 0, canvas.width, canvas.height);

            let frameIndex = 0;
            const _recurse = () => {
                const x = (frameIndex % numFramesPerRow) * frameSize;
                const y = size - frameSize - Math.floor(frameIndex / numFramesPerRow) * frameSize;
                frameIndex = (frameIndex + 1) % numFrames;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(imageBitmap, x, y, frameSize, frameSize, 0, 0, canvas.width, canvas.height);
            };
            const interval = setInterval(_recurse, frameTime);
            return () => {
                clearInterval(interval);
            };
        }
    }, [canvasRef, spritesheet]);

    return (
        <div className={styles.inventoryObject} ref={ref}>

            <div className={styles.background} />
            <div className={styles.highlight} />

            <canvas
                className={styles.canvas}
                width={frameSize}
                height={frameSize}
                ref={canvasRef}
            />

            <div className={styles.row}>
                <div className={styles.name}>{object?.name}</div>
                <div className={styles.level}>Lv. {object?.level}</div>
            </div>

        </div>
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