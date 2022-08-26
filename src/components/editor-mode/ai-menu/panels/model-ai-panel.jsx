import React, { useState, useEffect, useRef, useContext } from 'react';
import classnames from 'classnames';
import imageAI from '../../../../../ai/image/image-ai';

import styles from './model-ai-panel.module.css';

const size = 32;
const defaultPrompt = imageAI.generator.backpack.defaultPrompt;
const defaultNoise = 0.85;

export function ModelAiPanel() {
    const [prompt, setPrompt] = useState('');
    const [noise, setNoise] = useState(defaultNoise);
    const [generating, setGenerating] = useState(false);
    const canvasRef = useRef();
  
    //
  
    const _generate = async () => {
        setGenerating(true);

        try {
            const canvas = canvasRef.current;
            const localPrompt = prompt || defaultPrompt;
            
            const img = await imageAI.txt2img(localPrompt, {
                noise,
            });

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } finally {
            setGenerating(false);
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
    );
}