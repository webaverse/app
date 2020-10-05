import Menu from './Menu.js';
import WeaponWheel from './WeaponWheel.js';
import uiManager from '../ui-manager.js';
import inventory from '../inventory.js';
import { loginManager } from '../login.js';
import { state, getState, setState, getSpecificState } from '../state.js';
import { setBindings } from './bindings.js';

let appState = state;

export const onclickBindings = {
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
  'threeD-menuNavTab-inventory': e => {
    const {menu} = getState();
    menu.activeTab = 'inventory';
    setState({
      menu,
    });
  },
  'threeD-menuNavTab-social': e => {
    const {menu} = getState();
    menu.activeTab = 'social';
    setState({
      menu,
    });
  },
  'threeD-menuNavTab-world': e => {
    const {menu} = getState();
    menu.activeTab = 'world';
    setState({
      menu,
    });
  },
};

inventory.addEventListener('filesupdate', e => {
  const {menu} = state;
  menu.inventory.items = e.data;
  console.log('new files', e.data);
  updateProps({
    menu,
  });
});

export const toggleMenus = (props) => {
  // console.log(appState)
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
  return `\
    <div id="twoD-app">
      ${toggleMenus(props)}
    </div>
  `;
}

export const updateProps = newProps => {
    const appContainer = document.getElementById('appContainer');
    for (let k in newProps) {
        // if (appState[k] !== newProps[k]) {
            appState[k] = newProps[k];
        // }
    }
    if (appState.pointerLock || appState.isXR) {
        appContainer.style.display = 'none';
        if ('menu' in newProps || 'pointerLock' in newProps || 'isXR' in newProps) {
          uiManager.menuMesh.update();
        }
    } else if (!appState.selectedWeapon) {
        appContainer.style.display = 'none';
        // appContainer.innerHTML = '';
        // setBindings(null, onclickBindings);
    } else {
        appContainer.style.display = 'block';
        appContainer.innerHTML = App(appState);
        setBindings(appContainer, onclickBindings);
    }
}

window.addEventListener('stateChanged', (e) => {
    const changedState = getSpecificState(e.detail.changedKeys);
    for (let k in changedState) {
        appState[k] = changedState[k];
    }
    updateProps(changedState);
})

window.addEventListener('load', () => {
    const appContainer = document.getElementById('appContainer');
    setBindings(appContainer, onclickBindings);
});
