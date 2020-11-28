import { React, useEffect } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';
import Login from "./Login";

const html = htm.bind(React.createElement)

const NavBar = (username, avatarPreview) => {
  
    return html`
    <div class="topbar">
      <nav class="navbar">
        <span className='nav-item'><a href='/profile' className='nav-link'>Profile</a></span>
        <span className='nav-item'><a href='/gallery' className='nav-link'>Gallery</a></span>
        <span className='nav-item'><a href='/creators' className='nav-link'>Creators</a></span>
        <span className='nav-item'><a href='/mint' className='nav-link'>Mint NFT</a></span>
      </nav>
    <${Login} username="${username}" avatarPreview="${avatarPreview}"  />
    </div>
    `;
  };

  export default NavBar;
