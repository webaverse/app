import Inventory from './Inventory.js';
import Nav from './Nav.js';
import inventory from '../inventory.js';
import { setBindings } from './bindings.js';

let appProps = {
    inventory: inventory,
    inventoryItems: []
};

export const App = (props) => {
    return `
        ${Nav(props)}
        ${Inventory(props)}
    `;
}

export const updateProps = (newProps) => {
    let shouldUpdate = false;
    for (let k in newProps) {
        if (appProps[k] !== newProps[k] && newProps[k]) {
            appProps[k] = newProps[k];
            shouldUpdate = true;
        }
    }
    if (shouldUpdate) {
        document.getElementById('appContainer').innerHTML = App(appProps);
    }
}

setBindings(appProps);