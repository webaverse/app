import { React, useContext } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '../web_modules/htm.js';
import css from '../web_modules/csz.js'
import { useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import { UserContext } from '../constants/UserContext.js';

const styles = css`/components/NavBar.css`

const html = htm.bind(React.createElement)

const guestAvatarImage = "../images/test.png";

const UserComponent = ({username, avatarPreview}) => {
    const [menuIsOpen, setMenuOpen] = useState(false);

    const {userContext, setUserContext} = useContext(UserContext);
    const loggedIn = false;

    const loggedInView = html`
    <div className="loginComponentDropdown">
        <span className="loginComponentLink"><a href="/settings">Settings</a></span>
        <span className="loginComponentLink"><a href="/logout">Logout</a></span>
    </div>
    `

    const guestView = html`
    <div className="loginComponentDropdown">
        <span>Guest View - Login stuff here</span>
    </div>
    `

    return html`
        <div className="loginComponent">
            <div className="loginComponentNav">
                <span className="loginUsername"> ${loggedIn ? username : 'Guest' } </span>
                <span className="loginAvatarPreview"><img src="${loggedIn ? avatarPreview : guestAvatarImage}" /></span>
            </div>
            ${  (menuIsOpen && loggedIn) ? loggedInView :
                (menuIsOpen && !loggedIn) ? guestView :
                ''
            }
        </div>
    `
}

const NavBar = ({username, avatarPreview}) => {

  if(username === undefined) username = "Guest";
  
    return html`
    <div className=${styles}>
        <nav className="navbar">
          <span className='nav-logo'><h1>Webaverse</h1></span>
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
