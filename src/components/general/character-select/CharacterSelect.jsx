
import React, { forwardRef, useEffect, useState, createRef, useContext } from 'react';
import classnames from 'classnames';
import metaversefile from 'metaversefile';
import styles from './character-select.module.css';
import { AppContext } from '../../app';
import { MegaHup } from '../../../MegaHup.jsx';
import { LightArrow } from '../../../LightArrow.jsx';
// import { world } from '../../../../world.js';
import { LocalPlayer } from '../../../../character-controller.js';
import { characterSelectManager } from '../../../../characterselect-manager.js';
import * as sounds from '../../../../sounds.js';
import { chatManager } from '../../../../chat-manager.js';
import musicManager from '../../../../music-manager.js';
import { CachedLoader } from '../../../CachedLoader.jsx';
import { RpgText } from '../../../RpgText.jsx';
import { chatTextSpeed } from '../../../../constants.js';
import { VoiceEndpointVoicer } from '../../../../voice-output/voice-endpoint-voicer.js';
import * as voices from '../../../../voices.js';
import {getVoiceEndpointUrl} from '../../../../voice-output/voice-endpoint-voicer.js';
import npcManager from '../../../../npc-manager.js'

//

function typeContentToUrl(type, content) {
if (typeof content === 'object') {
    content = JSON.stringify(content);
}
const dataUrlPrefix = 'data:' + type + ',';
return '/@proxy/' + dataUrlPrefix + encodeURIComponent(content).replace(/\%/g, '%25')//.replace(/\\//g, '%2F');
}

//

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

const Character = forwardRef(({
    character,
    highlight,
    animate,
    disabled,
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
            {character?.previewUrl ? <img className={styles.img} src={character.previewUrl} /> : null}
            <div className={styles.wrap}>
                <div className={styles.name}>{character?.name ?? ''}</div>
                <div className={styles.description}>{character?.class ?? ''}</div>
            </div>
        </li>
    );
});

export const CharacterSelect = () => {
    const { state, setState } = useContext( AppContext );
    const [ highlightCharacter, setHighlightCharacter ] = useState(null);
    const [ selectCharacter, setSelectCharacter ] = useState(null);
    const [ highlightPack, setHighlightPack ] = useState(null);
    const [ selectPack, setSelectPack ] = useState(null);
    const [ lastTargetCharacter, setLastTargetCharacter ] = useState(null);
    const [ abortFn, setAbortFn ] = useState(null);
    const [ arrowPosition, setArrowPosition ] = useState(null);
    const [ enabled, setEnabled ] = useState(false);
    const [ npcPlayer, setNpcPlayer ] = useState(null);
    const [ npcLoader, setNpcLoader ] = useState(() => new CachedLoader({
        loadFn: async (url, targetCharacter, {signal = null} = {}) => {
            let live = true;
            signal.addEventListener('abort', () => {
                live = false;
            });

            let detachedCharacter = JSON.parse(JSON.stringify(targetCharacter));
            detachedCharacter.detached = true;
            const app = await metaversefile.createAppAsync({
                start_url: typeContentToUrl('application/npc', detachedCharacter),
            });
            return npcManager.getNpcByApp(app);
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
    const [charactersMap, setCharactersMap] = useState({});
    const [refsMap, setRefsMap] = useState(new Map());
    // const [ messageAudioCache, setMessageAudioCache ] = useState(new Map());
    // const [ selectAudioCache, setSelectAudioCache ] = useState(new Map());
    const [ text, setText ] = useState('');

    useEffect(() => {
        const refsMap = (() => {
            const map = new Map();
            for (const userTokenCharacter of userTokenCharacters) {
                map.set(userTokenCharacter, createRef(null));
            }
            for (const k in charactersMap) {
                for (const character of charactersMap[k]) {
                    map.set(character, createRef(null));
                }
            }
            return map;
        });
        setRefsMap(refsMap);
    }, [charactersMap]);

    const targetCharacter = selectCharacter || highlightCharacter;
    const targetPack = selectPack || highlightPack;
    const _updateArrowPosition = () => {
        if (targetCharacter) {
            const ref = refsMap.get(targetCharacter);
            const el = ref.current;
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
            setNpcPlayer(null);
            setHighlightCharacter(null);
            setSelectCharacter(null);
            setHighlightPack(null);
            setSelectPack(null);
            setArrowPosition(null);
            setText('');
        }
    }, [opened, enabled]);
    useEffect(() => {
        characterSelectManager.loadCharactersMap().then((result) => {
            const charactersMap = result;
            setCharactersMap(charactersMap);
        });
    }, []);
    
    const onMouseMove = (character, packName) => e => {
        if (enabled) {
            setHighlightCharacter(character);
            setHighlightPack(packName);
        }
    };
    const onClick = (character, packName) => e => {
        if (character && !selectCharacter) {
            setSelectCharacter(character);
            setSelectPack(packName);

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

    return (
        <div className={styles.characterSelect}>
            <div
                className={classnames(styles.menu, opened ? styles.open : null)}
            >
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
                                animate={selectCharacter === character}
                                disabled={!character.name || (!!selectCharacter && selectCharacter !== character)}
                                onMouseMove={onMouseMove(character, 'tokens')}
                                onClick={onClick(character, 'tokens')}
                                key={i}
                                ref={refsMap.get(character)}
                            />
                        )}
                    </ul>
                </div>
                {Object.keys(charactersMap).map((packName) => {
                    return (
                        <div className={styles.section} key={packName}>
                            <div className={styles.subheading}>
                                <h2>From {packName}</h2>
                            </div>
                            <ul className={styles.list}>
                                {charactersMap[packName].map((character, i) => {
                                    return (
                                        <Character
                                            character={character}
                                            highlight={character === targetCharacter}
                                            animate={selectCharacter === character}
                                            disabled={!character.name || (!!selectCharacter && selectCharacter !== character)}
                                            onMouseMove={onMouseMove(character, packName)}
                                            onClick={onClick(character, packName)}
                                            key={i}
                                            ref={refsMap.get(character)}
                                        />
                                    );
                                })}
                                <LightArrow
                                    enabled={!!arrowPosition && targetPack === packName}
                                    animate={!!selectCharacter}
                                    x={arrowPosition?.[0] ?? 0}
                                    y={arrowPosition?.[1] ?? 0}
                                />
                            </ul>
                        </div>
                    );
                })}
                {(opened && text) ? (
                    <RpgText className={styles.text} styles={styles} text={text} textSpeed={chatTextSpeed} />
                ) : null}
            </div>
        </div>
    );
};