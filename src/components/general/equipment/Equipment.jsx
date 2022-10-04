import React, {
  forwardRef,
  useEffect,
  useState,
  useRef,
  useContext,
} from 'react';
import classnames from 'classnames';
import styles from './equipment.module.css';
import {AppContext} from '../../app';
import {MegaHotBox} from '../../play-mode/mega-hotbox';
import {CachedLoader} from '../../../CachedLoader.jsx';
import {Spritesheet} from '../spritesheet/';
import {createLandIcon} from '../../../../land-iconer.js';
import game from '../../../../game.js';
import {transparentPngUrl} from '../../../../constants.js';
import * as sounds from '../../../../sounds.js';
import {mod} from '../../../../util.js';
import dropManager from '../../../../drop-manager';
import cardsManager from '../../../../cards-manager.js';
import useSolanaNFTContract from '../../../hooks/useSolanaNFTContract';

//

const size = 2048;
const numFrames = 128;
const width = 400;

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
      description:
        'A nature-themed bow. It seems unbelievably magical for some reason.',
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
    renderPosition: [0, 0, 0],
    minLodRange: 3,
    lods: 1,
    clipRange: [
      [-32, 0, -32],
      [32, 128, 32],
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

const LandImage = ({object, size, enabled}) => {
  const [rendered, setRendered] = useState(false);
  const canvasRef = useRef();

  const pixelRatio = window.devicePixelRatio;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && enabled && !rendered) {
      (async () => {
        const {seed, renderPosition, lods, minLodRange, clipRange} = object;
        /* console.log('create image bitmap', {
                    seed,
                    lods,
                    minLodRange,
                    clipRange,
                }); */
        const imageBitmap = await createLandIcon({
          seed,
          renderPosition,
          lods,
          minLodRange,
          clipRange,
          width: size * pixelRatio,
          height: size * pixelRatio,
        });
        // console.log('got image bitmap', imageBitmap);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
      })();

      setRendered(true);
    }
  }, [canvasRef.current, enabled, rendered]);

  return (
    <canvas
      className={styles.canvas}
      width={size}
      height={size}
      ref={canvasRef}
    />
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
      <LandImage object={object} size={size} enabled={enabled} />
    </div>
  );
};

const EquipmentItems = ({
  leftText,
  rightText,
  sections,
  open,
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
  return (
    <div className={styles.menu}>
      <div className={classnames(styles.wing, styles.left)} onClick={menuLeft}>
        <img className={styles.arrow} src="./images/chevron3.svg" />
        <div className={styles.text}>{leftText}</div>
      </div>
      <div
        className={classnames(styles.wing, styles.right)}
        onClick={menuRight}
      >
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
              {tokens.map((object, i) => (
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
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export const Equipment = () => {
  const {state, account} = useContext(AppContext);
  const [hoverObject, setHoverObject] = useState(null);
  const [selectObject, setSelectObject] = useState(null);
  const [ inventoryObject, setInventoryObject ] = useState([]);
  // const [ spritesheet, setSpritesheet ] = useState(null);
  const [faceIndex, setFaceIndex] = useState(1);
  const {mintSolanaNFT, getNftsForOwner} = useSolanaNFTContract(account.currentAddress);
  const { selectedChain, supportedChain } = useContext(ChainContext)
  const [claims, setClaims] = useState([]);
  const [cachedLoader, setCachedLoader] = useState(
    () =>
      new CachedLoader({
        async loadFn(url, value, {signal}) {
          const {start_url} = value;
          const imageBitmap = await cardsManager.getCardsImage(start_url, {
            width,
            signal,
          });
          return imageBitmap;
        },
      }),
  );
  const [loading, setLoading] = useState(false);
  const [imageBitmap, setImageBitmap] = useState(null);

  const selectedMenuIndex = mod(faceIndex, 4);

  const open = state.openedPanel === 'CharacterPanel';

  useEffect(() => {
    if(open) {
        console.log("inventory tab open", account.walletType)
        async function setupInventory() {  // NFT inventory
            let inventoryItems;
            if(account.walletType == "metamask") {
                inventoryItems = [];
            }

            if(account.walletType == "phantom") {
                inventoryItems = [];
                const tokens = await getNftsForOwner('Assest')
                console.log("inventory tokens", tokens)
                inventoryItems = tokens.map((token, id) => {
                    return {
                        tokenId: token.tokenId,
                        name: token.name ?? "",
                        start_url: token.image,
                        level: token.level ?? 1,
                        // type: "major",
                        type: "minor",
                        claimed: true
                    };
                });

            }

            console.log("inventory items", inventoryItems)
            setInventoryObject(inventoryItems);
        }

        setupInventory().catch((error)=> {
            console.warn('unable to retrieve inventory')
            setInventoryObject([]);
        });
    }

  }, [open, state.openedPanel, claims]);

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
          const imageBitmap = await cachedLoader.loadItem(
            start_url,
            selectObject,
            {
              signal: abortController.signal,
            },
          );
          if (imageBitmap !== null) {
            setImageBitmap(imageBitmap);
          }
        })();
        setImageBitmap(null);
        return () => {
          abortController.abort();
        };
      }

      if (state.openedTab) {
        let selectedTab;
        switch (state.openedTab) {
          case 'Inventory':
            selectedTab = 0;
            break;
          case 'Account':
            selectedTab = 1;
            break;
          case 'Land':
            selectedTab = 2;
            break;
          default:
            selectedTab = 1;
            break;
        }
        const delta = selectedTab - selectedMenuIndex;
        setFaceIndex(faceIndex + delta);
        sounds.playSoundName('menuNext');
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
      <div
        className={classnames(
          styles.menus,
          open ? styles.open : null,
          selectClassName,
        )}
      >
        <div
          className={styles.scene}
          style={{
            transform: `translateX(300px) translateZ(-300px) rotateY(${
              -faceIndex * 90
            }deg) translateX(-300px)`,
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
              {
                name: 'Claimed',
                tokens: inventoryObject,
              },
            ]}
            open={faceIndex === 0}
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
            open={faceIndex === 1}
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
            open={faceIndex === 2}
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
            open={faceIndex === 3}
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

      <div
        className={classnames(
          styles.menuFooter,
          open ? styles.open : null,
          selectClassName,
        )}
      >
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
                <img
                  className={styles.img}
                  src={`./images/equipment/${imgFileName}`}
                />
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
