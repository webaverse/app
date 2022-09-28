import React, {useState, useEffect, useRef} from 'react';
// import styles from './RpgText.module.css';
import classnames from 'classnames';
import {chatTextSpeed} from '../constants.js';

export const RpgText = ({
  className,
  styles,
  text,
  textSpeed = chatTextSpeed,
}) => {
  const [lastText, setLastText] = useState(text);
  const [progressText, setProgressText] = useState('');

  useEffect(() => {
    if (!text.startsWith(lastText)) {
      setProgressText('');
    } else if (progressText.length < text.length) {
      const timeout = setTimeout(() => {
        // XXX this text slicing should be done with a mathematical factor in the hups code
        const newProgressText = progressText + text.charAt(progressText.length);
        setProgressText(newProgressText);
      }, textSpeed);
      return () => {
        clearTimeout(timeout);
      };
    }
    if (text !== lastText) {
      setLastText(text);
    }
  }, [text, progressText, lastText]);

  return (
    <div
      className={classnames(className, text.length > 0 ? styles.open : null)}
    >
      {progressText}
    </div>
  );
};
