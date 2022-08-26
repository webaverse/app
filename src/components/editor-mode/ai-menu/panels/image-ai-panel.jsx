import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import imageAI from '../../../../../ai/image/image-ai';
import materialColors from '../../../../../material-colors';
import styles from './image-ai-panel.module.css';

import * as sounds from '../../../../../sounds';

const size = 512;
const defaultPrompt = `mysterious forest`;
const defaultNoise = 0.85;

const presetNames = Object.keys(imageAI.generator);
const baseColors = Object.keys(materialColors)
  .map(k => materialColors[k][400].slice(1))
  .concat([
    'FFFFFF',
    '000000',
  ]);

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
    const _canvasHasContent = canvas => {
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, size, size);
            return imageData.data.some(n => n !== 0);
        } else {
            return true;
        }
    };

    //

    /* useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            
        }
    }, [canvasRef.current]); */

    //

    const _setPreset = preset => {
        // console.log('got generator 1', imageAI.generator, preset, imageAI.generator[preset]);
        const gen = imageAI.generator[preset]();
        // console.log('got generator 2', gen);

        setPrompt(gen.prompt);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (gen.canvas) {
            ctx.drawImage(gen.canvas, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
    const _generate = async () => {
        if (!generating) {
            setGenerating(true);

            try {
                const canvas = canvasRef.current;
                let img;
                const localPrompt = prompt || defaultPrompt;
                if (_canvasHasContent(canvas)) {
                    img = await imageAI.img2img(canvas, localPrompt);
                } else {
                    img = await imageAI.txt2img(localPrompt);
                }

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            } finally {
                setGenerating(false);
            }
        }
    };
    const _clear = () => {
        setPrompt('');

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

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
                    {presetNames.map((preset, i) => {
                        return (
                            <div
                              className={styles.item}
                              onClick={e => {
                                  _setPreset(preset);
                                  sounds.playSoundName('menuBeepHigh');
                              }}
                              key={i}
                            >{preset}</div>
                        );
                    })}
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
                        <label className={styles.option}>
                            <span>Noise</span>
                            <input
                                type='range'
                                className={styles.range}
                                min={0}
                                max={1}
                                step={0.01}
                                value={noise}
                                onChange={e => {
                                    setNoise(e.target.value);
                                }}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}