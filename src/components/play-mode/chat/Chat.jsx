import React, {useState, useEffect, useRef, useContext} from 'react';
import classnames from 'classnames';
import {checkText} from 'smile2emoji';

import game from '../../../../game';
import {chatManager} from '../../../../chat-manager.js';
import {
  registerIoEventHandler,
  unregisterIoEventHandler,
} from '../../general/io-handler';
import {AppContext} from '../../app';

import storyManager from '../../../../story.js';

import styles from './chat.module.css';

//

function ChatInput() {
  const {state, setState} = useContext(AppContext);
  const [value, setValue] = useState('');
  const inputRef = useRef();

  //

  const stopPropagation = event => {
    event.stopPropagation();
  };

  const handleMessageChange = event => {
    setValue(event.target.value);
  };

  //

  useEffect(() => {
    const handleActiveKey = event => {
      if (game.inputFocused() && document.activeElement !== inputRef.current) {
        return true;
      } else {
        switch (event.which) {
          case 13: {
            // enter
            if (storyManager.getConversation()) {
              // nothing; handled in StoryTime
            } else if (state.openedPanel !== 'ChatPanel') {
              setState({openedPanel: 'ChatPanel'});
            } else {
              if (document.activeElement !== inputRef.current) return true;

              if (value) {
                const text = checkText(value);
                chatManager.addMessage(text, {timeout: 3000});
              }

              setValue('');
              setState({openedPanel: null});
            }

            return true;
          }
        }

        return false;
      }
    };

    const handleAnytimeKey = event => {
      switch (event.which) {
        case 186: {
          // semicolon
          if (event.shiftKey) {
            if (state.openedPanel !== 'ChatPanel') {
              setValue(':');
              setState({openedPanel: 'ChatPanel'});
            }

            return true;
          }
        }
      }

      return false;
    };

    const handleKeyUp = event => {
      let handled = handleActiveKey(event);

      if (!handled) {
        handled = handleAnytimeKey(event);
      }

      if (handled) {
        return false;
      } else {
        return true;
      }
    };

    registerIoEventHandler('keyup', handleKeyUp);

    return () => {
      unregisterIoEventHandler('keyup', handleKeyUp);
    };
  }, [value, state.openedPanel]);

  useEffect(() => {
    if (inputRef.current) {
      if (state.openedPanel === 'ChatPanel') {
        inputRef.current.focus();
      } else {
        inputRef.current.blur();
      }
    }
  }, [state.openedPanel, inputRef.current]);

  //

  return (
    <div
      className={classnames(
        styles.chat,
        state.openedPanel === 'ChatPanel' ? styles.open : null,
      )}
      onClick={stopPropagation}
    >
      <img src="images/webpencil.svg" className={styles.background} />
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={handleMessageChange}
        ref={inputRef}
      />
    </div>
  );
}

/* function ChatMessages() {

    const [messageGroups, setMessageGroups] = useState([]);
    const [epoch, setEpoch] = useState(0);
    let localEpoch = epoch;

    useEffect(() => {

        const frame = e => {

            if (messageGroups.length > 0) {

                for (const messageGroup of messageGroups) {

                    world2canvas( messageGroup.player.getWorldPosition(localVector).add(localVector2.set(0, 0, 0)), messageGroup.position );

                }

                setEpoch(++localEpoch);

            }

        };

        world.appManager.addEventListener('frame', frame);

        return () => {

            world.appManager.removeEventListener('frame', frame);

        };

    }, [messageGroups]);

    useEffect(() => {

        const localPlayer = metaversefile.useLocalPlayer();

        const update = () => {

            const newMessageGroups = [];
            const localPlayerChatMessages = Array.from(localPlayer.getActionsState()).filter(action => action.type === 'chat');

            if (localPlayerChatMessages.length > 0) {

                const localPlayerMessageGroup = {
                    player: localPlayer,
                    messages: localPlayerChatMessages,
                    position: new THREE.Vector3(),
                };
                newMessageGroups.push(localPlayerMessageGroup);

            }

            setMessageGroups(newMessageGroups);

        };

        localPlayer.addEventListener('actionadd', update);
        localPlayer.addEventListener('actionremove', update);

        return () => {

            localPlayer.removeEventListener('actionadd', update);
            localPlayer.removeEventListener('actionremove', update);

        };

    }, [messageGroups]);

	return (
        <div className={styles['chat-messages']}>
            {
                messageGroups.map((messageGroup, i) => {

                    const messageGroupPosition = messageGroup.position;

                    return (
                        <div className={styles['message-group']} key={i}>
                            {
                                messageGroup.messages.map((message, i) => {
                                    return (
                                        <div
                                            className={styles.message}
                                            style={messageGroupPosition ? {
                                                transform: `translateX(${messageGroupPosition.x*100}vw) translateY(${messageGroupPosition.y*100}vh)`,
                                            } : null}
                                            key={i}
                                        >
                                            { message.message }
                                        </div>
                                    );
                                })
                            }
                        </div>
                    );
                })
            }
        </div>
    );
} */

//

export const Chat = () => {
  return (
    <>
      <ChatInput />
      {/* <ChatMessages /> */}
    </>
  );
};
