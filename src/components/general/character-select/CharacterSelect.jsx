
import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
import metaversefile from 'metaversefile';
import styles from './character-select.module.css';
import { AppContext } from '../../app';
import { MegaHup } from '../../../MegaHup.jsx';
import { LightArrow } from '../../../LightArrow.jsx';
import { world } from '../../../../world.js';
// import { NpcPlayer } from '../../../../character-controller.js';
import * as sounds from '../../../../sounds.js';
import musicManager from '../../../../music-manager.js';

//

const userTokenCharacters = Array(7);
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
    const [ arrowPosition, setArrowPosition ] = useState(null);
    const [ npcPlayer, setNpcPlayer ] = useState(null);
    const [ enabled, setEnabled ] = useState(false);
    const [ npcPlayerCache, setNpcPlayerCache ] = useState(new Map());
    const [ themeSongCache, setThemeSongCache ] = useState(new WeakMap());

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
            const {avatarUrl} = targetCharacter;

            let live = true;
            let npcPlayer = npcPlayerCache.get(avatarUrl);
            (async () => {
                if (!npcPlayer) {
                    const avatarApp = await metaversefile.createAppAsync({
                        // type: 'application/npc',
                        // content: targetCharacter,
                        start_url: targetCharacter.avatarUrl,
                        components: [
                            {
                              key: 'npc',
                              value: targetCharacter,
                            },
                        ],
                    });
                    if (!live) {
                        avatarApp.destroy();
                        return;
                    }
                    // console.log('got avatar app', avatarApp, targetCharacter);
                    // debugger;
                    npcPlayer = avatarApp.npcPlayer;
                    // npcPlayer = new NpcPlayer();
                    // npcPlayer.setAvatarApp(avatarApp);

                    npcPlayerCache.set(avatarUrl, npcPlayer);
                }

                sounds.playSoundName('menuClick');

                let themeSong = themeSongCache.get(npcPlayer);
                if (!themeSong) {
                    themeSong = await npcPlayer.fetchThemeSong();
                    themeSongCache.set(npcPlayer, themeSong);
                    if (!live) return;
                }
                musicManager.playCurrentMusic(themeSong);

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
    }, [opened, enabled]);
    
    const onMouseMove = character => e => {
        if (enabled) {
            setHighlightCharacter(character);
        }
    };
    const onClick = character => e => {
        if (character && npcPlayer) {
            setSelectCharacter(character);

            sounds.playSoundName('menuBoop');

            (async () => {
                const localPlayer = metaversefile.useLocalPlayer();
                await localPlayer.setPlayerSpec(character.avatarUrl, character);
            })();

            setTimeout(() => {
                setState({ openedPanel: null });
            }, 1000);
        }
    };

    return (
        <div className={styles.characterSelect}>
            <div
                className={classnames(styles.menu, opened ? styles.open : null)}
            >
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
                                    animate={selectCharacter === character}
                                    disabled={!character.name || (!!selectCharacter && selectCharacter !== character)}
                                    onMouseMove={onMouseMove(character)}
                                    onClick={onClick(character)}
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