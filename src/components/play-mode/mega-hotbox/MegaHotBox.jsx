import React, {useState, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './MegaHotBox.module.css';
import { BigButton } from '../../../BigButton';

const width = 400;

const HoverableCard = ({
  imgUrl = '',
  // open = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [flip, setFlip] = useState(false);
  const [animate, setAnimate] = useState(false);

  /* const revokeObjectUrl = () => {
    URL.revokeObjectURL(imgUrl);
  }; */
  const _setFromEvent = e => {
    if (!animate) {
      // get the offest from the top left corner of this element
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // get the uv of the mouse hit, bnased on the dimensions of the element
      const u = x / rect.width;
      const v = y / rect.height;

      setRotateX(v * 0.2 * Math.PI);
      setRotateY(-u * 0.2 * Math.PI);
    }
  };

  useEffect(() => {
    if (animate) {
      const timeout = setTimeout(() => {
        setAnimate(false);
      }, 150);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [animate]);

  /* useEffect(() => {
    if (open && flip) {
      setFlip(false);
    }
  }, [open, flip]); */

  return (
    <div
      className={styles.hoverableCard}
      onClick={e => {
        setFlip(!flip);
        setAnimate(true);
      }}
      onMouseMove={e => {
        _setFromEvent(e);
        // setAnimate(false);
      }}
      onMouseEnter={e => {
        setHovered(true);
        _setFromEvent(e);
        setAnimate(false);
      }}
      onMouseLeave={e => {
        setHovered(false);
        setRotateX(0);
        setRotateY(0);
        // setAnimate(true);
      }}
    >
      {imgUrl ? (
        <img
          src={imgUrl}
          className={
            classnames(
              styles.image,
              hovered ? styles.hovered : null,
              animate ? styles.animate : null,
            )
          }
          style={{
            transform: `rotateY(${(rotateY + (flip ? Math.PI : 0)).toFixed(8)}rad) rotateX(${rotateX.toFixed(8)}rad)`,
          }}
          // onLoad={revokeObjectUrl}
          // onError={revokeObjectUrl}
        />
      ) : null}
    </div>
  );
};

export const MegaHotBox = ({
  open = true,
  name = '',
  description = '',
  imgUrl = '',
  onActivate = null,
  onClose = null,
}) => {
    return (
      <div className={ classnames(styles.megaHotBox, open ? styles.open : null) } >
        <div className={ styles.box } />
        <HoverableCard imgUrl={imgUrl} /*open={open}*/ />
        <div className={ styles.label }>
          <div className={ styles.background } />
          <div className={ styles.name }>{name}</div>
          <div className={ styles.description }>{description}</div>
        </div>
        <div className={ styles.buttons }>
          <BigButton
            highlight={false}
            onClick={e => {
              onActivate && onActivate(e);
              onClose && onClose(e);
            }}
          >Equip</BigButton>
          <BigButton
            highlight={false}
            onClick={e => {
              onClose && onClose(e);
            }}
          >Close</BigButton>
        </div>
      </div>
    );
};