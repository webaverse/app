import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { uiSize, uiWorldSize, fullW, arrowW, wrapInnerW, margin, iconW, innerW, scrollbarW } from '../constants.js'
import '../styles/inventory.css';
import MakeIcons from './MakeIcons.js';

const Inventory = (props) => {
    let [iconIndex, setIconIndex] = useState(0);
    const icons = ['lol', 'lol', 'lol', 'lol', 'lol', 'lol', 'lol', 'lol', 'lol', 'lol']
    
    const styles =  {
        body: `
            display: flex;
            width: ${uiSize}px;
            height: ${uiSize/2}px;
            fontFamily: Bangers;
        `,
        wrap: `
            display: flex;
            width: ${wrapInnerW}px;
            flexDirection: column;
            overflow: hidden;
        `,
        arrow: `
            display: flex;
            width: ${wrapInnerW}px;
            height: ${arrowW}px;
            justifyContent: center;
            alignItems: center;
            backgroundColor: #000;
            color: black;
            fontSize: 100px;
            transform: rotate(90deg);
        `,
        text: `
            transform: rotate(90deg);
        `,
        icons: `
            display: flex;
            width: ${wrapInnerW}px;
            height: ${wrapInnerW}px;
            paddingTop: ${margin}px;
            paddingLeft: ${margin}px;
            flexWrap: 'wrap';
        `,
        icon: `
            display: flex;
            position: relative;
            width: ${innerW}px;
            height: ${innerW}px;
            marginRight: ${margin}px;
            marginBottom: ${margin}px;
        `,
        border: `
            position: absolute;
            width: ${innerW/4}px;
            height: ${innerW/4}px;
            border: ${innerW/20}px solid #111;
        `,
        scrollbar: `
            position: relative;
            width: ${scrollbarW}px;
            height: 100%;
            backgroundColor: #EEE;
        `,
        details: `
            display: flex,
            padding: 50px,
            backgroundColor: #FFF,
            flex: 1,
            flexDirection: column,
        `,
    }

    return (
        <div style={styles.body}>
            <div style={styles.wrap}>
                <a style={styles.arrow} id="arrow-up"><div style={styles.text}>&lt;</div></a>
                <div style={styles.icons}>
                    {
                        icons.map((value, index) => {
                            return <MakeIcons i={index} styles={styles} />
                        })
                    }
                </div>
                <a style={styles.arrow} id="arrow-down"><div style={styles.text}>&gt;</div></a>
            </div>
            <a style={styles.scrollbar} id="scrollbar"></a>
            <div style={styles.details}>
                <h1>Details</h1>
                <p>Lorem ipsum</p>
                <button onClick={() => console.log('im cool and tired')}></button>
            </div>
        </div>
    )
}

render(<Inventory />, document.getElementById('demo-memes'));

export default Inventory;