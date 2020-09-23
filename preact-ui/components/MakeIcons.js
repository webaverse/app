
import { h, Component, render } from 'https://cdnjs.cloudflare.com/ajax/libs/preact/10.4.8/preact.module.min.js';
import { setState, useEffect } from 'https://cdnjs.cloudflare.com/ajax/libs/preact/10.4.8/hooks.module.min.js';
import { render as toStringRender } from 'https://cdn.jsdelivr.net/npm/preact-render-to-string@5.1.10/dist/index.min.js';
import { uiSize, uiWorldSize, fullW, arrowW, wrapInnerW, margin, iconW, innerW, scrollbarW } from '../constants.js'
import '../styles/inventory.css';

const MakeIcons = (props) => {
    return (
        <a class={props.styles.icon} id={`icon-${props.i}`}>
            <div class={`${props.styles.border} top-left`}></div>
            <div class={`${props.styles.border} top-right`}></div>
            <div class={`${props.styles.border} bottom-left`}></div>
            <div class={`${props.styles.border} bottom-right`}></div>
        </a>
    );
}
export default MakeIcons;