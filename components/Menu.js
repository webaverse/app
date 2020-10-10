import Inventory from './Inventory.js';
import Browse from './Browse.js';
import Social from './Social.js';
import Worlds from './Worlds.js';
import Trade from './Trade.js';

const Menu = (props) => {
    if (props.trade.visible) {
        return `
            <div class="twoD-menu">
                ${Trade(props)}
            </div>
        `;
    } else {
        return `
        <div class="twoD-menu">
            <div class="twoD-menuNav">
                <div class="twoD-menuNavTab twoD-menuNavTab-inventory ${props.activeTab === 'inventory' ? 'selected' : ''}" onclick="twoD-menuNavTab-inventory">
                    <h1>Inventory</h1>
                </div>
                <div class="twoD-menuNavTab twoD-menuNavTab-browse ${props.activeTab === 'browse' ? 'selected' : ''}" onclick="twoD-menuNavTab-browse">
                    <h1>Browse</h1>
                </div>
                <div class="twoD-menuNavTab twoD-menuNavTab-social ${props.activeTab === 'social' ? 'selected' : ''}" onclick="twoD-menuNavTab-social">
                    <h1>Social</h1>
                </div>
                <div class="twoD-menuNavTab twoD-menuNavTab-worlds ${props.activeTab === 'worlds' ? 'selected' : ''}" onclick="twoD-menuNavTab-worlds">
                    <h1>Worlds</h1>
                </div>
            </div>
            <div>
                ${props.activeTab === 'inventory' ? Inventory(props) : ''}
                ${props.activeTab === 'browse' ? Browse(props) : ''}
                ${props.activeTab === 'social' ? Social(props) : ''}
                ${props.activeTab === 'worlds' ? Worlds(props) : ''}
            <div>
        </div>
        `;
    }
}
export default Menu;