import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import Profile from "./Profile.js";
import htm from '/web_modules/htm.js';

const html = htm.bind(React.createElement)

const CreatorProfilePage = (props) => {
    console.log("Props are", props);
    return html`
    <div>
        <${React.Suspense} fallback=${html`<div></div>`}>
        ${props.address && html`
            <${Profile} creatorAddress=${props.address} view=${props.view} />
            `}
        <//>
    </div>
    `
};

export default CreatorProfilePage;
