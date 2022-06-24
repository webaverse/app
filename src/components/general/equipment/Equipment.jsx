import React, {forwardRef, useEffect, useState, useRef, useContext} from 'react';
import classnames from 'classnames';
import styles from './equipment.module.css';
import { AppContext } from '../../app';
import { MegaHotBox } from '../../play-mode/mega-hotbox';
import { CachedLoader } from '../../../CachedLoader.jsx';
import { Spritesheet } from '../spritesheet/';
import { createLandIcon } from '../../../../land-iconer.js';
import game from '../../../../game.js';
import {transparentPngUrl} from '../../../../constants.js';
import * as sounds from '../../../../sounds.js';
import {mod} from '../../../../util.js';
import useNFTContract from '../../../hooks/useNFTContract';
import { ChainContext } from '../../../hooks/chainProvider';

const size = 2048;
const numFrames = 128;

const equipmentTabs = [
  'noun-backpack-16741.svg',
  'noun-box-4775546.svg',
  'noun-key-1173931.svg',
  'noun-arc-de-triomphe-4009238.svg',
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
const landTokenObjects = [
    {
        name: 'Metaveris',
        start_url: '/metaverse_components/land/',
        description: 'Starting parcel',
        seed: 'lol',
        range: [
            [-32, 0, -32],
            [32, 128, 32]
        ],
    },
];

//

const ObjectItem = ({
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
                styles.object,
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
};

const LandItem = ({
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
    const size = 200;
    const pixelRatio = window.devicePixelRatio;
    const canvasRef = useRef();
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            (async () => {
                const {
                    seed,
                    range,
                } = object;
                const imageBitmap = await createLandIcon({
                    seed,
                    range,
                    width: size * pixelRatio,
                    height: size * pixelRatio,
                });
             
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
            })();
        }
    }, [canvasRef]);

    return (
        <div
            className={classnames(
                styles.land,
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

            <canvas
                className={styles.canvas}
                width={size}
                height={size}
                ref={canvasRef}
            />

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
    ItemClass,
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
                            <ItemClass
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

export const Equipment = () => {
  const {state, setState, account} = useContext(AppContext);
  const [hoverObject, setHoverObject] = useState(null);
  const [selectObject, setSelectObject] = useState(null);
  const [spritesheet, setSpritesheet] = useState(null);
  const [inventoryObject, setInventoryObject] = useState([]);
  const [faceIndex, setFaceIndex] = useState(1);
  const selectedMenuIndex = mod(faceIndex, 4);
  const { selectedChain, supportedChain } = useContext(ChainContext)
  const {getTokens} = useNFTContract(account.currentAddress);

  useEffect(async () => {
    if (!supportedChain) {
        setInventoryObject([]);
        return;
    }
    const tokens = await getTokens();
    const inventoryItems = tokens.map((token, i) => {
      return {
        name: token.name,
        start_url: token.url,
        level: 1,
      };
    });
    setInventoryObject(inventoryItems);
  }, [state.openedPanel, selectedChain]);

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

    useEffect(() => {
        if (cachedLoader) {
            const loadingchange = e => {
                setLoading(e.data.loading);
            };
            cachedLoader.addEventListener('loadingchange', loadingchange);
            return () => {
                cachedLoader.removeEventListener('loadingchange', loadingchange);
            };
        }
    }, [cachedLoader]);

    useEffect(() => {
        if (open) {
            const start_url = selectObject ? selectObject.start_url : '';
            if (start_url) {
                const abortController = new AbortController();
                (async () => {
                    const imageBitmap = await cachedLoader.loadItem(start_url, selectObject, {
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
                        ItemClass={ObjectItem}
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
                        ItemClass={ObjectItem}
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
                        ItemClass={ObjectItem}
                    />
                    <EquipmentItems
                        leftText="Account"
                        rightText="Inventory"
                        sections={[
                            {
                                name: 'Public',
                                tokens: landTokenObjects,
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
                        ItemClass={LandItem}
                    />
                </div>
            </div>
            <div className={classnames(styles.wing, styles.right)} onClick={menuRight}>
              <div className={styles.text}>Season</div>
              <img className={styles.arrow} src="./images/chevron3.svg" />
            </div>
            <div className={styles.section}>
              <div className={styles.subheading}>
                <h2>Inventory</h2>
              </div>
              <ul className={styles.list}>
                {inventoryObject.map((object, i) =>
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
                  />,
                )}
              </ul>
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
                  />,
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
