import Inventory from './Inventory.js';
import inventory from '../inventory.js';
import {loginManager} from '../login.js';
import {getState, setState, getSpecificState} from '../state.js';
import {setBindings} from './bindings.js';

let appState = getState();

let appProps = {
    inventoryItems: appState.inventory.items,
    selectedWeapon: appState.selectedWeapon,
    isXR: appState.isXR
};

const onclickBindings = {
  'inventory-wear': e => {
    const id = parseInt(e.target.getAttribute('inventoryid'), 10);
    loginManager.setAvatar(id);
  },
  'inventory-discard': async e => {
    const id = parseInt(e.target.getAttribute('inventoryid'), 10);
    await inventory.discardFile(id);
  },
  'inventory-upload': e => {
    const file = document.getElementById("twoD-inventoryUploadBtn").files[0];
    inventory.uploadFile(file);
  },
};
inventory.addEventListener('filesupdate', (e) => {
    updateProps({
        inventoryItems: e.data,
    })
});

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
    const appContainer = document.getElementById('appContainer');
    for (let k in newProps) {
        if (appProps[k] !== newProps[k]) {
            appProps[k] = newProps[k];
        }
    }
    if (appProps.pointerLock || appProps.isXR || !appProps.selectedWeapon) {
        appContainer.style.display = 'none';
        appContainer.innerHTML = '';
        setBindings(null, onclickBindings);
    } else {
        appContainer.style.display = 'block';
        appContainer.innerHTML = App(appProps);
        setBindings(appContainer, onclickBindings);
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
    const appContainer = document.getElementById('appContainer');
    setBindings(appContainer, onclickBindings);
});
