import { h } from 'preact';
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