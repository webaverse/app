import { React, useEffect } from '/web_modules/es-react.js';
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
