import React, {useEffect, useState} from 'react';
import classnames from 'classnames';
import styles from './death.module.css';
import metaversefile from 'metaversefile';
import ioManager from '../../../../io-manager';
import {DeathFx} from './DeathFx';

export const Death = () => {
  const [isDeath, setIsDeath] = useState(false);

  useEffect(() => {
    const onSetLive = e => {
      setIsDeath(!e.data.isAlive);
    };
    ioManager.addEventListener('death', onSetLive);
    return () => {
      ioManager.removeEventListener('death', onSetLive);
    };
  });

  return (
    <div className={classnames(styles.Death, isDeath && styles.open)}>
      <div>YOU HAVE DIED</div>
      <div>Press "RESPAWN" TO CONTINUE</div>
      <div
        className={styles.respawn}
        onClick={() => {
          const localPlayer = metaversefile.useLocalPlayer();
          localPlayer.setAlive(true);
          setIsDeath(false);
        }}
      >
        RESPAWN
      </div>
      <DeathFx enabled={isDeath}></DeathFx>
    </div>
  );
};
