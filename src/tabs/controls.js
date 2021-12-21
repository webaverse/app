import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import styles from '../Footer.module.css';
import styles_ from '../styles/controls.module.css';

export const Controls = () => {
  const [controlsOpen, setControlsOpen] = useState(true);

  return (
    <>
      <div className={classnames(styles.helper, styles.right, !controlsOpen ? styles_.hide : null)}>
        <div className={styles_.closed} onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setControlsOpen(false);
        }}>
          <img src='/images/cross.svg' />
        </div>
        <div className={styles.chat} id="chat">
          <div className={styles.messages} id="chat-messages"></div>
          <input type="text" className={styles.input} />
        </div>
        <div className={styles.keys}>
          <div className={classnames(styles.row, styles.moveRow)}>
            <div className={styles.key}></div>
            <div className={styles.key}>W</div>
            <div className={styles.key}></div>
          </div>
          <div className={classnames(styles.row, styles.moveRow)}>
            <div className={styles.key}>A</div>
            <div className={styles.key}>S</div>
            <div className={styles.key}>D</div>
            <div className={classnames(styles.row, styles.labelMove, styles.moveRow)}>Move</div>
          </div>

          <div className={styles.row}>
            <div className={styles.keys}>
              <div className={styles.row}></div>
              <div className={styles.row}>
                <div className={styles.key}>F</div>
                <div className={classnames(styles.label, styles.center)}>Fly</div>
              </div>
            </div>
            <div className={styles.keys}>
              <div className={styles.row}></div>
              <div className={styles.row}>
                <div className={styles.key}><i className="far fa-mouse-alt"></i></div>
                <div className={classnames(styles.label, styles.center)}>Camera</div>
              </div>
            </div>
            <div className={styles.keys}>
              <div className={styles.row}></div>
              <div className={styles.row}>
                <div className={styles.key}>T</div>
                <div className={classnames(styles.label, styles.center)}>Talk</div>
              </div>
            </div>
            <div className={styles.keys}>
              <div className={styles.row}></div>
              <div className={styles.row}>
                <div className={styles.key}>U</div>
                <div className={classnames(styles.label, styles.center)}>Upload</div>
              </div>
            </div>
            <div className={styles.keys}>
              <div className={styles.row}></div>
              <div className={styles.row}>
                <div className={styles.key}>Enter</div>
                <div className={classnames(styles.label, styles.center)}>Text chat</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={classnames(styles_.item, controlsOpen ? styles_.hide : null)} onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        setControlsOpen(true);
      }}>
        <img src='/images/controls.svg'></img>
        <div className={styles_.label}>Show<br/>Controls</div>
      </div>
    </>
  );
};
