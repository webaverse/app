import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import styles from './popup.module.css';

export const Popup = ({header, options, anchor, scroll}) => {
  if (anchor) {
    console.log(anchor);
  }

  const element = anchor.current.getBoundingClientRect();
  const t = (element.top + element.height) + 25 + 'px';
  const l = ((element.left + element.width / 2) - 200) + 'px';

  console.log(element);

  return ReactDOM.createPortal(
    <div className={styles.popup} style={{
      top: t,
      left: l,
    }}>
      <div className={classnames(styles.popupHeader)}>
        {header}
      </div>
      <div className={classnames(styles.popupOptionBg, scroll? styles.observescroll : null)}>

        {options.map((option, index) => {
          return (
            <div key={index}>
              <div onClick={option.action} className={classnames(styles.popupOption)}>
                <div className={styles.popupOptionContent}>
                  {option.icon ? <img src={option.icon} className={styles.icon} style={{marginRight: '15px'}} /> : null}
                  <span>
                    {option.text}
                  </span>
                </div>
              </div>
              {index < options.length - 1 ? <hr className={classnames(styles.line, styles.popupOptionBg)}/> : null }
            </div>
          );
        })}

      </div>
    </div>, document.body,
  );
};