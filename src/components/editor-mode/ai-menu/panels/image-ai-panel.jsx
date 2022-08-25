import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import imageAI from '../../../../../ai/image/image-ai';
import materialColors from '../../../../../material-colors';
import styles from './image-ai-panel.module.css';

const size = 512;
const presetNames = Object.keys(imageAI.generator);
const baseColors = Object.keys(materialColors)
  .map(k => materialColors[k][400].slice(1))
  .concat([
    'FFFFFF',
    '000000',
  ]);

export function ImageAiPanel() {
    const [selectedColor, setSelectedColor] = useState(baseColors[0]);
    const canvasRef = useRef();

    //

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            
        }
    }, [canvasRef.current]);

    //

    const _generate = () => {
        /* const output = outputTextarea.current.value;
        const dataUri = metaversefile.createModule(output);

        (async () => {

            // XXX unlock this
            // await metaversefile.load(dataUri);

        })();

        setState({ openedPanel: null }); */
    };

    //
    
    return (
        <div className={classnames(styles.panel, styles.imageAiPanel)}>
            <textarea className={styles.textarea} placeholder="mysterious forest"></textarea>
            <div className={styles.wrap}>
                <div className={classnames(styles.items, styles.leftPanel)}>
                    <div className={styles.item}>Draw</div>
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
                                    }}
                                    key={i}
                                />
                            );
                        })}
                    </div>
                    <div className={styles.item}>Erase</div>
                    <div className={styles.item}>Move</div>
                    <div className={styles.item}>Cut</div>
                </div>
                <div className={classnames(styles.items, styles.rightPanel)}>
                    {presetNames.map((preset, i) => {
                        return (
                            <div className={styles.item} key={i}>{preset}</div>
                        );
                    })}
                </div>
                <canvas width={size} height={size} className={styles.canvas} ref={canvasRef} />
                <div className={styles.buttons}>
                    <button className={styles.button} onClick={_generate}>Generate image</button>
                </div>
            </div>
        </div>
    );
}