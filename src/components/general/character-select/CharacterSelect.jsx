import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
import metaversefile from 'metaversefile';
import styles from './character-select.module.css';
import { AppContext } from '../../app';
import { MegaHup } from '../../../MegaHup.jsx';
import { LightArrow } from '../../../LightArrow.jsx';
import { world } from '../../../../world.js';
import { LocalPlayer } from '../../../../character-controller.js';
import * as sounds from '../../../../sounds.js';
import { chatManager } from '../../../../chat-manager.js';
import musicManager from '../../../../music-manager.js';
import { CachedLoader } from '../../../CachedLoader.jsx';
import { RpgText } from '../../../RpgText.jsx';
import { chatTextSpeed } from '../../../../constants.js';
import { VoiceEndpointVoicer, getVoiceEndpointUrl } from '../../../../voice-output/voice-endpoint-voicer.js';
import * as voices from '../../../../voices.js';

//
import { loadCryptoAvatarsCharacters } from './cryptoavatars-loader.js';
import { getMainnetAddress } from '../../../../blockchain.js';
import npcManager from '../../../../npc-manager.js';

function typeContentToUrl(type, content) {
    if (typeof content === 'object') {
        content = JSON.stringify(content);
    }
    const dataUrlPrefix = 'data:' + type + ',';
    return '/@proxy/' + dataUrlPrefix + encodeURIComponent(content).replace(/\%/g, '%25')//.replace(/\\//g, '%2F');
}

const userTokenCharacters = Array(5);
for (let i = 0; i < userTokenCharacters.length; i++) {
    userTokenCharacters[i] = {
        name: '',
        previewUrl: '',
        avatarUrl: '',
        voice: '',
        class: '',
        bio: '',
    };
}
const characters = {
    upstreet: [
        {
            name: 'Scillia',
            previewUrl: './images/characters/upstreet/small/scillia.png',
            avatarUrl: './avatars/scillia_drophunter_v15_vian.vrm',
            voice: `Sweetie Belle`,
            voicePack: `ShiShi voice pack`,
            class: 'Drop Hunter',
            bio: `Her nickname is Scilly or SLY. 13/F drop hunter. She is an adventurer, swordfighter and fan of potions. She is exceptionally skilled and can go Super Saiyan.`,
            themeSongUrl: `https://webaverse.github.io/music/themes/149274046-smooth-adventure-quest.mp3`,
            // "Scilly is short for "Saga Cybernetic Lifeform Interface" or SLY. It's a complicated name, but it means I'm the best at what I do: Collecting data from living organisms and machines to help my development.)"
            // "She's not like other girls. She doesn't spend her time talking about boys, or clothes, or anything else that isn't important. No, she spends her time adventuring, swordfighting and looking for new and interesting potions to try."
            // "I'm not saying I don't like boys, but they're just not as interesting as swords."
            detached: true,
        },
        {
            name: 'Drake',
            previewUrl: './images/characters/upstreet/small/drake.png',
            avatarUrl: './avatars/Drake_hacker_v8_Guilty.vrm',
            voice: `Shining Armor`,
            voicePack: `Andrew voice pack`,
            class: 'Neural Hacker',
            bio: `His nickname is DRK. 15/M hacker. Loves guns. Likes plotting new hacks. He has the best equipment and is always ready for a fight.`,
            themeSongUrl: `https://webaverse.github.io/music/themes/129079005-im-gonna-find-it-mystery-sci-f.mp3`,
            detached: true,
        },
        {
            name: 'Hyacinth',
            previewUrl: './images/characters/upstreet/small/hyacinth.png',
            avatarUrl: './avatars/hya_influencer_v2_vian.vrm',
            voice: `Maud Pie`,
            voicePack: `Tiffany voice pack`,
            class: 'Beast Painter',
            bio: `Scillia's mentor. 15/F beast tamer. She is quite famous. She is known for releasing beasts on her enemies when she get angry.`,
            themeSongUrl: `https://webaverse.github.io/music/themes/092909594-fun-electro-dance-groove-racin.mp3`,
            detached: true,
        },
        {
            name: 'Juniper',
            previewUrl: './images/characters/upstreet/small/juniper.png',
            avatarUrl: './avatars/jun_engineer_v1_vian.vrm',
            voice: `Cadance`,
            voicePack: `Tiffany voice pack`,
            class: 'Academy Engineer',
            bio: `She is an engineer. 17/F engineer. She is new on the street. She has a strong moral compass and it the voice of reason in the group.`,
            themeSongUrl: `https://webaverse.github.io/music/themes/092958842-groovy-jazzy-band-fun-light-su.mp3`,
            detached: true,
        },
        {
            name: 'Anemone',
            previewUrl: './images/characters/upstreet/small/anemone.png',
            avatarUrl: './avatars/ann.vrm',
            voice: `Trixie`,
            voicePack: `ShiShi voice pack`,
            class: 'Lisk Witch',
            bio: `A witch studying to make the best potions. 13/F. She is exceptionally skilled and sells her potions on the black market, but she is very shy.`,
            themeSongUrl: `https://webaverse.github.io/music/themes/158618260-ghost-catcher-scary-funny-adve.mp3`,
            detached: true,
        },
    ],
};

//

const Character = forwardRef(({
    character,
    highlight,
    animate,
    disabled,
    targetCharacter,
    onMouseMove,
    onClick,
}, ref) => {
    return (
        <li
            className={classnames(
                styles.item,
                highlight ? styles.highlight : null,
                animate ? styles.animate : null,
                disabled ? styles.disabled : null,
                character.name
            )}
            onMouseMove={e => {
                if (!disabled) {
                    onMouseMove(e);
                }
            }}
            onClick={e => {
                if (!disabled) {
                    onClick(e);
                }
            }}
            ref={ref}
        >
            {character && character.previewUrl ? (
                <img
                    crossOrigin="anonymous"
                    className={styles.img}
                    src={character.previewUrl}
                />
            ) : null}
            {character && character.canBeUsed === false ? (
                <img className={styles.disabled} src=" ./images/disabled.png" />
            ) : null}
            <div className={styles.wrap}>
                <div className={styles.name}>{(character && character.name) || ''}</div>
                <div className={styles.description}>{(character && character.class) || ''}</div>
            </div>
            <LightArrow visible={targetCharacter === character} />
        </li>
    );
  }
);

export const CharacterSelect = () => {
    const { state, setState } = useContext( AppContext );
    const [ highlightCharacter, setHighlightCharacter ] = useState(null);
    const [ selectCharacter, setSelectCharacter ] = useState(null);
    const [ arrowPosition, setArrowPosition ] = useState(null);
    const [ arrowPosition2, setArrowPosition2 ] = useState(null);
    const [ npcPlayer, setNpcPlayer ] = useState(null);
    const [ abortFn, setAbortFn ] = useState(null);
    const [ enabled, setEnabled ] = useState(false);
    const [ lastTargetCharacter, setLastTargetCharacter ] = useState(null);
    const [ npcLoader, setNpcLoader ] = useState(() => new CachedLoader({
        loadFn: async (url, targetCharacter, {signal = null} = {}) => {
            let live = true;
            signal.addEventListener('abort', () => {
                live = false;
            });

            const npcApp = await metaversefile.createAppAsync({
                start_url: typeContentToUrl('application/npc', {...targetCharacter, detached: true}),
            });
            return npcApp.npcPlayer;
        },
    }));
    const [ themeSongLoader, setThemeSongLoader ] = useState(() => new CachedLoader({
        loadFn: async (url, targetCharacter, {signal = null} = {}) => {
            let live = true;
            signal.addEventListener('abort', () => {
              live = false;
            });
            themeSong = await LocalPlayer.fetchThemeSong(targetCharacter.themeSongUrl);
            if (!live) return;
            return themeSong;
        },
    }));
    const [ characterIntroLoader, setCharacterIntroLoader ] = useState(() => new CachedLoader({
        loadFn: async (url, targetCharacter, {signal = null} = {}) => {
            // get ai text
            let live = true;
            signal.addEventListener('abort', () => {
                live = false;
            });
            const loreAIScene = metaversefile.useLoreAIScene();
            const [
                characterIntro,
                _voices,
            ] = await Promise.all([
                loreAIScene.generateCharacterIntroPrompt(targetCharacter.name, targetCharacter.bio),
                voices.waitForLoad(),
            ]);
            if (!live) return;

            // preload audio
            const voiceEndpoint = voices.voiceEndpoints.find(voiceEndpoint => voiceEndpoint.name === targetCharacter.voice);
            if (!voiceEndpoint) {
                throw new Error('no such voice endpoint: ' + targetCharacter.voice);
            }
            const voiceEndpointUrl = getVoiceEndpointUrl(voiceEndpoint.drive_id);
            const preloadedMessage = VoiceEndpointVoicer.preloadMessage(voiceEndpointUrl, characterIntro.message);
            const preloadedOnSelectMessage = VoiceEndpointVoicer.preloadMessage(voiceEndpointUrl, characterIntro.onselect);
            
            // return result
            return {
                characterIntro,
                preloadedMessage,
                preloadedOnSelectMessage,
            };
        },
    }));
    // const [ messageAudioCache, setMessageAudioCache ] = useState(new Map());
    // const [ selectAudioCache, setSelectAudioCache ] = useState(new Map());
    const [ text, setText ] = useState('');
    const [cryptoAvatars, setCryptoAvatars] = useState([]);

    const refsMap = (() => {
        const map = new Map();
        for (const userTokenCharacter of userTokenCharacters) {
            map.set(userTokenCharacter, useRef(null));
        }
        for (const k in characters) {
            for (const character of characters[k]) {
                map.set(character, useRef(null));
            }
        }
        return map;
    })();

    const [ npcPlayerCache, setNpcPlayerCache ] = useState(new Map());

    const [caPagination, setCaPagination] = useState({});
    const [caItemsPerPage, setCaItemsPerPage] = useState(5);
    const [caCollection, setCaCollection] = useState(
        '0xc1def47cf1e15ee8c2a92f4e0e968372880d18d1'
    );
    const [caOwnership, setCaOwnership] = useState(null);
    const [scaleViewValue, setScaleViewValue] = useState(1);

    const targetCharacter = selectCharacter || highlightCharacter;

    const _updateArrowPosition = () => {
        if (targetCharacter) {
            const ref = refsMap.get(targetCharacter);
            const el = ref?.current;
            if (el) {
                const rect = el.getBoundingClientRect();
                const parentRect = el.offsetParent.getBoundingClientRect();
                setArrowPosition([
                    Math.floor(rect.left - parentRect.left + rect.width / 2 + 40),
                    Math.floor(rect.top - parentRect.top + rect.height / 2),
                ]);
            } else {
                setArrowPosition(null);
            }
        } else {
            setArrowPosition(null);
        }
    };
    useEffect(() => {
        _updateArrowPosition();
    }, [targetCharacter]);
    useEffect(() => {
        if (targetCharacter && targetCharacter !== lastTargetCharacter) {
            if (abortFn) {
                abortFn();
            }

            const {avatarUrl} = targetCharacter;

            const abortController = new AbortController();
            const {signal} = abortController;
            let live = true;
            signal.addEventListener('abort', () => {
                live = false;

                setText('');
                setNpcPlayer(null);
            });
            
            const loadNpcPromise = (async () => {
                const npcPlayer = await npcLoader.loadItem(avatarUrl, targetCharacter, {
                    signal,
                });
                return npcPlayer;
            })()
            const loadThemeSongPromise = (async () => {
                const themeSong = await themeSongLoader.loadItem(avatarUrl, targetCharacter, {
                    signal,
                });
                if (!live) return;
                if (themeSong) {
                  musicManager.playCurrentMusic(themeSong);
                }
            })();
            const loadCharacterIntroPromise = (async () => {
                const result = await characterIntroLoader.loadItem(avatarUrl, targetCharacter, {
                    signal,
                });
                if (result) {
                    const npcPlayer = await loadNpcPromise;
                    if (!live) return;

                    const {
                        characterIntro,
                        preloadedMessage,
                    } = result;
                    const {message} = characterIntro;
                    setText(message);

                    await chatManager.waitForVoiceTurn(() => {
                        if (live) {
                            const abort = () => {
                                npcPlayer.voicer.stop();
                            };
                            signal.addEventListener('abort', abort);
                            const endPromise = npcPlayer.voicer.start(preloadedMessage);
                            return endPromise.then(() => {
                                signal.removeEventListener('abort', abort);
                            });
                        }
                    });
                } else {
                    console.warn('no character intro');

                    setText('');
                }
            })();

            loadNpcPromise.then(npcPlayer => {
                if (live) {
                    setNpcPlayer(npcPlayer);
                }
            });

            const localAbortFn = () => {
                abortController.abort();
            }
            setAbortFn(() => localAbortFn);
            setLastTargetCharacter(targetCharacter);
        }
    }, [targetCharacter, lastTargetCharacter, abortFn]);
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
    }, [opened, targetCharacter]);
    useEffect(() => {
        if (opened && !enabled) {
            const timeout = setTimeout(() => {
                setEnabled(true);
            }, 300);
            return () => {
                clearTimeout(timeout);
            };
        } else if (!opened && enabled) {
            setEnabled(false);
        }
        if (!opened) {
            setHighlightCharacter(null);
            setSelectCharacter(null);
            setArrowPosition(null);
            setText('');
        }
    }, [opened, enabled]);

    const onMouseMove = character => e => {
        if (enabled) {
            setHighlightCharacter(character);
        }
    };
    const onClick = character => e => {
        if (character && !selectCharacter) {
            setSelectCharacter(character);

            sounds.playSoundName('menuBoop');

            setTimeout(() => {
                setState({ openedPanel: null });
            }, 1000);

            (async () => {
                const localPlayer = metaversefile.useLocalPlayer();
                const [
                  _setPlayerSpec,
                  result,
                ] = await Promise.all([
                    localPlayer.setPlayerSpec(character),
                    characterIntroLoader.loadItem(character.avatarUrl, character, {
                        // signal,
                    }),
                ]);
                
                if (result) {
                    const {preloadedOnSelectMessage} = result;

                    npcPlayer && npcPlayer.voicer.stop();
                    const localPlayer = metaversefile.useLocalPlayer();
                    localPlayer.voicer.stop();
                    await chatManager.waitForVoiceTurn(() => {
                        return localPlayer.voicer.start(preloadedOnSelectMessage);
                    });
                }
            })();
        }
    };

    /** ------------------------- CRYPTOAVATARS IMPLEMENTATION ------------------------ */
    const getCryptoAvatars = async (
        url = undefined,
        itemsPerPage = caItemsPerPage
    ) => {
            const caResponse = await loadCryptoAvatarsCharacters(
            url,
            caOwnership,
            caCollection,
            itemsPerPage
        );
        setCaPagination(caResponse.pagination);
        setCryptoAvatars(caResponse.avatars);
        return caResponse.avatars;
    };

    const caSelectCollection = (event) => {
        setCaCollection(event.target.value);
    };

    const changeCaItemsPerPage = (event) => {
        setCaItemsPerPage(event.target.value);
    };

    const caNavigation = (event) => {
        if (event.target.value === 'next') getCryptoAvatars(caPagination.next);
        else getCryptoAvatars(caPagination.prev);
    };

    const caAvatarsFilter = async (event) => {
        if (event.target.value === 'all') {
        setCaOwnership(null);
        return;
        }

        if (event.target.value === 'owned') {
        const userAddress = await getMainnetAddress();
        if (userAddress) setCaOwnership(userAddress.toLowerCase());
        return;
        }

        setCaOwnership('free');
    };

    useEffect(() => {
        getCryptoAvatars();
    }, [caCollection, caOwnership, caItemsPerPage]);
    /** ------------------------------------------------------------------------------- */

    return (
        <div className={styles.characterSelect}>
            <div className={classnames(styles.menu, opened ? styles.open : null)}>
                <MegaHup
                    open={opened}
                    npcPlayer={opened ? npcPlayer : null}
                />
                <div className={styles.heading}>
                <h1>Character select</h1>
                </div>
                <div className={styles.section}>
                    <div className={styles.subheading}>
                        <h2>Tokens</h2>
                    </div>
                    <ul className={styles.list}>
                        {userTokenCharacters.map((character, i) =>
                            <Character
                                character={character}
                                highlight={character === targetCharacter}
                                targetCharacter={targetCharacter}
                                animate={selectCharacter === character}
                                disabled={!character.name || (!!selectCharacter && selectCharacter !== character)}
                                onMouseMove={onMouseMove(character)}
                                onClick={onClick(character)}
                                key={i}
                                ref={refsMap.get(character)}
                            />
                        )}
                    </ul>
                </div>
                <div className={styles.section}>
                    <div className={styles.subheading}>
                        <h2>From Upstreet</h2>
                    </div>
                    <ul className={styles.list}>
                        {characters.upstreet.map((character, i) => {
                            return (
                                <Character
                                    character={character}
                                    highlight={character === targetCharacter}
                                    targetCharacter={targetCharacter}
                                    animate={selectCharacter === character}
                                    disabled={!character.name || (!!selectCharacter && selectCharacter !== character)}
                                    onMouseMove={onMouseMove(character)}
                                    onClick={onClick(character)}
                                    key={i}
                                    ref={refsMap.get(character)}
                                />
                            );
                        })}
                    </ul>
                </div>
                <div className={styles.section}>
                    <div className={styles.subheading}>
                        <h2>CryptoAvatars</h2>
                        <div className={styles.cryptoavatars}>
                        <>Collection:</>
                        <div className={styles.select}>
                            <select onChange={caSelectCollection}>
                            <option value="0xc1def47cf1e15ee8c2a92f4e0e968372880d18d1">
                                CryptoAvatars ETH
                            </option>
                            <option value="0xd047666daea0b7275e8d4f51fcff755aa05c3f0a">
                                CryptoAvatars POLYGON
                            </option>
                            <option value="0x28ccbe824455a3b188c155b434e4e628babb6ffa">
                                The User Collection
                            </option>
                            </select>
                        </div>
                        <>Ownership:</>
                        <div className={styles.select}>
                            <select onChange={caAvatarsFilter}>
                            <option value="all">ALL</option>
                            <option value="owned">Owned</option>
                            <option value="opensource">Free use</option>
                            </select>
                        </div>
                        <>Avatars per page:</>
                        <div className={styles.select}>
                            <select onChange={changeCaItemsPerPage}>
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">25</option>
                            </select>
                        </div>
                        <div>
                            <>Pages </>
                            {caPagination.prev && (
                            <button
                                value="prev"
                                className={styles.button}
                                onClick={caNavigation}
                            >
                                {'<'}
                            </button>
                            )}
                            <>
                            {caPagination.currentPage || 0} / {caPagination.totalPages}
                            </>
                            {caPagination.next && (
                            <button
                                value="next"
                                className={styles.button}
                                onClick={caNavigation}
                            >
                                {'>'}
                            </button>
                            )}
                        </div>
                        </div>
                    </div>
                    <ul className={styles.list}>
                        {cryptoAvatars.length > 0 ? (
                        cryptoAvatars.map((character, i) => {
                            return (
                            <Character
                                character={character}
                                highlight={character === targetCharacter}
                                targetCharacter={targetCharacter}
                                animate={selectCharacter === character}
                                disabled={!character.name || (!!selectCharacter && selectCharacter !== character)}
                                onMouseMove={onMouseMove(character)}
                                onClick={onClick(character)}
                                key={i}
                                ref={refsMap.get(character)}
                            />
                            );
                        })
                        ) : (
                        <>No avatars found</>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};
