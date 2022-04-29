// import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import dioramaManager from '../diorama.js';
import {RpgText} from './RpgText.jsx';
import styles from './StoryTime.module.css';
// import metaversefile from 'metaversefile';
// const {useLocalPlayer} = metaversefile;
import {chatTextSpeed} from '../constants.js';
import {level} from '../player-stats.js';

import storyManager from '../story.js';

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();

// const defaultHupSize = 256;
// const pixelRatio = window.devicePixelRatio;

const MegaChatBox = ({
  message,
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
      </div>
    </div>
  );
};

export const StoryTime = ({
  // localPlayer,
  // npcs,
}) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // console.log('listen conversation start');
    function conversationstart(e) {
        const {conversation} = e.data;
        const {messages} = conversation;

        // console.log('conversation start', conversation, messages);
        
        conversation.addEventListener('message', e => {
          // console.log('got message event', e.data)
          const {message} = e.data;
          setMessages(messages.concat([message]));
          setMessage(message);
        });
        /* setMessages(messages);
        
        if (messages.length > 0) {
          setMessage(messages[0]);
        } */
    }
    storyManager.addEventListener('conversationstart', conversationstart);
    
    return () => {
      storyManager.removeEventListener('conversationstart', conversationstart);
    };
  }, []);

  /* useEffect(() => {
    function hupadd(e) {
      const newHups = hups.concat([e.data.hup]);
      // console.log('new hups', newHups);
      setHups(newHups);
    }
    localPlayer.characterHups.addEventListener('hupadd', hupadd);
    // localPlayer.characterHups.addEventListener('hupremove', hupremove);
    for (const npcPlayer of npcs) {
      npcPlayer.characterHups.addEventListener('hupadd', hupadd);
      // npcPlayer.characterHups.addEventListener('hupremove', hupremove);
    }

    return () => {
      localPlayer.characterHups.removeEventListener('hupadd', hupadd);
      // localPlayer.characterHups.removeEventListener('hupremove', hupremove);
      for (const npcPlayer of npcs) {
        npcPlayer.characterHups.removeEventListener('hupadd', hupadd);
        // npcPlayer.characterHups.removeEventListener('hupremove', hupremove);
      }
    };
  }, [localPlayer, npcs, npcs.length, hups, hups.length]); */

  return (
    <div className={styles.storyTime}>
      {message ? <MegaChatBox message={message} /> : null}
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