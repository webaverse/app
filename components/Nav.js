import Toolbar from './Toolbar.js';
import Login from './Login.js';

const Nav = (props) => {
    return `
        <header id="twoD-nav">
            ${Toolbar(props)}
            ${Login(props)}
        </header>
    `;
}
export default Nav;