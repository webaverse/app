import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import Profile from "./Profile.js";
import htm from '/web_modules/htm.js';

const html = htm.bind(React.createElement)

const CreatorProfilePage = () => {
    const address = new URLSearchParams(window.location.search).get('id');
    console.log("Addres is", address);
    return html`
    <div>
        <${React.Suspense} fallback=${html`<div></div>`}>
        ${address && html`
            <${Profile} userAddress=${address} />
            `}
        <//>
    </div>
    `
};

export default CreatorProfilePage;
