import { React, useContext, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import ActionTypes from '../constants/ActionTypes.js';
import { Context } from '../constants/Context.js';
import csz from '../web_modules/csz.js';
import { EditableTextField } from './EditableTextField.js';
import htm from '/web_modules/htm.js';

export const html = htm.bind(React.createElement)

const styles = csz`/components/Profile.css`

const SettingsPage = () => {
  const { state, dispatch } = useContext(Context);
  const [mainnetAddresInputState, setMainnetAddressInput] = useState("");


  const connectMainnetWallet = (e) => {
    e.preventDefault();
    dispatch({ type: ActionTypes.ConnectMainnetWallet, payload: { address: mainnetAddresInputState } });
  }

  const disconnectMainnetWallet = (e) => {
    e.preventDefault();
    dispatch({ type: ActionTypes.DisconnectMainnetWallet });
  }

  const copyAddress = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(state.address);
    console.log("Copied address to clipboard", state.address);
  };

  const copyPrivateKey = (e) => {
    e.preventDefault();

    navigator.clipboard.writeText(state.loginToken.mnemonic);
    console.log("Copied private key to clipboard", state.loginToken.mnemonic);
  };

  const updateName = (textFieldInput) =>
    dispatch({ type: ActionTypes.ChangeName, payload: { name: textFieldInput } });

  return html`
      <div className="${styles} settingsPage">
        <div className="settingsHeader">
            <h1> User Settings </h1>
        </div>
        <div className="settingsBody">
        <div className="settingsBox userInfo">

        </div>

            <div className="settingsBox webaverseInfo">
                <span className="settingsBoxHeader webaverseInfoHeader">Webaverse Wallet</span>
                <${EditableTextField} value=${state.name} valueIfNull=${'<Username>'} className=${`${styles} settingsNameField`} callback=${updateName} />
                <span className="settingsBoxAddress webaverseInfoAddress">${state.address}</span>
                <button className="submit" type="submit" onClick="${copyAddress}">Copy Address</button>
                <button className="submit" type="submit" onClick="${copyPrivateKey}">Copy Private Key</button>
            </div>
            <div className="settingsBox mainnetInfo">
                <span className="settingsBoxHeader mainnetInfoHeader">Webaverse Wallet</span>
                ${state.mainnetAddress !== null ? html`
                <div className="settingsBoxMainnetConnected">
                  <span className="settingsBoxAddress mainnetInfoAddress">${state.mainnetAddress}</span>
                  <button className="button settingsBoxButton mainnetInfoButton" onClick=${disconnectMainnetWallet}>Disconnect Wallet</button>
                </div>
                ` : html`
                <div className="settingsBoxMainnetNotConnected">
                  <input type="text" placeholder="Login with email or private key" onChange=${(e) => setMainnetAddressInput({ value: e.target.value })}/>
                  <button className="button settingsBoxButton mainnetInfoButton" onClick=${connectMainnetWallet}>Connect Wallet</button>
                </div>
                `}
            </div>
        </div>
      </div>
    `;
};

export default SettingsPage;
