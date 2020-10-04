import Inventory from './Inventory.js';

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
        border: 1px #9c9c9c solid;
        cursor: pointer;
        font-size: 40px;
    }
    
    #threeD-menuNavTab-inventory {
        border-radius: 20px 0px 0px 0px;
        color: white;
        background-color: #8a3dca;
        border-bottom: 20px solid #f463ff;
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
            <a class="threeD-menuNavTab" id="threeD-menuNavTab-inventory">
                <h1>Inventory</h1>
            </a>
            <a class="threeD-menuNavTab" id="threeD-menuNavTab-account">
                <h1>Account</h1>
            </a>
            <a class="threeD-menuNavTab" id="threeD-menuNavTab-world">
                <h1>World</h1>
            </a>
        </div>
        <div>
            ${Inventory(props)}
        <div>
    </div>
    `;
}
export default Menu;