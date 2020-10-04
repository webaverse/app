import Menu from './Menu.js';
import WeaponWheel from './WeaponWheel.js';
import inventory from '../inventory.js';
import { loginManager } from '../login.js';
import { state, getSpecificState } from '../state.js';
import { setBindings } from './bindings.js';

let appState = state;

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

inventory.addEventListener('filesupdate', e => {
  updateProps({
    inventoryItems: e.data,
  });
});

export const toggleMenus = (props) => {
    console.log(appState)
    switch (appState.selectedWeapon) {
        case 'inventory':
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
    if (appState.pointerLock || appState.isXR || !appState.selectedWeapon) {
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
