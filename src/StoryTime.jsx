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

const MegaChatBox = ({
  message,
  options,
  progressing,
}) => {
  // console.log('render mega chat box');
  return (
    <div className={styles.megaChatBox}>
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
            // e.stopPropagation();
            // e.preventDefault();
            if (!progressing) {
              const conversation = storyManager.getConversation();
              conversation.progress();
            }
          }}
        >
          <img
            className={styles.arrow}
            src="./images/ui/down.svg"
          />
        </div>
        {options ? <></> : null}
      </div>
    </div>
  );
};

export const StoryTime = ({
  // localPlayer,
  // npcs,
}) => {
  const {state, setState} = useContext(AppContext);
  // const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState(null);
  const [options, setOptions] = useState(null);
  const [progressing, setProgressing] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(-1);

  const open = state.openedPanel === 'StoryTime';
  // console.log('got open', open);

  useEffect(() => {
    // console.log('listen conversation start');
    function conversationstart(e) {
      const {conversation} = e.data;
      // const {messages} = conversation;

      // console.log('conversation start', conversation, messages);
      
      conversation.addEventListener('message', e => {
        const {message} = e.data;
        setMessage(message);
      });
      conversation.addEventListener('options', e => {
        const {options} = e.data;
        setOptions(options);
      });

      conversation.addEventListener('progressstart', e => {
        setProgressing(true);

        sounds.playSoundName('menuNext');
      });
      conversation.addEventListener('progressend', e => {
        setProgressing(false);
      });

      setConversation(conversation);
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
    if (conversation) {
      const handleKeyDown = event => {
        console.log('got key down', event.which);

        if (event.which === 13) { // enter
          const conversation = storyManager.getConversation();
          conversation.progress(selectedOptionIndex);
          
          return false;
        }
      };

      registerIoEventHandler('keydown', handleKeyDown);

      return () => {
        unregisterIoEventHandler('keydown', handleKeyDown);
      };
    }
  }, [conversation]);
  
  useEffect(() => {
    if (!open && conversation) {
      conversation.end();
    }
  }, [open, conversation]);

  return (
    <div className={styles.storyTime}>
      {message ? <>
        <MegaChatBox message={message} options={options} progressing={progressing} />
      </> : null}
      {/* hups.map((hup, index) => {
        return (
          <CharacterHup
            key={hup.hupId}
            hup={hup}
            index={index}
            hups={hups}
            setHups={setHups}
          />
        );
      }) */}
    </div>
  );
};