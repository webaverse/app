import Inventory from './Inventory.js';
import Browse from './Browse.js';
import Social from './Social.js';
import World from './World.js';

const Menu = props => {
    return `
    <style>
    .threeD-menu {
        font-family: 'Bangers';
        background-color: none;
        height: 100vh;
        width: 100vh;
        margin: 0 auto;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        border-radius: 20px;
    }
    .threeD-menuNav {
        display: flex;
    }
    .threeD-menuNavTab {
        display: flex;
        height: 200px;
        justify-content: center;
        align-items: center;
        flex: 1;
        background-color: #42a5f5;
        border-bottom: 20px transparent solid;
        color: #FFF;
        font-size: 40px;
    }
    .threeD-menuNavTab.selected {
        background-color: #ff7043;
        border-bottom-color: #333;
    }
    </style>
    <div class="threeD-menu">
        <div class="threeD-menuNav">
            <a class="threeD-menuNavTab ${props.activeTab === 'inventory' ? 'selected' : ''}" id="threeD-menuNavTab-inventory">
                <h1>Inventory</h1>
            </a>
            <a class="threeD-menuNavTab ${props.activeTab === 'browse' ? 'selected' : ''}" id="threeD-menuNavTab-browse">
                <h1>Browse</h1>
            </a>
            <a class="threeD-menuNavTab ${props.activeTab === 'social' ? 'selected' : ''}" id="threeD-menuNavTab-social">
                <h1>Social</h1>
            </a>
            <a class="threeD-menuNavTab ${props.activeTab === 'world' ? 'selected' : ''}" id="threeD-menuNavTab-world">
                <h1>World</h1>
            </a>
        </div>
        ${props.activeTab === 'inventory' ? `<div>
            ${Inventory(props)}
        <div>` : ''}
        ${props.activeTab === 'browse' ? `<div>
            ${Browse(props)}
        <div>` : ''}
        ${props.activeTab === 'social' ? `<div>
            ${Social(props)}
        <div>` : ''}
        ${props.activeTab === 'world' ? `<div>
            ${World(props)}
        <div>` : ''}
    </div>
    `;
}
export default Menu;