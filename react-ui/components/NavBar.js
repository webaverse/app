import { useContext, useState } from 'https://unpkg.com/es-react/dev';
import ActionTypes from '../constants/ActionTypes.js';
import { Context } from '../constants/Context.js';
import css from '../web_modules/csz.js';
import { Link } from '/web_modules/@reach/router.js';
import { discordOauthUrl } from '../webaverse/constants.js'

const styles = css`/components/NavBar.css`

const defaultAvatarImage = "/images/defaultaccount.png";

const NavBarUserLoginForm = () => {

  const [inputState, setInputState] = useState("");

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

  return html`
    <div className="loginForm">
      <button 
        className="submit formBtnCopyAdress" 
        type="submit" 
        data-address=${state?.address}
        onClick="${copyAddress}"
      >
        ${state.address.slice(0, 10)}...(Copy Address)
      </button>
      <button 
        className="submit formBtnCopyKey" 
        type="submit" 
        data-key=${state?.loginToken?.mnemonic}
        onClick="${copyPrivateKey}"
      >
        ${state.loginToken?.mnemonic?.slice(0, 10)}...(Copy Private Key)
      </button>
      <span className="loginFormTitle">connect your account</span>
      <input autoFocus className="loginFormInput" type="text" placeholder="Login with email or private key" onChange=${handleChange}/>
        <a className="discordButton" href=${discordOauthUrl}>Login With Discord</a >
        <button className="submit formBtnLogin" type="submit" onClick="${handleLogin}">Login</button>
        <button className="submit formBtnLogout" type="submit" onClick="${handleLogout}">Logout</button>
        <${Link} to='/settings'>User Settings</${Link} >
    </div>
  `
}

const NavBarUser = () => {
  const { state, dispatch } = useContext(Context);
  const [loginComponentOpen, setLoginComponent] = useState(false);
  const name = state.name !== "" && state.name !== null ? state.name : "Guest";
  const avatarPreview = state.avatarPreview ?? defaultAvatarImage;
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
              <div className="loginComponentDropdown">
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


const NavBar = () => {
  return html`
    <div className=${styles}>
        <nav className="navbar"> 
          <span className='nav-logo'><h1>Ψ Webaverse</h1></span>
          <span className='nav-item'><${NavLink} to='/' className='nav-link'>Profile</${NavLink}></span>
          <span className='nav-item'><${NavLink} to='/gallery' className='nav-link'>Gallery</${NavLink}></span>
          <span className='nav-item'><${NavLink} to='/creators' className='nav-link'>Creators</${NavLink}></span>
          <span className='nav-item'><${NavLink} to='/mint' className='nav-link'>Mint NFT</${NavLink}></span>
        </nav>
        <${NavBarUser}  />
    </div>
    `;
};

export default NavBar;
