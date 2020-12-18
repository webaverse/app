import { React, useContext, useState, useEffect } from 'https://unpkg.com/es-react@16.13.1/dev';
import ActionTypes from '../constants/ActionTypes.js';
import { Context } from '../constants/Context.js';
import css from '../web_modules/csz.js';
import { EditableTextField } from './EditableTextField.js';
import htm from '../web_modules/htm.js';

export const html = htm.bind(React.createElement)

const styles = css`${window.locationSubdirectory}/components/SettingsPage.css`

const SettingsPage = () => {
  const { state, dispatch } = useContext(Context);
  const [mainnetAddresInputState, setMainnetAddressInput] = useState("");
  const [toggleCopyKeyOpen, setToggleCopyKeyOpen] = useState(false)
  const [toggleAddGreaseOpen, setToggleAddGreaseOpen] = useState(false)
  const [toggleWithdrawGreaseOpen, setToggleWithdrawGreaseOpen] = useState(false)
  const [toggleDepositWithdrawOpen, setToggleDepositWithdrawOpen] = useState(false)
  const [toggleDisconnectOpen, setToggleDisconnectOpen] = useState(false)
  const [toggleConnectMetamaskOpen, setToggleConnectMetamaskOpen] = useState(false)
  const [toggleSingOutSwitchOpen, setToggleSingOutSwitchOpen] = useState(false)
  const [toggleAccountDeleteOpen, setToggleAccountDeleteOpen] = useState(false)
  const [toggleEditNameOpen, setToggleEditNameOpen] = useState(false)

  useEffect(() => {
    console.log("state", state);
  }, [])

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
  setName(textFieldInput, state, () => {
    console.log("Success");
  }, (error) => { console.log("Error", error)})

  const toggleCopyKey = () => {
    setToggleCopyKeyOpen(!toggleCopyKeyOpen)
  }

  const toggleAddGrease = () => {
    setToggleAddGreaseOpen(!toggleAddGreaseOpen)
  }

  const toggleWithdrawGrease = () => {
    setToggleWithdrawGreaseOpen(!toggleWithdrawGreaseOpen)
  }

  const toggleDepositWithdraw = () => {
    setToggleDepositWithdrawOpen(!toggleDepositWithdrawOpen)
  }

  const toggleDisconnect = () => {
    setToggleDisconnectOpen(!toggleDisconnectOpen)
  }

  const toggleConnectMetamask = () => {
    setToggleConnectMetamaskOpen(!toggleConnectMetamaskOpen)
  }

  const toggleSingOutSwitch = () => {
    setToggleSingOutSwitchOpen(!toggleSingOutSwitchOpen)
  }

  const toggleAccountDelete = () => {
    setToggleAccountDeleteOpen(!toggleAccountDeleteOpen)
  }

  const toggleEditName = () => {
    setToggleEditNameOpen(!toggleEditNameOpen)
  }

  return html`
      

    <div className="${styles} settingsPage">
      <div className="settingsHeader">
        <h1 className="settingsHeaderTitle">account settings</h1>
      </div>
      <div className="settingsBody">

        <div className="settingsBox webaverse">
          <div className="settingsBoxHeader webaverseHeader">
            <span className="settingsBoxHeaderTitle webaverseHeaderTitle">webaverse wallet</span>
          </div>
          <span className="webaverseAddress" onClick=${copyAddress}>${state.address}</span>
          <div className="settingsBoxAccordionItem webaverseCopyKey">
            <div className="accordionTitle" onClick=${toggleCopyKey}>
              <span className="accordionTitleValue">copy private key</span>
              <span className="accordionIcon ${toggleCopyKeyOpen ? 'reverse' : ''}"></span>
            </div>
            ${toggleCopyKeyOpen && html`
            <div className="accordionDropdown">
              <button className="submit btnCopyKey" type="submit" onClick="${copyPrivateKey}">Copy Private Key</button>
            </div>
            `}
          </div>
        </div>

        ${state.mainnetAddress !== null ? html`
        <div className="settingsBox mainnetConnected">
          <div className="settingsBoxHeader mainnetConnectedHeader">
            <span className="settingsBoxHeaderTitle mainnetConnectedTitle">mainnet wallet</span>
            <span className="settingsBoxHeaderStatus mainnetConnectedNetworkStatus">connected with metamask</span>
          </div>

          <div className="settingsBoxAccordionItem mainnetConnectedAddGrease">
            <div className="accordionTitle" onClick=${toggleAddGrease}>
              <span className="accordionTitleValue">Add GREASE to Webaverse Wallet</span>
              <span className="accordionIcon ${toggleAddGreaseOpen ? 'reverse' : ''}"></span>
            </div>
            ${toggleAddGreaseOpen && html`
            <div className="accordionDropdown">
              <button className="submit" type="submit" onClick="${() => console.log('Add GREASE')}">Add GREASE to Webaverse Wallet</button>
            </div>
            `}
          </div>
          
          <div className="settingsBoxAccordionItem mainnetConnectedWithdrawGrease">
            <div className="accordionTitle" onClick=${toggleWithdrawGrease}>
              <span className="accordionTitleValue">Withdraw GREASE</span>
              <span className="accordionIcon ${toggleWithdrawGreaseOpen ? 'reverse' : ''}"></span>
            </div>
            ${toggleWithdrawGreaseOpen && html`
            <div className="accordionDropdown">
              <button className="submit" type="submit" onClick="${() => console.log('Withdraw GREASE')}">Withdraw GREASE</button>
            </div>
            `}
          </div>

          <div className="settingsBoxAccordionItem mainnetConnectedDepositWithdraw" >
            <div className="accordionTitle" onClick=${toggleDepositWithdraw}>
              <span className="accordionTitleValue">Deposit / Withdraw NFTs</span>
              <span className="accordionIcon ${toggleDepositWithdrawOpen ? 'reverse' : ''}"></span>
            </div>
            ${toggleDepositWithdrawOpen && html`
            <div className="accordionDropdown">
              <button className="submit" type="submit" onClick="${() => console.log('Deposit / Withdraw NFTs')}">Deposit / Withdraw NFTs</button>
            </div>
            `}
          </div>

          <div className="settingsBoxAccordionItem mainnetConnectedDisconnect" >
            <div className="accordionTitle" onClick=${toggleDisconnect}>
              <span className="accordionTitleValue">Disconnect From Account</span>
              <span className="accordionIcon ${toggleDisconnectOpen ? 'reverse' : ''}"></span>
            </div>
            ${toggleDisconnectOpen && html`
            <div className="accordionDropdown">
              <div className="buttonContainer">
                <button className="submit settingsBoxButton mainnetInfoButton" onClick=${disconnectMainnetWallet}>Disconnect Wallet</button>
              </div>
            </div>
            `}
          </div>
        </div>

        ` : html`
        <div className="settingsBox mainnetNotConnected">
          <div className="settingsBoxHeader mainnetNotConnectedHeader">
            <span className="settingsBoxHeaderTitle mainnetNotConnectedTitle">mainnet wallet</span>
            <span className="settingsBoxHeaderStatus mainnetNotConnectedNetworkStatus">Metamask Not Found</span>
          </div>
          <div className="settingsBoxAccordionItem mainnetNotConnectedConnectMetamask">
            <div className="accordionTitle" onClick=${toggleConnectMetamask}>
              <span className="accordionTitleValue">Connect With Metamask</span>
              <span className="accordionIcon ${toggleConnectMetamaskOpen ? 'reverse' : ''}"></span>
            </div>
            ${toggleConnectMetamaskOpen && html`
            <div className="accordionDropdown mainnetNotConnectedDropdown">
              <input type="text" placeholder="Login with email or private key" onChange=${(e) => setMainnetAddressInput({ value: e.target.value })}/>
              <button className="submit settingsBoxButton mainnetInfoButton" onClick=${connectMainnetWallet}>Connect Wallet</button>
            </div>
            `}
          </div>
        </div>
        `}

        <div className="settingsBox accountActions">
          <div className="settingsBoxHeader accountActionsHeader">
            <span className="settingsBoxHeaderTitle accountActionsTitle">Account Actions</span>
          </div>
          <div className="settingsBoxAccordionItem accountActionsSingOutSwitch">
            <div className="accordionTitle" onClick=${toggleSingOutSwitch}>
              <span className="accordionTitleValue">Sign Out / Switch to Anonymous Account</span>
              <span className="accordionIcon ${toggleSingOutSwitchOpen ? 'reverse' : ''}"></span>
            </div>
            ${toggleSingOutSwitchOpen && html`
            <div className="accordionDropdown accountActionsSingOutDropdown">
              <div className="buttonContainer">
                <button className="submit settingsBoxButton singOutButton" onClick=${() => console.log('sing Out')}>Sing Out</button>
              </div>
            </div>
            `}
          </div>
          
          <div className="settingsBoxAccordionItem accountActionsSingOutSwitch">
            <div className="accordionTitle" onClick=${toggleAccountDelete}>
              <span className="accordionTitleValue">Delete Account</span>
              <span className="accordionIcon ${toggleAccountDeleteOpen ? 'reverse' : ''}"></span>
            </div>
            ${toggleAccountDeleteOpen && html`
            <div className="accordionDropdown accountActionsSingOutDropdown">
              <div className="buttonContainer">
                <button className="submit settingsBoxButton singOutButton" onClick=${() => console.log('Account Deleted')}>Delete Account</button>
              </div>
            </div>
            `}
          </div>

          <div className="settingsBoxAccordionItem accountActionsEditName">
            <div className="accordionTitle" onClick=${toggleEditName}>
              <span className="accordionTitleValue">Edit Name</span>
              <span className="accordionIcon ${toggleEditNameOpen ? 'reverse' : ''}"></span>
            </div>
            ${toggleEditNameOpen && html`
            <div className="accordionDropdown accountActionsEditNameDropdown">
              <${EditableTextField} value=${state.name} valueIfNull=${'<Username>'} className=${`${styles} settingsNameField`} callback=${updateName} />
            </div>
            `}
          </div>
        </div>

      </div>
    </div>
    `;
};

export default SettingsPage;