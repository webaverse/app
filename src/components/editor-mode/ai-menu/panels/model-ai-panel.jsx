import React, {useState, useEffect, useRef, useContext} from 'react';
import classnames from 'classnames';
import imageAI from '../../../../../ai/image/image-ai';
import {canvasHasContent} from '../../../../../util';

import styles from './model-ai-panel.module.css';

import * as sounds from '../../../../../sounds';

//

const size = 32;
const fullSize = 512;
const defaultPrompt = imageAI.generator.backpack.defaultPrompt;
const defaultNoise = 0.85;

//

const presetNames = Object.keys(imageAI.generator);
const Preset = ({preset, setSelectedPreset}) => {
  return (
    <div
      className={styles.item}
      onClick={e => {
        setSelectedPreset(preset);
        sounds.playSoundName('menuBeepHigh');
      }}
    >
      {preset}
    </div>
  );
};

//

export function ModelAiPanel() {
  const [prompt, setPrompt] = useState('');
  const [noise, setNoise] = useState(defaultNoise);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef();

  //

  const _setPreset = preset => {
    const gen = imageAI.generator[preset]();

    setPrompt(gen.prompt);

    const canvasEl = canvasRef.current;
    const ctx = canvasEl.getContext('2d');
    if (gen.canvas) {
      ctx.drawImage(gen.canvas, 0, 0, canvasEl.width, canvasEl.height);
    } else {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }
  };
  const _generate = async () => {
    if (!generating) {
      setGenerating(true);

      try {
        const canvasEl = canvasRef.current;
        let img;
        const localPrompt = prompt || defaultPrompt;
        if (canvasHasContent(canvasEl)) {
          const canvas2 = document.createElement('canvas');
          canvas2.width = fullSize;
          canvas2.height = fullSize;
          const ctx2 = canvas2.getContext('2d');
          ctx2.imageSmoothingEnabled = false;
          ctx2.drawImage(canvasEl, 0, 0, canvas2.width, canvas2.height);

          img = await imageAI.img2img(canvas2, localPrompt, {
            noise,
          });
        } else {
          img = await imageAI.txt2img(localPrompt, {
            noise,
          });
        }

        const ctx = canvasEl.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);
      } finally {
        setGenerating(false);
      }
    }
  };
  const _clear = () => {
    setPrompt('');
    setNoise(defaultNoise);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  //

  return (
    <div className={classnames(styles.panel, styles.modelAiPanel)}>
      <textarea
        className={styles.textarea}
        value={prompt}
        onChange={e => {
          setPrompt(e.target.value);
        }}
        placeholder={defaultPrompt}
        disabled={generating}
      ></textarea>
      <div className={styles.wrap}>
        <div className={classnames(styles.items, styles.rightPanel)}>
          {presetNames.map((preset, i) => (
            <Preset preset={preset} setSelectedPreset={_setPreset} key={i} />
          ))}
        </div>
        <canvas
          width={size}
          height={size}
          className={styles.canvas}
          ref={canvasRef}
        />
        <div className={styles.bottom}>
          <div className={styles.buttons}>
            <button
              className={styles.button}
              onClick={_generate}
              disabled={generating}
            >
              Generate image
            </button>
            <button className={styles.button} onClick={_clear}>
              Clear
            </button>
          </div>
          <div className={styles.options}>
            <label className={styles.label}>
              <span className={styles.text}>Noise</span>
              <input
                type="range"
                className={styles.range}
                min={0}
                max={1}
                step={0.01}
                value={noise}
                onChange={e => {
                  const newNoise = parseFloat(e.target.value);
                  setNoise(newNoise);
                }}
              />
              <span className={styles.value}>{noise}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
