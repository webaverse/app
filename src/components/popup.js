import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import styles from './popup.module.css';
import {preview} from '../../preview.js';

export const Popup = ({header, options = [], anchor, scroll}) => {
  const [previews, setPreviews] = React.useState({});
  const [prevOptionLen, setPreviousOptionsLen] = React.useState(0);
  const widthOfPopup = Math.min(0.22 * window.innerWidth, 400);

  const element = anchor.current.getBoundingClientRect();
  const t = (element.top + element.height) + 25 + 'px';
  const l = ((element.left + element.width / 2) - (widthOfPopup / 2)) + 'px';

  if (options) {
    if (prevOptionLen !== options.length) {
      setPreviousOptionsLen(options.length);
      options.map((option, index) => {
        if (option.iconPreview) {
          preview(option.iconPreview, option.iconExtension, 'png', 32, 29).then(_p => {
            const newPreviewState = previews;
            newPreviewState[option.iconPreview] = _p.url;
            setPreviews(newPreviewState);
          }).catch(e => {
            console.log(e);
          });
        }
      });
    }
  }

  return ReactDOM.createPortal(
    <div className={styles.popup} style={{
      top: t,
      left: l,
    }}>
      <div className={classnames(styles.popupHeader)}>
        {header}
      </div>
      <div className={classnames(styles.popupOptionBg, scroll ? styles.observescroll : null)}>

        {options.map((option, index) => {
          return (
            <div key={index} style={{display: 'contents'}}>
              <div onClick={option.action} className={classnames(styles.popupOption)}>
                <div className={styles.popupOptionContent}>
                  {option.icon ? <img src={previews[option.iconPreview] || option.icon || '/images/loader.gif'} className={styles.icon} style={{marginRight: '15px'}} /> : null}
                  <span>
                    {option.text}
                  </span>
                </div>
                {option.isRemovable ? <div onClick={e => {
                  if (typeof option.isRemovable === 'function') {
                    option.isRemovable(e);
                  }
                }} className={styles.removable} > <img src='/images/cross.svg' /></div> : null}
              </div>
              {index < options.length - 1 ? <hr className={classnames(styles.line, styles.popupOptionBg)}/> : null }
            </div>
          );
        })}

      </div>
    </div>, document.body,
  );
};
