import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
import styles from './equipment.module.css';
import { AppContext } from '../../app';
import { MegaHotBox } from '../../play-mode/mega-hotbox';
import { CachedLoader } from '../../../CachedLoader.jsx';
import { Spritesheet } from '../spritesheet/';
import { createLandIcon } from '../../../../land-iconer.js';
import game from '../../../../game.js';
import { transparentPngUrl } from '../../../../constants.js';
import * as sounds from '../../../../sounds.js';
import { mod } from '../../../../util.js';
import useNFTContract from '../../../hooks/useNFTContract';
import { ChainContext } from '../../../hooks/chainProvider';
import dropManager from '../../../../drop-manager';
import cardsManager from '../../../../cards-manager.js';
import { isChainSupported } from '../../../hooks/useChain';

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
                <div className={styles.name}>{ object ? (object.name.length > 10) ? object.name.slice(0, 10) + ".." : object.name : ""}</div>
                <div className={styles.level}>Lv. {object?.level}</div>
            </div>

            {/* selected && loading ? <EquipmentPopover /> : null */}

        </div>
    );
};

const LandImage = ({
    object,
    size,
    enabled,
}) => {
    const [rendered, setRendered] = useState(false);
    const canvasRef = useRef();

    const pixelRatio = window.devicePixelRatio;
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && enabled && !rendered) {
            (async () => {
                const {
                    seed,
                    renderPosition,
                    lods,
                    minLodRange,
                    clipRange,
                } = object;
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
            <LandImage
                object={object}
                size={size}
                enabled={enabled}
            />
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
                        { 
                        tokens.map((object, i) => 
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
    const { state, account } = useContext( AppContext );
    const [ hoverObject, setHoverObject ] = useState(null);
    const [ selectObject, setSelectObject ] = useState(null);
    const [ inventoryObject, setInventoryObject ] = useState([]);
    const [ faceIndex, setFaceIndex ] = useState(1);
    const { selectedChain, supportedChain } = useContext(ChainContext)
    const { getTokens, mintfromVoucher } = useNFTContract(account.currentAddress);
    const [ claims, setClaims ] = useState([]);
    const [ nfts, setNfts ] = useState(null);

    const [ cachedLoader, setCachedLoader ] = useState(() => new CachedLoader({
        async loadFn(url, value, {signal}) {            
            const {start_url} = value;
            const imageBitmap = await cardsManager.getCardsImage(
                start_url,
                {
                    width,
                    signal,
                }
            );
            return imageBitmap;
        },
    }));
    const [ loading, setLoading ] = useState(false);
    const [ imageBitmap, setImageBitmap ] = useState(null);

    const selectedMenuIndex = mod(faceIndex, 4);
    
    const open = state.openedPanel === 'CharacterPanel';

    useEffect(() => {
        if (account && account.currentAddress) {
          async function queryOpensea() {
            fetch(
              `https://api.opensea.io/api/v1/assets?owner=${account.currentAddress}&limit=${50}`,
            //   `https://api.opensea.io/api/v1/assets?owner=${account.currentAddress}&limit=${50}&asset_contract_address=${}`,
             // { headers: { "X-API-KEY": "6a7ceb45f3c44c84be65779ad2907046" } }
            // WARNING: without opensea api key this API is rate-limited
             ).then((res) => res.json())
              .then(({ assets }) => { console.log('returned assets', assets); setNfts(assets); })
              .catch(() => console.warn('could not connect to opensea. the api key may have expired'));
          }
          queryOpensea();
        } else {
            console.log('could not query opensea')
        }
    }, [account]);

    useEffect(() => {
        if(open && nfts) {
            if (!supportedChain) {
                console.log("unsupported chain!");
                setInventoryObject(nfts);
                return;
            }

            async function setupInventory() {  // NFT inventory
                const tokens = await getTokens();
                const inventoryItems = tokens.map((token, id) => {
                    return {
                        name: token.name ?? "",
                        start_url: token.url ?? (token.animation_url !== "" ? token.animation_url : token.collection.banner_image_url),
                        level: token.level ?? 1,
                        type: "major",
                        claimed: true
                    };
                });
                setInventoryObject(inventoryItems);
            }

            setupInventory().catch((error)=> {
                console.warn('unable to retrieve inventory')
                setInventoryObject([]);
            });
        }

    }, [open, state.openedPanel, selectedChain, nfts, claims]);

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

    const mintClaim = async (e) => {
        await mintfromVoucher(e, () => {
        }, () => {
            dropManager.removeClaim(e);
        });
    }
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
    }, []);

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
                selectedMenuIndex={selectedMenuIndex}
                name={selectObject ? selectObject.name : null}
                selectObject={selectObject ? selectObject : null}
                description={selectObject ? selectObject.description : null}
                imageBitmap={imageBitmap}
                onActivate={onDoubleClick(selectObject)}
                mintEnabled={isChainSupported(selectedChain) && account.currentAddress}
                onMint={() => {
                    mintClaim(selectObject);
                }}
                onClose={e => {
                    setSelectObject(null);
                }}
            />
        </div>
    );
};