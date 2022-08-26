import React, { useState, useEffect, useRef, useContext } from 'react';
import classnames from 'classnames';

import styles from './audio-ai-panel.module.css';

import audioAI from '../../../../../ai/audio/audio-ai';

const defaultPrompt = `insects chirp in a windy field`;

export function AudioAiPanel() {
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [audioBlobUrl, setAudioBlobUrl] = useState('');

    //

    const _generate = async () => {
        if (!generating) {
            setGenerating(true);

            try {
                const localPrompt = prompt || defaultPrompt;
                const audioBlob = await audioAI.txt2sound(localPrompt);
                
                _clear();
                
                const newAudioBlobUrl = URL.createObjectURL(audioBlob);
                setAudioBlobUrl(newAudioBlobUrl);
            } finally {
                setGenerating(false);
            }
        }
    };
    const _clear = () => {
        if (audioBlobUrl) {
            URL.revokeObjectURL(audioBlobUrl);
            setAudioBlobUrl('');
        }
    }

    //
  
    return (
        <div className={classnames(styles.panel, styles.audioAiPanel)}>
            <textarea
                className={styles.textarea}
                value={prompt}
                onChange={e => {
                    setPrompt(e.target.value);
                }}
                placeholder={defaultPrompt}
            ></textarea>
            {
                audioBlobUrl ? (
                    <audio className={styles.audio} src={audioBlobUrl} controls loop />
                ) : (
                    <div className={styles.audioPlaceholder} />
                )
            }
            <div className={styles.buttons}>
                <button className={styles.button} onClick={_generate} disabled={generating}>Generate sound</button>
                <button className={styles.button} onClick={_clear}>clear</button>
            </div>
        </div>
    );
}