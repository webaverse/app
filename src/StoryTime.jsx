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
import {AppContext} from './components/app';

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
const _closeConversation = () => {
  const conversation = storyManager.getConversation();
  conversation.close();

  sounds.playSoundName('menuNext');
};

const MegaChatBox = ({
  message,
  options,
  // hoveredOptionIndex,
  selectedOptionIndex,
  progressing,
  finished,
  onOptionSelect,
}) => {
  return (
    <div className={classnames(styles.megaChatBox, styles.outer)}>
      <div className={styles.inner}>
        <div className={styles.row}>
          <div className={styles.name}>{message.name}</div>
          <div className={styles.level}>Lv. {level}</div>
        </div>
        <div className={styles.text}>{message.text}</div>
        {/* <LightArrow
          className={styles.lightArrow}
          up
        />*/}
        <div
          className={classnames(
            styles.nextBlink,
            progressing ? null : styles.visible,
          )}
          onMouseEnter={e => {
            sounds.playSoundName('menuClick');
          }}
          onClick={e => {
            if (!progressing) {
              if (!finished) {
                _progressConversation();
              } else {
                _closeConversation();
              }
            }
          }}
        >
          <img
            className={styles.arrow}
            src="./images/ui/down.svg"
          />
        </div>
      </div>
      <div className={classnames(
        styles.options,
        styles.outer,
        options ? styles.open : null,
        selectedOptionIndex !== -1 ? styles.selected : null,
      )}>
        <div className={styles.inner}>
          {options ? options.map((option, i) => {
            const selected = i === selectedOptionIndex;
            return (
              <div
                className={classnames(
                  styles.option,
                  selected ? styles.selected : null,
                )}
                onClick={e => {
                  onOptionSelect(option, i);
                }}
                key={i}
              >
                <div className={styles.border}/>
                <div className={styles.value}>{option}</div>
              </div>
            );
          }) : null}
        </div>
      </div>
    </div>
  );
};

export const StoryTime = () => {
  const {state, setState} = useContext(AppContext);
  // const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState(null);
  let [options, setOptions] = useState(null);
  const [progressing, setProgressing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState(-1);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(-1);

  /* // XXX hack
  if (!(options && options.length > 0)) {
    options = [
      'Take the bait',
      'To the pain!',
    ];
  } */

  // const open = state.openedPanel === 'StoryTime';

  useEffect(() => {
    function conversationstart(e) {
      const {conversation} = e.data;
      conversation.addEventListener('message', e => {
        const {message} = e.data;
        setMessage(message);
        setFinished(false);
      });
      conversation.addEventListener('options', e => {
        const {options} = e.data;
        setOptions(options);
        setHoveredOptionIndex(-1);
        setSelectedOptionIndex(-1);
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
        // setConversation(null);
        setMessage(null);
        if (state.openedPanel === 'StoryTime') {
          setState({
            openedPanel: null,
          });
        }
      });

      // setConversation(conversation);
      setState({
        openedPanel: 'StoryTime',
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
        // console.log('got key down', event.which);

        if (event.which === 13) { // enter
          if (!progressing) {
            if (!finished) {
              _progressConversation();
            } else {
              _closeConversation();
            }
          }

          return false;
        }
      };

      registerIoEventHandler('keydown', handleKeyDown);

      return () => {
        unregisterIoEventHandler('keydown', handleKeyDown);
      };
    }
  }, [message, progressing]);
  
  /* useEffect(() => {
    if (!open && conversation) {
      conversation.end();
    }
  }, [open, conversation]); */

  useEffect(() => {
    // console.log('check options', options, selectedOptionIndex);
    if (options && selectedOptionIndex !== -1) {
      // console.log('set timeout', options, selectedOptionIndex);
      const timeout = setTimeout(() => {
        // console.log('clear options');
        setOptions(null);
        setSelectedOptionIndex(-1);
      }, 1500);

      return () => {
        // console.log('clear timeout');
        clearTimeout(timeout);
      };
    }
  }, [options, selectedOptionIndex]);

  return (
    <div className={styles.storyTime}>
      {message ? (
        <MegaChatBox
          message={message}
          options={options}
          hoveredOptionIndex={hoveredOptionIndex}
          selectedOptionIndex={selectedOptionIndex}
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