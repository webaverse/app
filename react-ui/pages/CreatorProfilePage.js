import { React, useEffect } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '/web_modules/htm.js';
import MockAddress from "../mock/Address.js"
import Profile from "../components/Profile.js"
import MockUserProfileData from "../mock/UserProfileData.js";

const html = htm.bind(React.createElement)

const CreatorProfilePage = () => {
    return html`
        <${Profile} userAddress=${MockAddress} userData=${MockUserProfileData} />
    `
  };

  export default CreatorProfilePage;
