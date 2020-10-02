import Inventory from './Inventory.js';
import inventory from '../inventory.js';
import { getState, setState, getSpecificState } from '../state.js';
import { setBindings } from './bindings.js';

let appState = getState();

let appProps = {
    inventoryItems: appState.inventory.items,
    selectedWeapon: appState.selectedWeapon,
    isXR: appState.isXR
};

let appHelpers = {
    inventory: inventory
}

export const toggleMenus = (props) => {
    switch (appProps.selectedWeapon) {
        case 'inventory':
            return Inventory(props);
        default: 
            return;
    }
}

export const App = (props) => {
    return `
        <div id="twoD-app">
            ${toggleMenus(props)}
        </div>
    `;
}

export const updateProps = (newProps) => {
    for (let k in newProps) {
        if (appProps[k] !== newProps[k]) {
            appProps[k] = newProps[k];
        }
    }
    if (appProps.pointerLock || appProps.isXR) {
        document.getElementById('appContainer').innerHTML = '';
        setBindings(appProps, appHelpers);
    } else {
        document.getElementById('appContainer').innerHTML = App(appProps);
        setBindings(appProps, appHelpers);
    }
}

window.addEventListener('stateChanged', (e) => {
    const changedState = getSpecificState(e.detail.changedKeys);
    // console.log('stateChanged', changedState);
    for (let k in changedState) {
        appState[k] = changedState[k];
    }
    updateProps(changedState);
})

window.addEventListener('load', () => {
    setBindings(appProps, appHelpers);
});
