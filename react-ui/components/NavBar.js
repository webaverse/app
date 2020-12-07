import { useContext } from 'https://unpkg.com/es-react@16.13.1/dev';
import ActionTypes from '../constants/ActionTypes.js';
import { Context } from '../constants/Context.js';
import css from '../web_modules/csz.js';

const styles = css`/components/NavBar.css`

const defaultAvatarImage = "../images/test.png";

const NavBarUserLoginForm = () => {
  const { state, dispatch } = useContext(Context);
      const onLoginSubmit = (e) => {
      e.preventDefault();
      console.log(e);
      dispatch({ type: ActionTypes.LoginWithPrivateKey })
    }

  return html`
    <form className="loginForm" onSubmit="${onLoginSubmit}">
      <input type="text" placeholder="privatekey" />
      <button className="submit" type="submit">
        Login
      </button>
    </form>
  `
}

const NavBarUser = () => {
  const { state, dispatch } = useContext(Context);
  const name = state.name !== "" && state.name !== null ? state.name : "Guest";
  const avatarPreview = state.avatarThumbnail ?? defaultAvatarImage;
    return html`
        <div className="loginComponent">
            <div className="loginComponentNav">
                <span className="loginUsername"> ${name} </span>
                <span className="loginAvatarPreview"><img src=${avatarPreview} /></span>
            </div>
            <div className="loginComponentDropdown">
              <${NavBarUserLoginForm} />
            </div>
        </div>
    `
}

const NavBar = () => {
    return html`
    <div className=${styles}>
        <nav className="navbar">
          <span className='nav-logo'><h1>Ψ Webaverse</h1></span>
          <span className='nav-item'><a href='/profile' className='nav-link'>Profile</a></span>
          <span className='nav-item'><a href='/gallery' className='nav-link'>Gallery</a></span>
          <span className='nav-item'><a href='/creators' className='nav-link'>Creators</a></span>
          <span className='nav-item'><a href='/mint' className='nav-link'>Mint NFT</a></span>
        </nav>
      <${NavBarUser}  />
    </div>
    `;
  };

  export default NavBar;
