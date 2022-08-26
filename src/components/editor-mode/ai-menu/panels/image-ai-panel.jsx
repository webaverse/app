import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import imageAI from '../../../../../ai/image/image-ai';
import materialColors from '../../../../../material-colors';
import {canvasHasContent} from '../../../../../util';
import styles from './image-ai-panel.module.css';

import * as sounds from '../../../../../sounds';

//

const size = 512;
const defaultPrompt = `mysterious forest`;
const defaultNoise = 0.85;

//

const baseColors = Object.keys(materialColors)
  .map(k => materialColors[k][400].slice(1))
  .concat([
    'FFFFFF',
    '000000',
  ]);

//

const presetNames = Object.keys(imageAI.generator);
const Preset = ({
    preset,
    setSelectedPreset,
}) => {
    return (
        <div
            className={styles.item}
            onClick={e => {
                setSelectedPreset(preset);
                sounds.playSoundName('menuBeepHigh');
            }}
        >{preset}</div>
    );
};

//

export function ImageAiPanel() {
    const [prompt, setPrompt] = useState('');
    const [noise, setNoise] = useState(defaultNoise);
    const [selectedColor, setSelectedColor] = useState(baseColors[0]);
    const [generating, setGenerating] = useState(false);
    const canvasRef = useRef();

    //

    const _stopPropagation = e => {
        e.stopPropagation();
    };

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
                    img = await imageAI.img2img(canvasEl, localPrompt, {
                        noise,
                    });
                } else {
                    img = await imageAI.txt2img(localPrompt, {
                        noise,
                    });
                }

                const ctx = canvasEl.getContext('2d');
                ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);
            } finally {
                setGenerating(false);
            }
        }
    };
    const _clear = () => {
        setPrompt('');
        setNoise(defaultNoise);

        const canvasEl = canvasRef.current;
        const ctx = canvasEl.getContext('2d');
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    };

    //
    
    return (
        <div className={classnames(styles.panel, styles.imageAiPanel)}>
            <textarea
              className={styles.textarea}
              value={prompt}
              onChange={e => {
                setPrompt(e.target.value);
              }}
              onKeyDown={_stopPropagation}
              placeholder={defaultPrompt}
              disabled={generating}
            ></textarea>
            <div className={styles.wrap}>
                <div className={classnames(styles.items, styles.leftPanel)}>
                    <div className={styles.item} onClick={e => {
                        sounds.playSoundName('menuBeepHigh');
                    }}>Draw</div>
                    <div className={styles.colors}>
                        {baseColors.map((color, i) => {
                            return (
                                <div
                                    className={classnames(styles.color, selectedColor === color ? styles.selected : null)}
                                    style={{
                                        backgroundColor: `#${color}`,
                                    }}
                                    onClick={e => {
                                        setSelectedColor(color);
                                        sounds.playSoundName('menuBeepHigh');
                                    }}
                                    key={i}
                                />
                            );
                        })}
                    </div>
                    <div className={styles.item} onClick={e => {
                        sounds.playSoundName('menuBeepHigh');
                    }}>Erase</div>
                    <div className={styles.item} onClick={e => {
                        sounds.playSoundName('menuBeepHigh');
                    }}>Move</div>
                    <div className={styles.item} onClick={e => {
                        sounds.playSoundName('menuBeepHigh');
                    }}>Cut</div>
                </div>
                <div className={classnames(styles.items, styles.rightPanel)}>
                    {presetNames.map((preset, i) =>
                        <Preset
                            preset={preset}
                            setSelectedPreset={_setPreset}
                            key={i}
                        />
                    )}
                </div>
                <canvas width={size} height={size} className={styles.canvas} ref={canvasRef} />
                <div className={styles.bottom}>
                    <div className={styles.buttons}>
                        <button
                            className={styles.button}
                            onClick={_generate}
                            disabled={generating}
                        >Generate image</button>
                        <button
                            className={styles.button}
                            onClick={_clear}
                        >Clear</button>
                    </div>
                    <div className={styles.options}>
                        <label className={styles.label}>
                            <span className={styles.text}>Noise</span>
                            <input
                                type='range'
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