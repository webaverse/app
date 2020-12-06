import { React, useContext, useEffect, useReducer } from 'https://unpkg.com/es-react@16.13.1/dev';

// import { Route } from './web_modules/react-es-router.js';

import htm from '../web_modules/htm.js';
import css from '../web_modules/csz.js'
import { useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import { LoginReducer } from '../reducers/LoginReducer.js';
import ActionTypes from '../constants/ActionTypes.js';
const styles = css`/components/NavBar.css`

const html = htm.bind(React.createElement)

const defaultAvatarImage = "../images/test.png";

const UserComponent = () => {

  const initialState = {
    loginToken: null,
    publicKey: null,
    privateKey: null,
    name: null,
    mainnetAddress: null,
    avatarThumbnail: null,
    showUserDropdown: false
  }

  const [state, dispatch] = useReducer(LoginReducer, initialState);

  useEffect(() => {
    dispatch({ type: ActionTypes.InitializeUserObject });
    console.log("state is", state);
  }, [])

    const onLoginSubmit = (e) => {
      e.preventDefault();
      console.log(e);
      dispatch({ type: ActionTypes.LoginWithPrivateKey })
    }

    const loginForm = () => html`
      <form className="loginForm" onSubmit="${onLoginSubmit}">
        <p>Token is ${state.loginToken}</p>
        <input type="text" placeholder="privatekey" />
        <button className="submit" type="submit">
          Login
        </button>
      </form>
    `

    const DropDown = () => html`
    <div className="loginComponentDropdown">
      <${loginForm} />
    </div>
    `

    // <span className="loginUsername"> Guest${state.name !== null ? state.name : 'Guest' } </span>
    // <span className="loginAvatarPreview"><img src="${state.avatarThumbnail !== null ? state.avatarThumbnail : defaultAvatarImage}" /></span>

    return html`
        <div className="loginComponent">
            <div className="loginComponentNav">
                <span className="loginUsername">Guest</span>
                <span className="loginAvatarPreview"><img src="${defaultAvatarImage}" /></span>
            </div>
                <${DropDown} />
        </div>
    `
}

const NavBar = ({username, avatarPreview}) => {

  if(username === undefined) username = "Guest";
  
    return html`
    <div className=${styles}>
        <nav className="navbar">
          <span className='nav-logo'><h1>Ψ Webaverse</h1></span>
          <span className='nav-item'><a href='/profile' className='nav-link'>Profile</a></span>
          <span className='nav-item'><a href='/gallery' className='nav-link'>Gallery</a></span>
          <span className='nav-item'><a href='/creators' className='nav-link'>Creators</a></span>
          <span className='nav-item'><a href='/mint' className='nav-link'>Mint NFT</a></span>
        </nav>
      <${UserComponent} username=${username} avatarPreview=${avatarPreview}  />
    </div>
    `;
  };

  export default NavBar;
