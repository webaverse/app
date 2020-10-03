import Menu from './Menu.js';
import WeaponWheel from './WeaponWheel.js';
import inventory from '../inventory.js';
import { loginManager } from '../login.js';
import { state, getState, setState, getSpecificState } from '../state.js';
import { setBindings } from './bindings.js';

let appState = state;

const onclickBindings = {
    'inventory-wear': (e) => {
        const id = parseInt(e.target.getAttribute('inventoryid'), 10);
        loginManager.setAvatar(id);
    },
    'inventory-upload': (e) => {
        setState({ invento })
        const file = document.getElementById("twoD-inventoryUploadBtn").files[0];
        inventory.uploadFile(file);
    },
};

inventory.addEventListener('filesupdate', (e) => {
    state.menu.inventory.items = state.menu.inventory.items.concat(e.data)
    updateProps({ inventoryItems: state.menu.inventory.items })
});

export const toggleMenus = (props) => {
    switch (appState.selectedWeapon) {
        case 'menu':
            return Menu(props);
        case 'weaponWheel':
            return WeaponWheel(props);
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
        if (appState[k] !== newProps[k]) {
            appState[k] = newProps[k];
        }
    }
    if (appState.pointerLock || appState.isXR) {
        appContainer.style.display = 'none';
        appContainer.innerHTML = '';
        setBindings(null, onclickBindings);
    } else {
        appContainer.style.display = 'block';
        appContainer.innerHTML = App(appState);
        setBindings(appContainer, onclickBindings);
    }
}

window.addEventListener('stateChanged', (e) => {
    const changedState = getSpecificState(e.detail.changedKeys);
    console.log('stateChanged', changedState);
    for (let k in changedState) {
        appState[k] = changedState[k];
    }
    updateProps(changedState);
})

window.addEventListener('load', () => {
    const appContainer = document.getElementById('appContainer');
    setBindings(appContainer, onclickBindings);
});
