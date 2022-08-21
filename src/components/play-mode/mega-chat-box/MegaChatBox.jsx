// import * as THREE from 'three';
import React, {useState, useEffect} from 'react';
import classnames from 'classnames';
import {RpgText} from '../../../RpgText.jsx';
import {LightArrow} from '../../../LightArrow.jsx';
import {chatTextSpeed} from '../../../../constants.js';
import {level} from '../../../../player-stats.js';
import * as sounds from '../../../../sounds.js';

import styles from './MegaChatBox.module.css';

export const MegaChatBox = ({
  message,
  options,
  option,
  hoverIndex,
  progressing,
  finished,
  onOptionSelect,
  onClick,
}) => {
  const [currentMessage, setCurrentMessage] = useState(message);
  const selectedOptionIndex = options ? options.indexOf(option) : -1;

  useEffect(() => {
    if (message && currentMessage !== message) {
      setCurrentMessage(message);
    }
  }, [message, currentMessage]);

  return (
    <div className={classnames(
      styles.megaChatBox,
      styles.outer,
      message ? styles.open : null,
    )}>
      <div className={styles.inner}>
        <div className={styles.row}>
          <div className={styles.name}>{currentMessage ? currentMessage.name : ''}</div>
          <div className={styles.level}>Lv. {level}</div>
        </div>
        <RpgText className={styles.text} styles={styles} textSpeed={chatTextSpeed} text={currentMessage ? currentMessage.text : ''}></RpgText>
        {finished
          ? (
          <LightArrow
            className={styles.lightArrow}
            up
            onClick={onClick}
          />
            )
          : (
          <div
            className={classnames(
              styles.nextBlink,
              (!currentMessage || progressing) ? null : styles.visible,
            )}
            onMouseEnter={e => {
              sounds.playSoundName('menuClick');
            }}
            onClick={onClick}
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
          {options
            ? options.map((option, i) => {
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
                <div className={styles.value}>{option.message}</div>
                <img className={styles.arrow} src="./images/ui/left-red.svg" />
              </div>
              );
            })
            : null}
        </div>
      </div>
    </div>
  );
};
