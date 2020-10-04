import Inventory from './Inventory.js';

const Menu = (props) => {
    return `
        <div class="twoD-menu">
            <div class="twoD-menuNav">
                ${Inventory(props)}
            </div>
        </div>
    `;
}
export default Menu;