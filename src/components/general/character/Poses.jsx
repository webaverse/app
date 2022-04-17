import React, {useState, useRef} from 'react';
import classnames from 'classnames';

import styles from './poses.module.css';

import metaversefile from 'metaversefile';
import {emoteAnimations} from '../../../../avatars/animationHelpers.js';
import emotes from './emotes.json';

//

let emoteTimeout = null;
export const triggerEmote = emote => {
  // clear old emote
  const localPlayer = metaversefile.useLocalPlayer();
  localPlayer.removeAction('emote');
  if (emoteTimeout) {
    clearTimeout(emoteTimeout);
    emoteTimeout = null;
  }

  // add new emote
  const newAction = {
    type: 'emote',
    animation: emote,
  };
  localPlayer.addAction(newAction);

  const emoteAnimation = emoteAnimations[emote];
  const emoteAnimationDuration = emoteAnimation.duration;
  emoteTimeout = setTimeout(() => {
    const actionIndex = localPlayer.findActionIndex(action => action.type === 'emote' && action.animation === emote);
    localPlayer.removeActionIndex(actionIndex);
    
    emoteTimeout = null;
  }, emoteAnimationDuration * 1000);
};

//

export const Poses = ({
    parentOpened,
}) => {
    const [ posesOpen, setPosesOpen ] = useState( false );
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