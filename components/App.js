import Inventory from './Inventory.js';
import inventory from '../inventory.js';
import { getState, setState, getSpecificState } from '../state.js';
import { setBindings } from './bindings.js';

let appState = getState();

let appProps = {
    inventoryItems: appState.inventory.items,
};

let appHelpers = {
    inventory: inventory
}

window.addEventListener('stateChanged', (e) => {
    const changedState = getSpecificState(e.detail.changedKeys);
    console.log('stateChanged', changedState);
})

export const App = (props) => {
    return `
        <div id="twoD-app">
            ${Inventory(props)}
        </div>
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

setBindings(appState, appProps, appHelpers);