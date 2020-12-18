import { React, useContext, useState, useEffect } from 'https://unpkg.com/es-react@16.13.1/dev';
import Profile from "../components/Profile.js";
import { Context } from '../constants/Context.js';
import ActionTypes from '../constants/ActionTypes.js';

import htm from '../web_modules/htm.js';
const html = htm.bind(React.createElement)

const MyProfile = () => {
    const { state, dispatch } = useContext(Context);
    return html`
        <${React.Suspense} fallback=${html`<div></div>`}>
            <${Profile} creatorAddress=${state.address} />
        <//>
    `
};

export default MyProfile;
