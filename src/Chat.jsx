import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import {checkText} from 'smile2emoji';
import styles from './Chat.module.css';
/* import * as Y from 'yjs';
import {Color} from './Color.js';
import game from '../game.js'
import metaversefile from '../metaversefile-api.js' */
import {world} from '../world.js';
import {chatManager} from '../chat-manager.js';
import {world2canvas} from './ThreeUtils.js';
import metaversefile from 'metaversefile';
import {rigManager} from '../rig.js';
import ioManager from '../io-manager.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

function ChatInput({open, setOpen}) {
  const [value, setValue] = useState('');
  const inputRef = useRef();
  
  const chatOpen = open === 'chat';

  const _handleActiveKey = e => {
    if (document.activeElement === inputRef.current) {
      switch (e.which) {
        case 13: { // enter
          e.preventDefault();
          e.stopPropagation();
          
          if (value) {
            const text = checkText(value);
            const targetObject = rigManager.localRig ? rigManager.localRig.modelBones.Head : new THREE.Object3D();
            chatManager.addMessage(targetObject, text, {
              timeout: 3000,
            });
          }
          setValue('');
          setOpen(null);
          
          ioManager.click(new MouseEvent('click'));
          return true;
        }
      }
    }
    return false;
  };
  const _handleAnytimeKey = e => {
    switch (e.which) {
      case 186: { // semicolon
        if (e.shiftKey) {
          if (!chatOpen) {
            e.preventDefault();
            e.stopPropagation();

            setValue(':');
            setOpen('chat');
          }
        }
        break;
      }
    }
  };
  useEffect(() => {
    const keydown = e => {
      let handled = _handleActiveKey(e);
      if (!handled) {
        handled = _handleAnytimeKey(e);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('keydown', keydown);
    };
  }, [value, chatOpen]);
  useEffect(() => {
    if (inputRef.current) {
      if (chatOpen) {
        inputRef.current.focus();
      } else {
        inputRef.current.blur();
      }
    }
  }, [chatOpen, inputRef.current]);

	return (
    <div className={classnames(styles.chat, chatOpen ? styles.open : null)}>
      <img src="images/webpencil.svg" className={styles.background} />
      <input
        type="text"
        className={styles.input}
        value={value}
        onClick={e => {
          e.stopPropagation();
        }}
        onChange={e => {
          setValue(e.target.value);
        }}
        ref={inputRef}
      />
    </div>
  )
}
function ChatMessages() {
  const [messageGroups, setMessageGroups] = useState([]);
  const [epoch, setEpoch] = useState(0);
  
  let localEpoch = epoch;
  useEffect(() => {
    const frame = e => {
      if (messageGroups.length > 0) {
        for (const messageGroup of messageGroups) {
          world2canvas(
            messageGroup.object.getWorldPosition(localVector)
              .add(localVector2.set(0, 0.2, 0)),
            messageGroup.position
          );
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
    const update = () => {
      let newMessageGroups = messageGroups;
      let changed = false;
      
      // add new messages
      const messages = chatManager.getMessages();
      for (const message of messages) {
        const {object} = message;
        let messageGroup = newMessageGroups.find(group => group.object === object);
        if (!messageGroup) {
          messageGroup = {
            object,
            messages: [],
            position: new THREE.Vector3(),
          };
          newMessageGroups.push(messageGroup);
        }
        const messageIndex = messageGroup.messages.indexOf(message);
        if (messageIndex === -1) {
          messageGroup.messages.push(message);
          changed = true;
        }
      }
      // remove old messages
      for (const messageGroup of newMessageGroups) {
        messageGroup.messages = messageGroup.messages.filter(m => {
          if (messages.includes(m)) {
            return true;
          } else {
            changed = true;
            return false;
          }
        });
      }
      newMessageGroups = newMessageGroups.filter(messageGroup => messageGroup.messages.length > 0);
      if (changed) {
        setMessageGroups(newMessageGroups);
      }
    };
    chatManager.addEventListener('messageadd', update);
    chatManager.addEventListener('messageremove', update);
    return () => {
      chatManager.removeEventListener('messageadd', update);
      chatManager.removeEventListener('messageremove', update);
    };
  }, [messageGroups]);

	return (
    <div className={styles['chat-messages']}>
      {messageGroups.map((messageGroup, i) => {
        const messageGroupPosition = messageGroup.position;
        return (
          <div className={styles['message-group']} key={i}>
            {messageGroup.messages.map((message, i) => {
              return (
                <div
                  className={styles.message}
                  style={messageGroupPosition ? {
                    transform: `translateX(${messageGroupPosition.x*100}vw) translateY(${messageGroupPosition.y*100}vh)`,
                  } : null}
                  key={i}
                >
                  {message.message}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
export default function Chat({open, setOpen}) {
  return (
    <>
      <ChatInput open={open} setOpen={setOpen} />
      <ChatMessages />
    </>
  );
};