import React from 'react';
import styles from './CharacterBanner.module.css';

export const CharacterBanner = () => {
  return (
    <div className={styles.menu} width={600} height={400}>
      <h1>Ann's shop</h1>
      <p>You break it you buy it!</p>
    </div>
  );
};
