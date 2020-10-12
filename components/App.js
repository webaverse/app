import Menu from './Menu.js';
import WeaponWheel from './WeaponWheel.js';
import uiManager from '../ui-manager.js';
import inventory from '../inventory.js';
import {loginManager} from '../login.js';
import {planet} from '../planet.js';
import {state, getState, setState, getSpecificState} from '../state.js';
import {setBindings} from './bindings.js';
import DiffDOM from '../diffDOM.js';
const diffDOM = new DiffDOM();

let appState = state;
const appContainerTmp = document.createElement('div');

export const onclickBindings = {
  'threeD-menuNavTab-inventory': e => {
    const { menu } = getState();
    menu.activeTab = 'inventory';
    setState({
      menu,
    });
  },
  'threeD-menuNavTab-browse': e => {
    const { menu } = getState();
    menu.activeTab = 'browse';
    setState({
      menu,
    });
  },
  'threeD-menuNavTab-social': e => {
    const { menu } = getState();
    menu.activeTab = 'social';
    setState({
      menu,
    });
  },
  'threeD-menuNavTab-world': e => {
    const { menu } = getState();
    menu.activeTab = 'world';
    setState({
      menu,
    });
  },
  'twoD-menuNavTab-inventory': e => {
    const { menu } = getState();
    menu.activeTab = 'inventory';
    setState({
      menu,
    });
  },
  'twoD-menuNavTab-browse': e => {
    const { menu } = getState();
    menu.activeTab = 'browse';
    setState({
      menu,
    });
  },
  'twoD-menuNavTab-social': e => {
    const { menu } = getState();
    menu.activeTab = 'social';
    setState({
      menu,
    });
  },
  'twoD-menuNavTab-worlds': async (e) => {
    const { menu } = getState();
    const response = await fetch('https://worlds.exokit.org/list');
    const json = await response.json();
    console.log(json)
    menu.worlds = json.worlds;
    menu.activeTab = 'worlds';
    setState({
      menu,
    });
  },
  'twoD-social-peerCard-shareWorld': e => {
    const copyText = document.getElementById("twoD-social-peerCard-shareWorldUrl");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
  },
  'inventory-spawn': async e => {
    const id = e.name;
    document.dispatchEvent(new MessageEvent('drop', {
      data: {
        dragid: 'inventory-' + id,
      },
    }));
  },
  'inventory-wear': e => {
    const id = parseInt(e.name, 10);
    loginManager.setAvatar(id);
  },
  'inventory-discard': async e => {
    const id = parseInt(e.name, 10);
    await inventory.discardFile(id);
  },
  'inventory-upload': e => {
    inventory.uploadFile(e.file);
  },
  'inventory-item': e => {
    const id = parseInt(e.name, 10);
    const { menu } = getState();
    const file = menu.inventory.items.find(file => file.id === id);
    const { hash, filename, preview } = file;
    menu.inventory.selectedId = id;
    menu.inventory.selectedHash = hash;
    menu.inventory.selectedFileName = filename;
    setState({
      menu,
    });
  },
  'browse-item': e => {
    const id = parseInt(e.name, 10);
    const { menu } = getState();
    const file = menu.browse.items.find(file => file.id === id);
    const { hash, filename, preview } = file;
    menu.inventory.selectedId = id;
    menu.inventory.selectedHash = hash;
    menu.inventory.selectedFileName = filename;
    setState({
      menu,
    });
  },
  'peer': e => {
    const connectionId = e.name;
    const { menu } = getState();
    menu.world.selectedPeerId = connectionId;
    setState({
      menu,
    });
  },
  'browse-arrow-up': e => {
    inventory.scrollBrowse(-1);
  },
  'browse-arrow-down': e => {
    inventory.scrollBrowse(1);
  },
};

inventory.addEventListener('ownedfilesupdate', e => {
  const { menu } = state;
  menu.inventory.items = e.data;
  updateProps({
    menu,
  });
});
planet.addEventListener('peersupdate', e => {
  const { menu } = state;
  menu.world.peers = e.data;
  menu.social.peers = e.data;
  updateProps({
    menu,
  });
});

export const toggleMenus = props => {
  switch (appState.selectedWeapon) {
    case 'inventory':
      return Menu({
        activeTab: appState.menu.activeTab,
        inventoryItems: appState.menu.inventory.items,
        worlds: appState.menu.worlds,
        peers: appState.menu.social.peers,
        allItems: appState.menu.browse.items
      });
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
    const newHtml = App(appState);
    const child = appContainer.children[0];
    if (child) {
      appContainerTmp.innerHTML = newHtml.replace(/(>)[\s]+(<)/gm, '$1$2');
      const diff = diffDOM.diff(child, appContainerTmp.children[0]);
      diffDOM.apply(child, diff);
    } else {
      appContainer.innerHTML = newHtml;
    }
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
