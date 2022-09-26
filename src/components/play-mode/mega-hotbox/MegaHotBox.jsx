import React, {useState, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './MegaHotBox.module.css';
import {BigButton} from '../../../BigButton';
import {PlaceholderImg} from '../../../PlaceholderImg';
import {ImageBitmapCanvas} from '../../../ImageBitmapCanvas';
import {loadImage} from '../../../../util.js';

const cardFlipAnimationTime = 200;

const Card = ({
  imageBitmap = null,
  backImageBitmap = null,
  // open = false,
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [flip, setFlip] = useState(false);
  const [hovered, setHovered] = useState(false);
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
      }, cardFlipAnimationTime);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [animate]);

  useEffect(() => {
    if (!imageBitmap && flip) {
      setFlip(false);
    }
  }, [imageBitmap, flip]);

  return (
    <div
      className={styles.card}
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
      <div
        className={classnames(
          styles.placeholderImgWrap,
          imageBitmap ? null : styles.loading,
        )}
      >
        <PlaceholderImg className={styles.placeholderImg} src='./images/arc-white.svg' />
      </div>
      <ImageBitmapCanvas
        imageBitmap={imageBitmap}
        backImageBitmap={backImageBitmap}
        className={styles.imageBitmapCanvas}
        canvasClassName={classnames(
          styles.canvas,
          hovered ? styles.hovered : null,
          animate ? styles.animate : null,
        )}
        rotateX={rotateX}
        rotateY={rotateY}
        flip={flip}
      />
    </div>
  );
};

export const MegaHotBox = ({
  open = true,
  name = '',
  description = '',
  imageBitmap = null,
  onActivate = null,
  onClose = null,
}) => {
  const [backImageBitmap, setBackImageBitmap] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const img = await loadImage('./images/cardback-01.svg');
      if (!live) return;

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      // console.log('got canvas size', canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      setBackImageBitmap(canvas);

      /* const imageBitmap = await createImageBitmap(canvas);
        if (!live) return;
        setBackImageBitmap(imageBitmap); */
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
      <div className={ classnames(styles.megaHotBox, open ? styles.open : null) } >
        <div className={ styles.box } />

        <Card
          imageBitmap={imageBitmap}
          backImageBitmap={backImageBitmap}
        />

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
