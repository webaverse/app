import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import styles from '../Footer.module.css';
import styles_ from '../styles/loadout.module.css';
import {Button} from '../components/button';

export const Loadout = () => {
  const [loadOutOpen, setLoadOutOpen] = useState(false);

  return (
    <div className={classnames(styles.helper, styles.left, !loadOutOpen ? styles.hide : null)}>
      {/* <div style={{
        background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.50) -22.66%, rgba(10, 40, 50, 0.50) 103.86%)',
        backdropFilter: 'blur(100px)',
        width: '42px',
        height: '27px',
        position: 'absolute',
        left: '-8.81%',
        top: '67%',
        zIndex: '0',
        transform: 'skew(-37deg)',
      }}></div> */}
      <div className={classnames(styles.loadOutButton, !loadOutOpen ? styles.closed : null)} onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        setLoadOutOpen(!loadOutOpen);
      }}>
        <img src='/images/loadout-down.svg'></img>
      </div>
      <div className={classnames(styles.loadout)}>
        {(() => {
          const numItems = 8;
          const items = Array(numItems);
          for (let i = 0; i < numItems; i++) {
            items[i] = (
              <div className={styles.item} key={i}>
                <div className={styles.label}>{i + 1}</div>
                <img src='/images/plus.svg'></img>
              </div>
            );
          }
          return items;
        })()}
        <div className={styles_.loadOutRight}>
          <div className={styles_.item}>
            <div className={styles_.label}>M</div>
            <img src='/images/micoff.svg'></img>
          </div>

          <div className={styles_.item}>
            <div className={classnames(styles_.label)}>ENTER</div>
            <img src='/images/message.svg'></img>
          </div>

        </div>
      </div>
      {/* <div style={{
        background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.50) -22.66%, rgba(10, 40, 50, 0.50) 103.86%)',
        backdropFilter: 'blur(100px)',
        width: '42px',
        height: '27px',
        position: 'absolute',
        left: '104.5%',
        top: '67%',
        zIndex: '0',
        transform: 'skew(30deg)',
      }}></div> */}
    </div>
  );
};
