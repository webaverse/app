import { useState } from '/web_modules/es-react.js';

const guestAvatarImage = "../images/test.png";

const Login = (username, avatarPreview) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [menuIsOpen, setMenuOpen] = useState(false);

    const loggedInView = html`
    <div class="loginComponentDropdown">
        <span class="loginComponent_link"><a href="/settings">Settings</a></span>
        <span class="loginComponent_link"><a href="/logout">Logout</a></span>
    </div>
    `

    const guestView = html`
    <div class="loginComponentDropdown">
        <span>Guest View - Login stuff here</span>
    </div>
    `

    return html`
        <div class="loginComponent">
            <div class="loginComponentNav">
                <span class="login_username"> ${loggedIn ? username : 'Guest' } </span>
                <span class="login_avatarPreview"><img src="${loggedIn ? avatarPreview : guestAvatarImage}" /></span>
            </div>
            ${  (menuIsOpen && loggedIn) ? loggedInView :
                (menuIsOpen && !loggedIn) ? guestView :
                ''
            }
        </div>
    `
}

export default Login;