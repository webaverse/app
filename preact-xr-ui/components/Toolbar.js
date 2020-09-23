import { h } from 'preact';
import { useState } from 'preact/hooks';
import { uiSize, uiWorldSize, fullW, arrowW, wrapInnerW, margin, iconW, innerW, scrollbarW } from '../constants.js'
import '../styles/inventory.css';
import MakeIcons from './MakeIcons.js';

const Toolbar = (props) => {
    const [iconIndex, setIconIndex] = setState(0);
    const [styles, setStyles] = setState({});
    const [styleParams, setStyleParams] = useState({
        uiSize: uiSize,
        uiWorldSize: uiWorldSize,
        fullW: fullW,
        arrowW: arrowW,
        wrapInnerW: wrapInnerW,
        margin: margin,
        iconW: iconW,
        innerW: innerW,
        scrollbarW: scrollbarW
    });

    const makeStyles = () => {
        return (
            {
                body: {
                    display: 'flex',
                    width: `${styleParams.uiSize}px`,
                    height: `${styleParams.uiSize/2}px`,
                    fontFamily: 'Bangers',
                },
                wrap: {
                    display: 'flex',
                    width: `${styleParams.wrapInnerW}px`,
                    flexDirection: 'column',
                    overflow: 'hidden',
                },
                arrow: {
                    display: 'flex',
                    width: `${styleParams.wrapInnerW}px`,
                    height: `${styleParams.arrowW}px`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#000',
                    color: '#FFF',
                    fontSize: '100px',
                    transform: 'rotate(90deg)',
                },
                text: {
                    transform: 'rotate(90deg)',
                },
                icons: {
                    display: 'flex',
                    width: `${styleParams.wrapInnerW}px`,
                    height: `${styleParams.wrapInnerW}px`,
                    paddingTop: `${styleParams.margin}px`,
                    paddingLeft: `${styleParams.margin}px`,
                    flexWrap: 'wrap',
                },
                icon: {
                    display: 'flex',
                    position: 'relative',
                    width: `${styleParams.innerW}px`,
                    height: `${styleParams.innerW}px`,
                    marginRight: `${styleParams.margin}px`,
                    marginBottom: `${styleParams.margin}px`,
                },
                border: {
                    position: 'absolute',
                    width: `${styleParams.innerW/4}px`,
                    height: `${styleParams.innerW/4}px`,
                    border: `${styleParams.innerW/20}px solid #111`,
                },
                scrollbar: {
                    position: 'relative',
                    width: `${styleParams.scrollbarW}px`,
                    height: '100%',
                    backgroundColor: '#EEE',
                },
                details: {
                    display: 'flex',
                    padding: '50px',
                    backgroundColor: '#FFF',
                    flex: 1,
                    flexDirection: 'column',
                }
            }
        )
    }

    useEffect(() => {
        setStyles(makeStyles(styleParams));
    }, styleParams)

    return (
        <div class={styles.body}>
            <div class={styles.wrap}>
                <a class={styles.arrow} id="arrow-up"><div class={styles.text}>&lt;</div></a>
                <div class={styles.icons}>
                    <MakeIcons i={setIconIndex(++iconIndex)} styles={styles} />
                    <MakeIcons i={setIconIndex(++iconIndex)} styles={styles} />
                    <MakeIcons i={setIconIndex(++iconIndex)} styles={styles} />
                    <MakeIcons i={setIconIndex(++iconIndex)} styles={styles} />
                    <MakeIcons i={setIconIndex(++iconIndex)} styles={styles} />
                    <MakeIcons i={setIconIndex(++iconIndex)} styles={styles} />
                    <MakeIcons i={setIconIndex(++iconIndex)} styles={styles} />
                    <MakeIcons i={setIconIndex(++iconIndex)} styles={styles} />
                    <MakeIcons i={setIconIndex(++iconIndex)} styles={styles} />
                    <MakeIcons i={setIconIndex(++iconIndex)} styles={styles} />
                </div>
                <a class={styles.arrow} id="arrow-down"><div class={styles.text}>&gt;</div></a>
            </div>
            <a class={styles.scrollbar} id="scrollbar"></a>
            <div class={styles.details}>
                <h1>Details</h1>
                <p>Lorem ipsum</p>
            </div>
        </div>
    )
}
export default Toolbar;