import Inventory from './Inventory.js';

const Menu = props => {
    return `
        <div class="twoD-menu">
            <div class="twoD-menuNav">
                <div class="twoD-menuNavTab twoD-menuNavTab-inventory">
                    <h1>Inventory</h1>
                </div>
                <div class="twoD-menuNavTab twoD-menuNavTab-social">
                    <h1>Social</h1>
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