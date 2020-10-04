import Inventory from './Inventory.js';

const Menu = (props) => {
    return `
        <div class="twoD-menu">
            <div class="twoD-menuNav">
                <div class="twoD-menuNavTab twoD-menuNavTab-inventory">
                    <h1>Inventory</h1>
                </div>
                <div class="twoD-menuNavTab twoD-menuNavTab-account">
                    <h1>Account</h1>
                </div>
                <div class="twoD-menuNavTab twoD-menuNavTab-world">
                    <h1>World</h1>
                </div>
            </div>
            <div>
                ${Inventory(props)}
            <div>
        </div>
    `;
}
export default Menu;