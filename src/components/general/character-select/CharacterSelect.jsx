
import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
import styles from './character-select.module.css';
import { AppContext } from '../../app';
import { MegaHup } from '../../../MegaHup.jsx';
import { LightArrow } from '../../../LightArrow.jsx';

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
            imgSrc: 'characters/scillia.png',
            class: 'Drop Hunter',
        },
        {
            name: 'Drake',
            imgSrc: 'characters/drake.png',
            class: 'Hacker Supreme',
        },
        {
            name: 'Hyacinth',
            imgSrc: 'characters/hyacinth.png',
            class: 'Beast Painter',
        },
        {
            name: 'Juniper',
            imgSrc: 'characters/juniper.png',
            class: 'Academy Engineer',
        },
        {
            name: 'Anemone',
            imgSrc: 'characters/anemone.png',
            class: 'Lisk Witch',
        },
    ],
};

//

/* <div
        className={
                styles.character + ' ' +
                (arrowPosition === i ? styles.selected : '') + ' ' +
                ((arrowPosition === i && animation) ? styles.animate : '') + ' ' +
                ((arrowPosition === i && open) ? styles.open : '')
        }
        onMouseMove={() => {setArrowPosition2(i);}}
        onMouseDown={e => {
                setArrowDown(true);
                setTimeout(() => {
                        setArrowDown(false);
                }, 200);
        }}
        key={i}
>
        <div className={styles.inner}>
                <div className={styles.background}/>
                <div className={styles['img-wrap']}>
                        <img src={character.imgSrc} />
                </div>
                {(appScriptLoaded && characterPositions) ? <canvas className={styles.canvas} ref={canvasRef} /> : null}
                <div className={styles.wrap}>
                        <div className={styles.name}>{character.name}</div>
                        <div className={styles.class}>The {character.class}</div>
                </div>
        </div>
</div> */

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
    const [ arrowPosition, setArrowPosition ] = useState();

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
    useEffect(() => {
        if (targetCharacter) {
            const ref = refsMap.get(targetCharacter);
            const el = ref.current;
            if (el) {
                const rect = el.getBoundingClientRect();
                setArrowPosition([
                    Math.floor(rect.left + rect.width / 2),
                    Math.floor(rect.top + rect.height / 2),
                ]);
            } else {
                setArrowPosition(null);
            }
            // console.log('got ref', ref);
            // setArrowPosition([highlightCharacter.x, highlightCharacter.y]);
        } else {
            setArrowPosition(null);
        }
    }, [targetCharacter]);

    const opened = state.openedPanel === 'CharacterSelect';

    return (
        <div className={styles.characterSelect}>
            <div className={classnames(styles.menu, opened ? styles.open : null)}>
                <div className={styles.heading}>
                    <h1>Character select</h1>
                </div>
                <div className={styles.section}>
                    <div className={styles.subheading}>
                        <h2>Your Tokens</h2>
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
                                        setSelectCharacter(character);
                                        setTimeout(() => {
                                            setSelectCharacter(null);
                                        }, 2000);
                                    }}
                                    key={i}
                                    ref={refsMap.get(character)}
                                />
                            );
                        })}
                    </ul>
                </div>

                <LightArrow
                    enabled={!!arrowPosition}
                    animate={!!selectCharacter}
                    x={arrowPosition?.[0] ?? 0}
                    y={arrowPosition?.[1] ?? 0}
                />
            </div>

            <MegaHup
              character={opened ? targetCharacter : null}
            />
        </div>
    );
};