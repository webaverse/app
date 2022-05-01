// import * as THREE from 'three';
import React, {useState, useEffect, useContext} from 'react';
import classnames from 'classnames';
import dioramaManager from '../diorama.js';
import {RpgText} from './RpgText.jsx';
import {LightArrow} from './LightArrow.jsx';
import styles from './StoryTime.module.css';
// import metaversefile from 'metaversefile';
// const {useLocalPlayer} = metaversefile;
import {chatTextSpeed} from '../constants.js';
import {level} from '../player-stats.js';
// import {AppContext} from './components/app';

import * as sounds from '../sounds.js';
import storyManager from '../story.js';

import {registerIoEventHandler, unregisterIoEventHandler} from './components/general/io-handler';

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();

// const defaultHupSize = 256;
// const pixelRatio = window.devicePixelRatio;

const _progressConversation = () => {
  const conversation = storyManager.getConversation();
  conversation.progress();

  sounds.playSoundName('menuNext');
};

const MegaChatBox = ({
  message,
  options,
  option,
  hoverIndex,
  progressing,
  finished,
  onOptionSelect,
}) => {
  const selectedOptionIndex = options ? options.indexOf(option) : -1;
  // console.log('hover select index', {hoverIndex, selectedOptionIndex, options, option});

  const _continue = () => {
    if (!progressing) {
      _progressConversation();
    }
  };

  return (
    <div className={classnames(styles.megaChatBox, styles.outer)}>
      <div className={styles.inner}>
        <div className={styles.row}>
          <div className={styles.name}>{message.name}</div>
          <div className={styles.level}>Lv. {level}</div>
        </div>
        <div className={styles.text}>{message.text}</div>
        {finished ? (
          <LightArrow
            className={styles.lightArrow}
            up
            onClick={e => {
              _continue();
            }}
          />
        ) : (
          <div
            className={classnames(
              styles.nextBlink,
              progressing ? null : styles.visible,
            )}
            onMouseEnter={e => {
              sounds.playSoundName('menuClick');
            }}
            onClick={e => {
              _continue();
            }}
          >
            <img
              className={styles.arrow}
              src="./images/ui/down.svg"
            />
          </div>
        )}
      </div>
      <div className={classnames(
        styles.options,
        styles.outer,
        options ? styles.open : null,
        selectedOptionIndex !== -1 ? styles.selected : null,
      )}>
        <div className={styles.inner}>
          {options ? options.map((option, i) => {
            const hovered = i === hoverIndex;
            const selected = i === selectedOptionIndex;
            return (
              <div
                className={classnames(
                  styles.option,
                  hovered ? styles.hovered : null,
                  selected ? styles.selected : null,
                )}
                onClick={e => {
                  onOptionSelect(option, i);
                }}
                onMouseEnter={e => {
                  sounds.playSoundName('menuMove');
                }}
                key={i}
              >
                <div className={styles.border}/>
                <div className={styles.value}>{option}</div>
                <img className={styles.arrow} src="./images/ui/left.svg" />
              </div>
            );
          }) : null}
        </div>
      </div>
    </div>
  );
};

export const StoryTime = () => {
  // const {state, setState} = useContext(AppContext);
  // const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState(null);
  let [options, setOptions] = useState(null);
  const [option, setOption] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [progressing, setProgressing] = useState(false);
  const [finished, setFinished] = useState(false);

  /* // XXX hack
  if (!(options && options.length > 0)) {
    options = [
      'Take the bait',
      'To the pain!',
    ];
  } */

  // const open = state.openedPanel === 'StoryTime';

  const _continue = () => {
    if (!progressing) {
      _progressConversation();
    }
  };

  useEffect(() => {
    function conversationstart(e) {
      const {conversation} = e.data;
      conversation.addEventListener('message', e => {
        const {message} = e.data;
        setFinished(false);
        setMessage(message);
      });
      conversation.addEventListener('options', e => {
        const {options} = e.data;
        /* if (window.lol && !options) {
          console.log('set options', options, new Error().stack);
          debugger;
        } */
        if (options) {
          setOptions(options);
          setOption(null);
        }
      });
      conversation.addEventListener('hoverindex', e => {
        const {hoverIndex} = e.data;
        // console.log('hoverIndex', hoverIndex);
        setHoverIndex(hoverIndex);

        sounds.playSoundName('menuMove');
      });
      conversation.addEventListener('option', e => {
        const {option} = e.data;
        setOption(option);
      });

      conversation.addEventListener('progressstart', e => {
        setProgressing(true);
      });
      conversation.addEventListener('progressend', e => {
        setProgressing(false);
      });

      conversation.addEventListener('finish', e => {
        setFinished(true);

        sounds.playSoundName('menuDone');
      });

      conversation.addEventListener('close', e => {
        // console.log('got close event');

        setMessage(null);
      });
    }
    storyManager.addEventListener('conversationstart', conversationstart);
    
    return () => {
      storyManager.removeEventListener('conversationstart', conversationstart);
    };
  }, []);

  useEffect(() => {
    if (message) {
      const handleKeyDown = event => {

        if (event.which === 13) { // enter
          _continue();

          return false;
        }
      };

      registerIoEventHandler('keydown', handleKeyDown);

      return () => {
        unregisterIoEventHandler('keydown', handleKeyDown);
      };
    }
  }, [message, progressing]);

  useEffect(() => {
    // console.log('check options', options, option);
    if (options && option) {
      // console.log('set timeout', options, option);
      const timeout = setTimeout(() => {
        // console.log('clear options');
        setOptions(null);
        setOption(null);
        setHoverIndex(null);
      }, 1000);

      return () => {
        // console.log('clear options timeout');
        clearTimeout(timeout);
      };
    }
  }, [options, option]);

  return (
    <div className={styles.storyTime}>
      {message ? (
        <MegaChatBox
          message={message}
          options={options}
          option={option}
          hoverIndex={hoverIndex}
          progressing={progressing}
          finished={finished}
          onOptionSelect={(option, i) => {
            const conversation = storyManager.getConversation();
            conversation.progressOptionSelect(option);

            setSelectedOptionIndex(i);

            sounds.playSoundName('menuSelect');
          }}
        />
      ) : null}
    </div>
  );
};