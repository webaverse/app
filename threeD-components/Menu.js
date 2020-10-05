import Inventory from './Inventory.js';
import Social from './Social.js';
import World from './World.js';

const Menu = (props) => {
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
        flex-grow: 1;
        text-align: center;
        border-bottom: 20px transparent solid;
        cursor: pointer;
        font-size: 40px;
    }
    .threeD-menuNavTab.selected {
        border-bottom-color: #333;
    }
    #threeD-menuNavTab-inventory {
        border-radius: 20px 0px 0px 0px;
        color: white;
        background-color: #8a3dca;
    }
    
    #threeD-menuNavTab-account {
        color: white;
        background-color: #5bc152;
    }
    
    #threeD-menuNavTab-world {
        border-radius: 0px 20px 0px 0px;
        color: white;
        background-color:#ff7043;
    }
    </style>
    <div class="threeD-menu">
        <div class="threeD-menuNav">
            <a class="threeD-menuNavTab ${props.activeTab === 'inventory' ? 'selected' : ''}" id="threeD-menuNavTab-inventory">
                <h1>Inventory</h1>
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