// import * as THREE from 'three';
import React, {useState, useEffect} from 'react';
import * as sounds from '../sounds.js';
import storyManager from '../story.js';
import {
  registerIoEventHandler,
  unregisterIoEventHandler,
} from './components/general/io-handler';
import {MegaChatBox} from './components/play-mode/mega-chat-box';

import styles from './StoryTime.module.css';

const _progressConversation = () => {
  const conversation = storyManager.getConversation();
  conversation.progress();

  sounds.playSoundName('menuNext');
};

export const StoryTime = () => {
  const [message, setMessage] = useState(null);
  const [options, setOptions] = useState(null);
  const [option, setOption] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [progressing, setProgressing] = useState(false);
  const [finished, setFinished] = useState(false);

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
        if (options) {
          setOptions(options);
          setOption(null);
        }
      });
      conversation.addEventListener('hoverindex', e => {
        const {hoverIndex} = e.data;
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
        if (event.which === 13) {
          // enter
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
      <MegaChatBox
        message={message}
        options={options}
        option={option}
        hoverIndex={hoverIndex}
        progressing={progressing}
        finished={finished}
        onOptionSelect={option => {
          const conversation = storyManager.getConversation();
          conversation.progressOptionSelect(option);

          sounds.playSoundName('menuSelect');
        }}
        onClick={e => {
          if (!progressing) {
            _progressConversation();
          }
        }}
      />
    </div>
  );
};
