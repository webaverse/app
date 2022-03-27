
import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
import metaversefile from 'metaversefile';
import styles from './character-select.module.css';
import { AppContext } from '../../app';
import { MegaHup } from '../../../MegaHup.jsx';
import { LightArrow } from '../../../LightArrow.jsx';
import { world } from '../../../../world.js';
import { NpcPlayer } from '../../../../character-controller.js';

//

const userTokenCharacters = Array(7);
for (let i = 0; i < userTokenCharacters.length; i++) {
    userTokenCharacters[i] = {
        name: '',
        imgSrc: '',
        class: '',
    };
}
const characters = {
    upstreet: [
        {
            name: 'Scillia',
            imgSrc: './characters/scillia.png',
            vrmSrc: './avatars/scillia_drophunter_v15_vian.vrm',
            class: 'Drop Hunter',
        },
        {
            name: 'Drake',
            imgSrc: './characters/drake.png',
            vrmSrc: './avatars/Drake_hacker_v8_Guilty.vrm',
            class: 'Neural Hacker',
        },
        {
            name: 'Hyacinth',
            imgSrc: './characters/hyacinth.png',
            vrmSrc: './avatars/hya_influencer_v2_vian.vrm',
            class: 'Beast Painter',
        },
        {
            name: 'Juniper',
            imgSrc: './characters/juniper.png',
            vrmSrc: './avatars/jun_engineer_v1_vian.vrm',
            class: 'Academy Engineer',
        },
        {
            name: 'Anemone',
            imgSrc: './characters/anemone.png',
            vrmSrc: './avatars/ann.vrm',
            class: 'Lisk Witch',
        },
    ],
};

//

const Character = forwardRef(({
    character,
    highlight,
    animate,
    disabled,
    onMouseEnter,
    onClick
}, ref) => {
    return (
        <li
            className={classnames(
                styles.item,
                highlight ? styles.highlight : null,
                animate ? styles.animate : null,
                disabled ? styles.disabled : null,
            )}
            onMouseEnter={e => {
                if (!disabled) {
                    onMouseEnter(e);
                }
            }}
            onClick={e => {
                if (!disabled) {
                    onClick(e);
                }
            }}
            ref={ref}
        >
            {character?.imgSrc ? <img className={styles.img} src={character.imgSrc} /> : null}
            <div className={styles.wrap}>
                <div className={styles.name}>{character?.name ?? ''}</div>
                <div className={styles.class}>{character?.class ?? ''}</div>
            </div>
        </li>
    );
});

export const CharacterSelect = () => {
    const { state, setState } = useContext( AppContext );
    const [ highlightCharacter, setHighlightCharacter ] = useState(null);
    const [ selectCharacter, setSelectCharacter ] = useState(null);
    const [ arrowPosition, setArrowPosition ] = useState(null);
    const [ npcPlayer, setNpcPlayer ] = useState(null);
    const [ npcPlayerCache, setNpcPlayerCache ] = useState(new Map());

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

    const targetCharacter = selectCharacter || highlightCharacter;
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
    }, [opened, targetCharacter]);

    return (
        <div className={styles.characterSelect}>
            <div className={classnames(styles.menu, opened ? styles.open : null)}>
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
                                onMouseEnter={() => {
                                    setHighlightCharacter(character);
                                }}
                                onClick={e => {
                                    setSelectCharacter(character);
                                    setTimeout(() => {
                                        setSelectCharacter(null);
                                    }, 2000);
                                }}
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
                                    animate={selectCharacter === character}
                                    disabled={!character.name || (!!selectCharacter && selectCharacter !== character)}
                                    onMouseEnter={() => {
                                        setHighlightCharacter(character);
                                    }}
                                    onClick={e => {
                                        if (character && npcPlayer) {
                                            setSelectCharacter(character);

                                            (async () => {
                                                const localPlayer = await metaversefile.useLocalPlayer();
                                                await localPlayer.setAvatarUrl(character.vrmSrc);
                                            })();

                                            setTimeout(() => {
                                                setState({ openedPanel: null });
                                            }, 1000);
                                        }
                                    }}
                                    key={i}
                                    ref={refsMap.get(character)}
                                />
                            );
                        })}
                        <LightArrow
                            enabled={!!arrowPosition}
                            animate={!!selectCharacter}
                            x={arrowPosition?.[0] ?? 0}
                            y={arrowPosition?.[1] ?? 0}
                        />
                    </ul>
                </div>
            </div>

            <MegaHup
              open={opened}
              npcPlayer={opened ? npcPlayer : null}
            />
        </div>
    );
};