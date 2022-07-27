import * as THREE from 'three';
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
import {VoiceEndpointVoicer, getVoiceEndpointUrl} from '../../../../voice-output/voice-endpoint-voicer.js';
import * as voices from '../../../../voices.js';
import { loadCryptoAvatarsCharacters } from './cryptoavatars-loader.js';
import { getMainnetAddress } from '../../../../blockchain.js';
import npcManager from '../../../../npc-manager.js';
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
      voice: 'Sweetie Belle',
      class: 'Drop Hunter',
      bio: 'Her nickname is Scilly or SLY. 13/F drop hunter. She is an adventurer, swordfighter and fan of potions. She is exceptionally skilled and can go Super Saiyan.',
    },
    {
      name: 'Drake',
      previewUrl: './images/characters/upstreet/small/drake.png',
      avatarUrl: './avatars/Drake_hacker_v8_Guilty.vrm',
      voice: 'Shining Armor',
      class: 'Neural Hacker',
      bio: 'His nickname is DRK. 15/M hacker. Loves guns. Likes plotting new hacks. He has the best equipment and is always ready for a fight.',
    },
    {
      name: 'Hyacinth',
      previewUrl: './images/characters/upstreet/small/hyacinth.png',
      avatarUrl: './avatars/hya_influencer_v2_vian.vrm',
      voice: 'Maud Pie',
      class: 'Beast Painter',
      bio: 'Scillia\'s mentor. 15/F beast tamer. She is quite famous. She is known for releasing beasts on her enemies when she get angry.',
    },
    {
      name: 'Juniper',
      previewUrl: './images/characters/upstreet/small/juniper.png',
      avatarUrl: './avatars/jun_engineer_v1_vian.vrm',
      voice: 'Cadance',
      class: 'Academy Engineer',
      bio: 'She is an engineer. 17/F engineer. She is new on the street. She has a strong moral compass and it the voice of reason in the group.',
    },
    {
      name: 'Anemone',
      previewUrl: './images/characters/upstreet/small/anemone.png',
      avatarUrl: './avatars/ann.vrm',
      voice: 'Trixie',
      class: 'Lisk Witch',
      bio: 'A witch studying to make the best potions. 13/F. She is exceptionally skilled and sells her potions on the black market, but she is very shy.',
    },
  ],
};

//

const Character = forwardRef(
  ({ character, highlight, animate, disabled, onMouseMove, onClick }, ref) => {
    return (
      <li
        className={classnames(
          styles.item,
          highlight ? styles.highlight : null,
          animate ? styles.animate : null,
          disabled ? styles.disabled : null
        )}
        onMouseMove={(e) => {
          if (!disabled) {
            onMouseMove(e);
          }
        }}
        onClick={(e) => {
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
      </li>
    );
  }
);

export const CharacterSelect = () => {
  const { state, setState } = useContext(AppContext);
  const [highlightCharacter, setHighlightCharacter] = useState(null);
  const [selectCharacter, setSelectCharacter] = useState(null);
  const [arrowPosition, setArrowPosition] = useState(null);
  const [arrowPosition2, setArrowPosition2] = useState(null);
  const [npcPlayer, setNpcPlayer] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [npcPlayerCache, setNpcPlayerCache] = useState(new Map());

  const [cryptoAvatars, setCryptoAvatars] = useState([]);
  const [caPagination, setCaPagination] = useState({});
  const [caItemsPerPage, setCaItemsPerPage] = useState(5);
  const [caCollection, setCaCollection] = useState(
    '0xc1def47cf1e15ee8c2a92f4e0e968372880d18d1'
  );
  const [caOwnership, setCaOwnership] = useState(null);
  const [scaleViewValue, setScaleViewValue] = useState(1);

  const [refsMap, setRefsMap] = useState(new Map());

  for (const userTokenCharacter of userTokenCharacters) {
    refsMap.set(userTokenCharacter, useRef(null));
  }
  for (const k in characters) {
    for (const character of characters[k]) {
      refsMap.set(character, useRef(null));
    }
  }

  const targetCharacter = selectCharacter || highlightCharacter;
  const _updateArrowPosition = () => {
    if (targetCharacter) {
      const ref = refsMap.get(targetCharacter);
      if (!ref) return;
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const parentRect = el.offsetParent.getBoundingClientRect();
        // window.rect = rect;
        // window.parentRect = parentRect;
        if (el.offsetParent.id === 'char-list-1') {
          setArrowPosition([
            Math.floor(rect.left - parentRect.left + rect.width / 2 + 40),
            100,
          ]);
          setArrowPosition2(null);
        } else {
          setArrowPosition2([
            Math.floor(rect.left - parentRect.left + rect.width / 2 + 40),
            100,
          ]);
          setArrowPosition(null);
        }
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
      const { avatarUrl } = targetCharacter;

      let live = true;
      let npcPlayer = npcPlayerCache.get(avatarUrl);
      (async () => {
        if (!npcPlayer) {
          const avatarApp = await metaversefile.createAppAsync({
            start_url: avatarUrl,
          });
          npcPlayer = await npcManager.createNpcAsync({
            name: 'npc',
            avatarUrl: avatarUrl,
            avatarApp,
          });
          npcPlayerCache.set(avatarUrl, npcPlayer);
          if (!live) return;
        }

        if (targetCharacter.avatarUrl.includes('usercollection')) {
          let box = new THREE.Box3().setFromObject(npcPlayer.avatar.model);
          let size = box.getSize(new THREE.Vector3()).length();
          const scalar = 0.9;
          setScaleViewValue(size * scalar);
        } else {
          setScaleViewValue(1);
        }

        setNpcPlayer(npcPlayer);
      })();

      const frame = (e) => {
        const { timestamp, timeDiff } = e.data;
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

  const onMouseMove = (character) => (e) => {
    if (enabled) {
      setHighlightCharacter(character);
    }
  };
  const onClick = (character) => (e) => {
    //const canBeUsed = character.canBeUsed === undefined || character.canBeUsed;
    const canBeUsed = true;
    if (character && npcPlayer && canBeUsed) {
      setSelectCharacter(character);

      (async () => {
        const localPlayer = await metaversefile.useLocalPlayer();
        await localPlayer.setAvatarUrl(character.avatarUrl);
      })();

      setTimeout(() => {
        setState({ openedPanel: null });
      }, 1000);
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

  const ref = useRef(null);
  useEffect(() => {
    if (cryptoAvatars && cryptoAvatars.length > 0) {
      for (const ccharacter of cryptoAvatars) {
        refsMap.set(ccharacter, ref);
      }
    }
    console.log(refsMap);
  }, [cryptoAvatars]);
  /** ------------------------------------------------------------------------------- */

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
            {userTokenCharacters.map((character, i) => (
              <Character
                character={character}
                highlight={character === targetCharacter}
                animate={selectCharacter === character}
                disabled={
                  !character.name ||
                  (!!selectCharacter && selectCharacter !== character)
                }
                onMouseMove={onMouseMove(character)}
                onClick={onClick(character)}
                key={i}
                ref={refsMap.get(character)}
              />
            ))}
          </ul>
        </div>
        <div className={styles.section}>
          <div className={styles.subheading}>
            <h2>From Upstreet</h2>
          </div>
          <ul className={styles.list} id="char-list-1">
            {characters.upstreet.map((character, i) => {
              return (
                <Character
                  character={character}
                  highlight={character === targetCharacter}
                  animate={selectCharacter === character}
                  disabled={
                    !character.name ||
                    (!!selectCharacter && selectCharacter !== character)
                  }
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
          <ul className={styles.list} id="char-list-2">
            {cryptoAvatars.length > 0 ? (
              cryptoAvatars.map((character, i) => {
                return (
                  <Character
                    character={character}
                    highlight={character === targetCharacter}
                    animate={selectCharacter === character}
                    disabled={
                      !character.name ||
                      (!!selectCharacter && selectCharacter !== character)
                    }
                    onMouseMove={onMouseMove(character)}
                    onClick={onClick(character)}
                    key={i}
                    ref={refsMap.get(character, 'arrowOne')}
                  />
                );
              })
            ) : (
              <>No avatars found</>
            )}
            <LightArrow
              enabled={!!arrowPosition2}
              animate={!!selectCharacter}
              x={arrowPosition2?.[0] ?? 0}
              y={arrowPosition2?.[1] ?? 0}
            />
          </ul>
        </div>
      </div>

      <MegaHup
        open={opened}
        npcPlayer={opened ? npcPlayer : null}
        manageScaleView={scaleViewValue}
      />
    </div>
  );
};
