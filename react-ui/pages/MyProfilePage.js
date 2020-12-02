import { React, useContext } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '/web_modules/htm.js';
import MockAddress from "../mock/Address.js"
import Profile from "../components/Profile.js"
import MockUserProfileData from "../mock/UserProfileData.js";
import { UserContext } from '../constants/UserContext.js';

const html = htm.bind(React.createElement)


const MyProfile = () => {
    const userContext = useContext(UserContext);
    return html`
        <${Profile} userAddress=${MockAddress} userData=${MockUserProfileData} />
    `
  };

  export default MyProfile;
