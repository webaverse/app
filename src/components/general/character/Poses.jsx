import React, {useState, useRef} from 'react';
import classnames from 'classnames';

import {setFacePoseValue} from './Emotions';
import styles from './poses.module.css';

import metaversefile from 'metaversefile';
import {emoteAnimations} from '../../../../avatars/animationHelpers.js';
import emotes from './emotes.json';
import fallbackEmotes from './fallback_emotes.json';

let emoteTimeout = null;
export const triggerEmote = (emoteName, player = null) => {
  const emoteHardName = emoteName.replace(/Soft$/, '');
  const emote = emotes.find(emote => emote.name === emoteHardName);
  if (emote === undefined) {
    return;
  }
  const {emotion} = emote;
  player = !player ? metaversefile.useLocalPlayer() : player;

  // clear old emote
  player.removeAction('emote');
  if (emoteTimeout) {
    clearTimeout(emoteTimeout);
    emoteTimeout = null;
  }

  // add new emote
  const newAction = {
    type: 'emote',
    animation: emoteHardName,
  };
  player.addAction(newAction);

  setFacePoseValue(emotion, 1);

  const emoteAnimation = emoteAnimations[emoteHardName];
  const emoteAnimationDuration = emoteAnimation.duration;
  emoteTimeout = setTimeout(() => {
    const actionIndex = player.findActionIndex(action => action.type === 'emote' && action.animation === emoteHardName);
    player.removeActionIndex(actionIndex);

    setFacePoseValue(emotion, 0);

    emoteTimeout = null;
  }, emoteAnimationDuration * 1000);
};

//

export const Poses = ({
  parentOpened,
}) => {
  const [posesOpen, setPosesOpen] = useState(false);
  const posesRef = useRef();

  const poseClick = emote => e => {
    triggerEmote(emote);
  };

  return (
        <div
            className={classnames(
              styles.poses,
              parentOpened ? styles.parentOpened : null,
              posesOpen ? styles.open : null,
            )}
            onMouseEnter={e => {
              setPosesOpen(true);
            }}
            onMouseLeave={e => {
              setPosesOpen(false);
            }}
            ref={posesRef}
        >
            {emotes.map((emote, emoteIndex) => {
              const {name, icon} = emote;
              return (
                    <div
                        className={styles.pose}
                        onClick={poseClick(name)}
                        key={name}
                    >
                        <img src={`images/poses/${icon}`} className={styles.poseIcon} />
                        <div className={styles.poseName}>{name}</div>
                    </div>
              );
            })}
        </div>
  );
};
