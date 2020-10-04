import Inventory from './Inventory.js';

const Menu = (props) => {
    return `
    <style>
    .twoD-menu {
        background-color: white;
        height: 80vh;
        width: 80vw;
        margin: 0 auto;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        border-radius: 20px;
        margin-top: 10vh;
    }
    .twoD-menuNav {
        display: flex;
    }
    .twoD-menuNavTab {
        flex-grow: 1;
        text-align: center;
        border: 1px #9c9c9c solid;
        cursor: pointer;
    }
    
    .twoD-menuNavTab-inventory {
        border-radius: 20px 0px 0px 0px;
        color: white;
        background-color: #8a3dca;
        border-bottom: 5px solid #f463ff;
    }
    
    .twoD-menuNavTab-inventory:hover {
        background-color: #aa50f5;
    }
    
    .twoD-menuNavTab-account {
        color: white;
        background-color: #5bc152;
        opacity: 80%;
    }
    
    .twoD-menuNavTab-account:hover {
        background-color: #6adc60;
        opacity: 100%;
    }
    
    .twoD-menuNavTab-world {
        border-radius: 0px 20px 0px 0px;
        color: white;
        background-color:#ff7043;
        opacity: 80%;
    }
    
    .twoD-menuNavTab-world:hover {
        background-color: #ff815a;
        opacity: 100%;
    }
    </style>
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