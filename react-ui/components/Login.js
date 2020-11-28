import { useState } from '/web_modules/es-react.js';
import MockUserProfileData from '../mock/UserProfileData';

const guestAvatarImage = "../images/test.png";
const avatarImage = MockUserProfileData.avatarImage;
const userName = MockUserProfileData.userName;
const userAddress = MockUserProfileData.userAddress;

const Login = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [menuIsOpen, setMenuOpen] = useState(false);

    const loggedInView = html`
    <div class="loginComponentDropdown">
        <span class="loginComponent_userAddress">${userAddress} (Copy)</span>
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
                <span class="login_userName"> ${loggedIn ? userName : 'Guest' } </span>
                <span class="login_avatarImage"><img src="${loggedIn ? avatarImage : guestAvatarImage}" /></span>
            </div>
            ${  (menuIsOpen && loggedIn) ? loggedInView :
                (menuIsOpen && !loggedIn) ? guestView :
                ''
            }
        </div>
    `
}

export default Login;