import { useContext, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import ActionTypes from '../constants/ActionTypes.js';
import { Context } from '../constants/Context.js';
import css from '../web_modules/csz.js';
import { Link, useRouter } from '../web_modules/react-es-router.js';
const styles = css`/components/NavBar.css`

const defaultAvatarImage = "../images/test.png";

const NavBarUserLoginForm = () => {

  const router = useRouter();

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
        ${state.loginToken.mnemonic.slice(0, 10)}...(Copy Private Key)
      </button>
      <span className="loginFormTitle">connect your account</span>
      <input autoFocus className="loginFormInput" type="text" placeholder="Login with email or private key" onChange=${handleChange}/>
      <div>
        <button className="submit formBtnLogin" type="submit" onClick="${handleLogin}">Login</button>
      </div>
      <div>
        <button className="submit formBtnLogout" type="submit" onClick="${handleLogout}">Logout</button>
      </div>
      <span className="submit formBtnSettings">
        <${Link} to=${'/settings'}>User Settings</Link>
      </span>
    </div>
  `
}

const NavBarUser = () => {
  const { state, dispatch } = useContext(Context);
  const [loginComponentOpen, setLoginComponent] = useState(false);
  const name = state.name !== "" && state.name !== null ? state.name : "Guest";
  const avatarPreview = state.avatarThumbnail ?? defaultAvatarImage;
  const toggleLoginComponent = () => {
    console.log("login component toggle");
    setLoginComponent(!loginComponentOpen);
  }
  return html`
        <div className="loginComponent">
            <div className="loginComponentNav" onClick=${toggleLoginComponent}>
                <span className="loginUsername"><h1> ${name} </h1></span>
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

const NavBar = () => {
  const toggleActivePage = (current) => {
    const route = useRouter()
    if(current === route.route)
    return 'active'
  }

  return html`
    <div className=${styles}>
        <nav className="navbar"> 
          <span className='nav-logo'><h1>Ψ Webaverse</h1></span>
          <span className='nav-item ${toggleActivePage('/profile')}'><a href='/profile' className='nav-link'>Profile</a></span>
          <span className='nav-item ${toggleActivePage('/gallery')}'><a href='/gallery' className='nav-link'>Gallery</a></span>
          <span className='nav-item ${toggleActivePage('/creators')}'><a href='/creators' className='nav-link'>Creators</a></span>
          <span className='nav-item ${toggleActivePage('/mint')}'><a href='/mint' className='nav-link'>Mint NFT</a></span>
        </nav>
        <${NavBarUser}  />
    </div>
    `;
};

export default NavBar;
