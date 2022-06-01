// import * as THREE from 'three';
import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { RpgText } from './RpgText.jsx';
import { LightArrow } from './LightArrow.jsx';
import styles from './StoryTime.module.css';
import { chatTextSpeed } from '../constants.js';
import { level } from '../player-stats.js';

import * as sounds from '../sounds.js';
import storyManager from '../story.js';

import { MegaChatBox } from './components/play-mode/mega-chat-box/MegaChatBox.jsx';

import { registerIoEventHandler, unregisterIoEventHandler } from './components/general/io-handler';

const _progressConversation = () => {
  const conversation = storyManager.getConversation();
  conversation.progress();

  sounds.playSoundName('menuNext');
};


// const MegaChatBox = ({
//   message,
//   options,
//   option,
//   hoverIndex,
//   progressing,
//   finished,
//   onOptionSelect,
// }) => {
//   const [currentMessage, setCurrentMessage] = useState(message);
//   const selectedOptionIndex = options ? options.indexOf(option) : -1;

//   useEffect(() => {
//     if (message && currentMessage !== message) {
//       setCurrentMessage(message);
//     }
//   }, [message, currentMessage]);

//   const _continue = () => {
//     if (!progressing) {
//       _progressConversation();
//     }
//   };

//   return (
//     <div className={classnames(
//       styles.megaChatBox,
//       styles.outer,
//       message ? styles.open : null,
//     )}>
//       <div className={styles.inner}>
//         <div className={styles.row}>
//           <div className={styles.name}>{currentMessage ? currentMessage.name : ''}</div>
//           <div className={styles.level}>Lv. {level}</div>
//         </div>
//         <RpgText className={styles.text} styles={styles} textSpeed={chatTextSpeed} text={currentMessage ? currentMessage.text : ''}></RpgText>
//         {finished ? (
//           <LightArrow
//             className={styles.lightArrow}
//             up
//             onClick={e => {
//               _continue();
//             }}
//           />
//         ) : (
//           <div
//             className={classnames(
//               styles.nextBlink,
//               (!currentMessage || progressing) ? null : styles.visible,
//             )}
//             onMouseEnter={e => {
//               sounds.playSoundName('menuClick');
//             }}
//             onClick={e => {
//               _continue();
//             }}
//           >
//             <img
//               className={styles.arrow}
//               src="./images/ui/down.svg"
//             />
//           </div>
//         )}
//       </div>
//       <div className={classnames(
//         styles.options,
//         styles.outer,
//         options ? styles.open : null,
//         selectedOptionIndex !== -1 ? styles.selected : null,
//       )}>
//         <div className={styles.inner}>
//           {options ? options.map((option, i) => {
//             const hovered = i === hoverIndex;
//             const selected = i === selectedOptionIndex;
//             return (
//               <div
//                 className={classnames(
//                   styles.option,
//                   hovered ? styles.hovered : null,
//                   selected ? styles.selected : null,
//                 )}
//                 onClick={e => {
//                   onOptionSelect(option, i);
//                 }}
//                 onMouseEnter={e => {
//                   sounds.playSoundName('menuMove');
//                 }}
//                 key={i}
//               >
//                 <div className={styles.border} />
//                 <div className={styles.value}>{option.message}</div>
//                 <img className={styles.arrow} src="./images/ui/left-red.svg" />
//               </div>
//             );
//           }) : null}
//         </div>
//       </div>
//     </div>
//   );
// };

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
      const { conversation } = e.data;
      conversation.addEventListener('message', e => {
        const { message } = e.data;
        setFinished(false);
        setMessage(message);
      });
      conversation.addEventListener('options', e => {
        const { options } = e.data;
        if (options) {
          setOptions(options);
          setOption(null);
        }
      });
      conversation.addEventListener('hoverindex', e => {
        const { hoverIndex } = e.data;
        setHoverIndex(hoverIndex);

        sounds.playSoundName('menuMove');
      });
      conversation.addEventListener('option', e => {
        const { option } = e.data;
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
