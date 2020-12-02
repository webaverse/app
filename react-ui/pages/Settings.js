import MockUserProfileData from '../mock/UserProfileData';
import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '/web_modules/htm.js';
import csz from '../web_modules/csz.js'

const html = htm.bind(React.createElement)

const SettingsPage = () => {
  const userName = MockUserProfileData.userName;
  const userAddress = MockUserProfileData.userAddress;
  const userMainnetAddress = MockUserProfileData.userMainnetAddress;

    return html`
      <div>
        <div class="settingsHeader">
            <h1> Settings for ${userName} </h1>
        </div>
        <div class="settingsBody">
            <div class="settingsBox webaverseInfo">
                <span class="settingsBoxHeader webaverseInfoHeader">Webaverse Wallet</span>
                <span class="settingsBoxAddress webaverseInfoAddress">${userAddress}</span>
                <span class="settingsBoxButtons webaverseInfoButtons"><button class="button settingsBoxButton webaverseInfoButtons">Copy Private Key</button></span>
            </div>
            <div class="settingsBox mainnetInfo">
                <span class="settingsBoxHeader mainnetInfoHeader">Webaverse Wallet</span>
                <span class="settingsBoxAddress mainnetInfoAddress">${userMainnetAddress}</span>
                <span class="settingsBoxButtons mainnetInfoButtons"><button class="button settingsBoxButton mainnetInfoButtons">Disconnect Wallet</button></span>
            </div>
        </div>
      </div>
    `;
  };

  export default SettingsPage;
