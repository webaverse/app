import { useState } from 'https://unpkg.com/es-react@16.13.1/dev';

const guestAvatarImage = "../images/test.png";

const Login = ({username, avatarPreview}) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [menuIsOpen, setMenuOpen] = useState(false);

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

export default Login;