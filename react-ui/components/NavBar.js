import { React, useEffect } from '../web_modules/es-react.js';
import htm from '../web_modules/htm.js';
import Login from "./Login.js";
import csz from '../web_modules/csz.js'

const styles = csz`./NavBar.css`

const html = htm.bind(React.createElement)

const NavBar = ({username, avatarPreview}) => {

  if(username === undefined) username = "Guest";
  
    return html`
    <div className=${styles}>
      <div className="topbar">
        <nav className="navbar">
          <span className='nav-item'><a href='/profile' className='nav-link'>Profile</a></span>
          <span className='nav-item'><a href='/gallery' className='nav-link'>Gallery</a></span>
          <span className='nav-item'><a href='/creators' className='nav-link'>Creators</a></span>
          <span className='nav-item'><a href='/mint' className='nav-link'>Mint NFT</a></span>
        </nav>
      <${Login} username=${username} avatarPreview=${avatarPreview}  />
      </div>
    </div>
    `;
  };

  export default NavBar;
