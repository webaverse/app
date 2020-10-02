import Inventory from './Inventory.js';
import inventory from '../inventory.js';
import { getState, setState, getSpecificState } from '../state.js';
import { setBindings } from './bindings.js';

// A copy of the shared state with 3d, just keep this always a copy, but you can CHOOSE when you would like to update the state. Don't use this in components. It's just for reference.
let appState = getState();

// Construct from state the actual props that matter to you for components. This is a layer of optimization. Do not just make this the same as the full state object unless you truly need it.
let appProps = {
    inventoryItems: appState.inventory.items,
    selectedWeapon: appState.selectedWeapon,
    isXR: appState.isXR
};

// This is only passed into the setBindings() as some helpers to use API calls and other value getting actions. These functions cannot go inside components. Do not put functions inside state or props. They go in here.
let appHelpers = {
    inventory: inventory
}

// Decides which 2D UI menu to show. This is synced with the 3D weapon selector through the common state.
export const toggleMenus = (props) => {
    switch (appProps.selectedWeapon) {
        case 'inventory':
            return Inventory(props);
        default: 
            return;
    }
}

// This should stay pretty simple. This is the parent of all 2D UI components. Props are passed to children from App().
export const App = (props) => {
    return `
        <div id="twoD-app">
            ${toggleMenus(props)}
        </div>
    `;
}

// This is a optimziation function for updating the appProps. Does prop checking, checks for unneeded changes, rerenders app if needed, also resets bindings. Should use this function and never do this: appProps = newProps
export const updateProps = (newProps) => {
    for (let k in newProps) {
        if (appProps[k] !== newProps[k]) {
            appProps[k] = newProps[k];
        }
    }
    document.getElementById('appContainer').innerHTML = App(appProps);
    setBindings(appProps, appHelpers);
}

// This listens to our CustomEvent for state changes. It returns just keys. Can choose to fetch whatever key / value pair you actually care about updating in the App. Optimization layer. Use this.
window.addEventListener('stateChanged', (e) => {
    const changedState = getSpecificState(e.detail.changedKeys);
    console.log('stateChanged', changedState);
    for (let k in changedState) {
        appState[k] = changedState[k];
    }
    updateProps(changedState);
})

window.addEventListener('load', () => {
    setBindings(appProps, appHelpers);
});
