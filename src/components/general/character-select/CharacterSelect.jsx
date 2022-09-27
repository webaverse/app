
import classnames from 'classnames';
import metaversefile from 'metaversefile';
import React, {forwardRef, Fragment, useContext, useEffect, useState} from 'react';
import {chatManager} from '../../../../chat-manager.js';
import npcManager from '../../../../npc-manager.js';
import * as sounds from '../../../../sounds.js';
import {getVoiceEndpointUrl, VoiceEndpointVoicer} from '../../../../voice-output/voice-endpoint-voicer.js';
import * as voices from '../../../../voices.js';
import {CachedLoader} from '../../../CachedLoader.jsx';
import {LightArrow} from '../../../LightArrow.jsx';
import {MegaHup} from '../../../MegaHup.jsx';
import {AppContext} from '../../app';
import styles from './character-select.module.css';

//
import {
  cryptoavatarsCharactersUtil, tokensCharactersUtil, upstreetCharactersUtil,
} from '../../../../utils';

function typeContentToUrl(type, content) {
  if (typeof content === 'object') {
    content = JSON.stringify(content);
  }
  const dataUrlPrefix = 'data:' + type + ',';
  return '/@proxy/' + dataUrlPrefix + encodeURIComponent(content).replace(/\%/g, '%25');// .replace(/\\//g, '%2F');
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
const chevronImgSrc = './images/chevron.svg';

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
              character.name,
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
            {character && character.previewUrl
              ? (
                <img
                    crossOrigin="anonymous"
                    className={styles.img}
                    src={character.previewUrl}
                />
                )
              : null}
            {character && character.canBeUsed === false
              ? (
                <img className={styles.disabled} src=" ./images/disabled.svg" />
                )
              : null}
            <div className={styles.wrap}>
                <div className={styles.name}>{(character && character.name) || ''}</div>
                <div className={styles.description}>{(character && character.class) || ''}</div>
            </div>
            <LightArrow visible={targetCharacter === character} />
        </li>
  );
},
);

export const CharacterSelect = () => {
  const {state, setState} = useContext(AppContext);
  const [highlightCharacter, setHighlightCharacter] = useState(null);
  const [selectCharacter, setSelectCharacter] = useState(null);
  const [lastTargetCharacter, setLastTargetCharacter] = useState(null);
  const [npcPlayer, setNpcPlayer] = useState(null);
  const [abortFn, setAbortFn] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [npcLoader, setNpcLoader] = useState(() => new CachedLoader({
    loadFn: async (url, targetCharacter, {signal = null} = {}) => {
      let live = true;
      signal.addEventListener('abort', () => {
        live = false;
      });

      const detachedCharacter = JSON.parse(JSON.stringify(targetCharacter));
      detachedCharacter.detached = true;
      const app = await metaversefile.createAppAsync({
        start_url: typeContentToUrl('application/npc', detachedCharacter),
      });
      return npcManager.getNpcByApp(app);
    },
  }));

  const [characterIntroLoader, setCharacterIntroLoader] = useState(() => new CachedLoader({
    loadFn: async (url, targetCharacter, {signal = null} = {}) => {
      // get ai text
      let live = true;
      signal.addEventListener('abort', () => {
        live = false;
      });
      const loreAIScene = metaversefile.useLoreAIScene();
      const [
        characterIntro,
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
  const [text, setText] = useState('');

  const [cryptoAvatars, setCryptoAvatars] = useState([]);
  const [upstreatCharacters, setUpstreatCharacters] = useState([]);
  const [tokensCharacters, setTokesCharacters] = useState([]);

  const [caPagination, setCaPagination] = useState({});
  const [caItemsPerPage, setCaItemsPerPage] = useState(5);
  const [caCollection, setCaCollection] = useState();
  const [caOwnership, setCaOwnership] = useState(null);
  const [caFilters, setCaFilters] = useState({});
  const [caUrl, setCaUrl] = useState(undefined);

  const targetCharacter = selectCharacter || highlightCharacter;

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
      })();

      loadNpcPromise.then(npcPlayer => {
        if (live) {
          setNpcPlayer(npcPlayer);
        }
      });

      const localAbortFn = () => {
        abortController.abort();
      };
      setAbortFn(() => localAbortFn);
      setLastTargetCharacter(targetCharacter);
    }
  }, [targetCharacter, lastTargetCharacter, abortFn]);
  const opened = state.openedPanel === 'CharacterSelect';
  useEffect(() => {
    if (opened) {
      setSelectCharacter(null);
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
        setState({openedPanel: null});
      }, 1000);

      (async () => {
        const localPlayer = metaversefile.useLocalPlayer();
        const [
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

  useEffect(() => {
    // GET TOKENS CHARACTERS
    tokensCharactersUtil.getTokenCharacters().then(res => {
      if (res) {
        setTokesCharacters(res);
      }
    });
    // GET UPSTREET CHARACTERS
    upstreetCharactersUtil.getUpstreetCharacters().then(res => {
      if (res) {
        setUpstreatCharacters(res.upstreet);
      }
    });
  }, []);

  /** ------------------------- CRYPTOAVATARS IMPLEMENTATION ------------------------ */

  // GET CRYPTOAVATARS CHARACTERS
  useEffect(() => {
    // GET CHARACTERS
    cryptoavatarsCharactersUtil.getCryptoAvatars(caUrl, caOwnership, caCollection, caItemsPerPage).then(res => {
      if (res) {
        setCaPagination(res?.pagination);
        setCryptoAvatars(res?.avatars);
      }
    });
    // GET FILTERS
    cryptoavatarsCharactersUtil.getCryptoAvatarsFilters().then(res => {
      if (res) {
        setCaFilters(res);
      }
    });
  }, [caUrl, caCollection, caOwnership, caItemsPerPage]);

  /** ------------------------------------------------------------------------------- */

  return (
        <div className={styles.characterSelect}>
            <div className={classnames(styles.menuBackground, opened ? styles.open : null)}>
                <MegaHup
                    open={opened}
                    npcPlayer={opened ? npcPlayer : null}
                />
                <div className={styles.heading}>
                    <div onClick={() => setState({openedPanel: 'CharacterPanel'})} className={styles.closeMenu}>
                        <h1>Close <img src={chevronImgSrc} /></h1>
                    </div>
                    <h1>Character select</h1>
                </div>
                <div className={classnames(styles.menu, opened ? styles.open : null)}>
                    <div className={styles.section}>
                        <div className={styles.subheading}>
                            <h2>Tokens</h2>
                        </div>
                        <ul className={styles.list}>
                            {tokensCharacters && tokensCharacters.length > 0
                              ? (
                                  tokensCharacters.map((character, i) => {
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
                                        />
                                    );
                                  })
                                )
                              : (
                                <Fragment>No characters found.</Fragment>
                                )}
                        </ul>
                    </div>
                    <div className={styles.section}>
                        <div className={styles.subheading}>
                            <h2>From Upstreet</h2>
                        </div>
                        <ul className={styles.list}>
                            {upstreatCharacters && upstreatCharacters.length > 0
                              ? (
                                  upstreatCharacters.map((character, i) => {
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
                                        />
                                    );
                                  })
                                )
                              : (
                                <Fragment>No characters found.</Fragment>
                                )}
                        </ul>
                    </div>
                    <div className={styles.section}>
                        <div className={styles.subheading}>
                            <h2>CryptoAvatars</h2>
                            <div className={styles.cryptoavatars}>
                                <Fragment>Collection:</Fragment>
                                <div className={styles.select}>
                                    <select onChange={e => setCaCollection(e.target.value)}>
                                        {caFilters?.collections && caFilters.collections.map((collection, i) => {
                                          return (
                                                <option key={i} value={collection?.address}>
                                                    {collection?.name}
                                                </option>
                                          );
                                        },
                                        )}
                                    </select>
                                </div>
                                <Fragment>Ownership:</Fragment>
                                <div className={styles.select}>
                                    <select onChange={e => setCaItemsPerPage(e.target.value)}>
                                        <option value="all">ALL</option>
                                        <option value="owned">Owned</option>
                                        <option value="opensource">Free use</option>
                                    </select>
                                </div>
                                <Fragment>Avatars per page:</Fragment>
                                <div className={styles.select}>
                                    <select onChange={e => setCaItemsPerPage(e.target.value)}>
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="20">25</option>
                                    </select>
                                </div>
                                <div>
                                    <Fragment>Pages </Fragment>
                                    {caPagination.prev && (
                                        <button
                                            className={styles.button}
                                            onClick={e => setCaUrl(caPagination.prev)}
                                        >
                                            {'<'}
                                        </button>
                                    )}
                                    <Fragment>
                                        {caPagination.currentPage || 0} / {caPagination.totalPages}
                                    </Fragment>
                                    {caPagination.next && (
                                        <button
                                            className={styles.button}
                                            onClick={e => setCaUrl(caPagination.next)}
                                        >
                                            {'>'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <ul className={styles.list}>
                            {cryptoAvatars && cryptoAvatars.length > 0
                              ? (
                                  cryptoAvatars.map((character, i) => {
                                    return (
                                        <Character
                                            character={character}
                                            highlight={character === targetCharacter}
                                            targetCharacter={targetCharacter}
                                            animate={selectCharacter === character}
                                            disabled={false}
                                            onMouseMove={onMouseMove(character)}
                                            onClick={onClick(character)}
                                            key={i}
                                        />
                                    );
                                  })
                                )
                              : (
                                <Fragment>No characters found.</Fragment>
                                )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
  );
};
