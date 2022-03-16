import React, {useState, useEffect, useRef} from 'react';
// import styles from './RpgText.module.css';
import classnames from 'classnames';

export const RpgText = ({
  className,
  styles,
  text,
  textSpeed = chatTextSpeed,
}) => {
  const [progressText, setProgressText] = useState('');

  useEffect(() => {
    if (text.length === 0) {
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
  }, [text, progressText]);

  return <div className={classnames(className, text.length > 0 ? styles.open : null)}>{progressText}</div>;
};