import { useContext, useState } from 'https://unpkg.com/es-react/dev';
import ActionTypes from '../constants/ActionTypes.js';
import { Context } from '../constants/Context.js';
import css from '../web_modules/csz.js';
import { Link } from '../web_modules/@reach/router.js';
import { discordOauthUrl } from '../webaverse/constants.js'

const styles = css`${window.locationSubdirectory}/components/NavBar.css`
const stylesMediaMedium = css`${window.locationSubdirectory}/components/NavBarMediaMedium.css`
const stylesMediaSmall = css`${window.locationSubdirectory}/components/NavBarMediaSmall.css`

const defaultAvatarImage = window.locationSubdirectory + "/images/DefaultUser_SmallCircle.svg";

const webaverseLogo = window.locationSubdirectory + "/images/Webaverse_Logo.svg";

const NavBarUserLoginForm = () => {

  const [inputState, setInputState] = useState("");
  const [toggleSinInOpen, setToggleItemOpen] = useState(false)
  const [toggleEmailLoginOpen, setToggleEmailLoginOpen] = useState(false)
  const [toggleCopyKeyOpen, setToggleCopyKeyOpen] = useState(false)

  const handleChange = (event) => {
    setInputState({ value: event.target.value });
  }

  const { state, dispatch } = useContext(Context);

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch({ type: ActionTypes.LoginWithEmailOrPrivateKey, payload: { emailOrPrivateKey: inputState.value } });
  }

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch({ type: ActionTypes.Logout});
  }

  const copyAddress = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(state.address);
    console.log("Copied address to clipboard", state.address);
  };
  
  const copyPrivateKey = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(state.loginToken.mnemonic);
    console.log("Login token is", state.loginToken);
    console.log("Copying mneomnic", state.loginToken.mnemonic);
    console.log("Copied private key to clipboard", state.loginToken.mnemonic);
  };

  const toggleSingIn = () => {
    setToggleItemOpen(!toggleSinInOpen)
  }

  const toggleEmailLogin = () => {
    setToggleEmailLoginOpen(!toggleEmailLoginOpen)
  }

  const toggleCopyKey = () => {
    setToggleCopyKeyOpen(!toggleCopyKeyOpen)
  }

  return html`
    <div className="loginForm">
      <span className="formAddressValue">${state.address}</span>
      <button 
        className="submit formBtnCopyAdress" 
        type="submit" 
        data-address=${state?.address}
        onClick="${copyAddress}"
      >
        Copy Public Address
      </button>
      <span className="loginFormInfoTitle ${!state?.loginToken?.unregistered ? 'hidden' : ''}">you are a guest</span>
      <span className="loginFormInfoDescription ${!state?.loginToken?.unregistered ? 'hidden' : ''}">
        To make your account permanent either login, connect an account or copy your private key somewhere safe.
      </span>
      <div className="loginFormSingIn ${!state?.loginToken?.unregistered ? 'hidden' : ''}">
        <div className="singIn" onClick=${toggleSingIn}>
          <span className="singInTitle">Sign In With Private Key</span>
          <span className="singInIcon ${toggleSinInOpen ? 'reverse' : ''}"></span>
        </div>
        ${toggleSinInOpen && html`
        <div className="singInDropdown">
          <input autoFocus className="loginFormInput" type="text" placeholder="Login with email or private key" onChange=${handleChange}/>
          <button className="submit formBtnLogin ${!state?.loginToken?.unregistered ? 'hidden' : ''}" type="submit" onClick="${handleLogin}">Login</button>
        </div>
      `}
      </div>
      <div className="loginFormEmailLogin ${!state?.loginToken?.unregistered ? 'hidden' : ''}">
      <div className="emailLogin" onClick=${toggleEmailLogin}>
        <span className="emailLoginTitle">Email Login / Signup</span>
        <span className="emailLoginIcon ${toggleEmailLoginOpen ? 'reverse' : ''}"></span>
      </div>
        ${toggleEmailLoginOpen && html`
        <div className="emailLoginDropdown">
          <input autoFocus className="loginFormInput" type="text" placeholder="Login with email or private key" onChange=${handleChange}/>
          <button className="submit formBtnLogin ${!state?.loginToken?.unregistered ? 'hidden' : ''}" type="submit" onClick="${handleLogin}">Login</button>
        </div>
      `}
      </div>
      <div className="loginFormCopyKey ${!state?.loginToken?.unregistered ? 'hidden' : ''}">
        <div className="copyKey" onClick=${toggleCopyKey}>
          <span className="copyKeyTitle">Copy Private Key</span>
          <span className="copyKeyIcon ${toggleCopyKeyOpen ? 'reverse' : ''}"></span>
        </div>
        ${toggleCopyKeyOpen && html`
        <div className="copyKeyDropdown">
          <button 
          className="submit formBtnCopyKey" 
          type="submit" 
          data-key=${state?.loginToken?.mnemonic}
          onClick="${copyPrivateKey}"
          >
          Copy Private Key
        </button>
        </div>
      `}
      </div>
      <a className="submit loginFormDiscordButton ${!state?.loginToken?.unregistered ? 'hidden' : ''}" href=${discordOauthUrl}>Log In with Discord</a>
      <${Link} to='${window.locationSubdirectory}/settings' className="formBtnSettings ${state?.loginToken?.unregistered ? 'hidden' : ''}">Account Settings</${Link} >
      <button className="submit formBtnLogout ${state?.loginToken?.unregistered ? 'hidden' : ''}" type="submit" onClick="${handleLogout}">Logout</button>
    </div>
  `
}

const NavBarUser = () => {
  const { state, dispatch } = useContext(Context);
  const [loginComponentOpen, setLoginComponent] = useState(false);
  const name = state.name !== "" && state.name !== null ? state.name : "Guest";
  //const avatarPreview = state?.avatarPreview || defaultAvatarImage;
  const avatarPreview = state.avatarPreview !== "" && state.avatarPreview !== null ? state.avatarPreview : defaultAvatarImage;
  const toggleLoginComponent = () => {
    console.log("login component toggle");
    setLoginComponent(!loginComponentOpen);
  }
  return html`
        <div className="loginComponent">
            <div className="loginComponentNav" onClick=${toggleLoginComponent}>
                <span className="loginUsername"> ${name} </span>
                <span className="loginAvatarPreview"><img src=${avatarPreview} /></span>
            </div>
            ${loginComponentOpen && html`
              <div className="loginComponentDropdown ${!state?.loginToken?.unregistered ? 'loginComponentDropdownGuest' : ''}">
                <${NavBarUserLoginForm} />
              </div>
            `}
        </div>
    `
}

const NavLink = props => html`
  <${Link} to=${props.to} children=${props.children}
    getProps=${({ isCurrent }) => {
      return isCurrent ? { className: "nav-link active" } : {className: 'nav-link'}
    }}
  />
`;

console.log(window.location.href.includes('/creator/'));
const NavBar = () => {
  return html`
    <div className="${styles} ${stylesMediaMedium} ${stylesMediaSmall}">
      <div className="navbarWrapper">
        <nav className="navbar"> 
          <div className='nav-logo'>
            <a href='${window.locationSubdirectory}/' className='nav-link-home'>
              <div className="nav-logo-logo"></div>
            </a>
          </div>
          <span className='nav-item'><${NavLink} to='${window.locationSubdirectory}/' className='nav-link'>Profile</${NavLink}></span>
          <span className='nav-item'><${NavLink} to='${window.locationSubdirectory}/gallery' className='nav-link'>Gallery</${NavLink}></span>
          <span className='nav-item ${window.location.href.includes('/creator/') ? 'active' : ''}'>
            <${NavLink} to='${window.locationSubdirectory}/creators' className='nav-link'>Creators</${NavLink}>
          </span>
          <span className='nav-item'><${NavLink} to='${window.locationSubdirectory}/mint' className='nav-link'>Mint NFT</${NavLink}></span>
        </nav>
        <${NavBarUser}  />
      </div>
    </div>
  `;
};

export default NavBar;
