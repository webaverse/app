import { React, useContext } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '/web_modules/htm.js';
import MockAddress from "../mock/Address.js"
import Profile from "../components/Profile.js"
import MockUserProfileData from "../mock/UserProfileData.js";
import { Context } from '../constants/Context.js';
const html = htm.bind(React.createElement)


const MyProfile = () => {
    const [ state, dispatch ] = useContext(Context);

    return html`
        <${Profile} userAddress=${state.publicKey} userData=${MockUserProfileData} />
    `
  };

  export default MyProfile;
