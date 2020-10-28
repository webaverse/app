import Menu from './Menu.js';
import WeaponWheel from './WeaponWheel.js';
import uiManager from '../ui-manager.js';
import inventory from '../inventory.js';
import {loginManager} from '../login.js';
import {planet} from '../planet.js';
import {state, getState, setState, getSpecificState, defaultState} from '../state.js';
import {setBindings} from './bindings.js';
// import {getContractSource} from '../blockchain.js';
import DiffDOM from '../diffDOM.js';
import {inventoryPageLimit, peersPageLimit} from '../threeD-components/constants.js';
import {clone} from '../util.js';

const diffDOM = new DiffDOM();

let appState = state;
const appContainerTmp = document.createElement('div');

export const isTradeReady = () => {
  const {menu} = getState();
  return !!(menu.trade.agreement && menu.trade.toPeer && menu.trade.fromPeer && menu.trade.selectedItem);
}

export const onclickBindings = {
  'threeD-menuNavTab-inventory': e => {
    const {menu} = getState();
    menu.activeTab = 'inventory';
    setState({
      menu,
    });
  },
  'threeD-menuNavTab-browse': e => {
    const {menu} = getState();
    menu.activeTab = 'browse';
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
  'threeD-social-tradeBtn': e => {
    const {menu} = getState();
    menu.trade.visible = true;
    menu.trade.toPeer = e.name;
    menu.trade.fromPeer = loginManager.getAddress();
    setState({
      menu,
    });
  },
  'threeD-trade-agreement': e => {
    const {menu} = getState();
    menu.trade.agreement = !menu.trade.agreement;
    setState({menu});
  },
  'threeD-trade-header-backBtn': e => {
    const {menu} = getState();
    menu.trade = clone(defaultState.menu.trade);
    setState({
      menu,
    });
  },
  'threeD-trade-cancel': e => {
    const {menu} = getState();
    menu.trade = clone(defaultState.menu.trade);
    setState({
      menu,
    });
  },
  'threeD-trade-peers-card': e => {
    const {menu} = getState();
    menu.trade.toPeer = e.name;
    menu.trade.agreement = false;
    setState({menu});
  },
  'threeD-trade-inventory-back': e => {
    const {menu} = getState();
    menu.trade.inventoryPage > 0 ? menu.trade.inventoryPage-- : null;
    setState({menu});
  },
  'threeD-trade-inventory-forward': e => {
    const {menu} = getState();
    menu.trade.inventoryPage < Math.round(menu.inventory.items.length / inventoryPageLimit) ? menu.trade.inventoryPage++ : null;
    setState({menu});
  },
  'threeD-trade-peers-back': e => {
    const {menu} = getState();
    menu.trade.peersPage > 0 ? menu.trade.peersPage-- : null;
    setState({menu});
  },
  'threeD-trade-peers-forward': e => {
    const {menu} = getState();
    menu.trade.peersPage < Math.round(menu.social.peers.length / peersPageLimit) ? menu.trade.peersPage++ : null;
    setState({menu});
  },
  'threeD-trade-accept': async (e) => {
    const {menu} = getState();
    if (isTradeReady()) {
      const trade = {
        toPeer: menu.trade.toPeer,
        fromPeer: menu.trade.fromPeer,
        item: menu.trade.selectedItem
      };
      const contractSource = await getContractSource('transferNft.cdc');
      const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
        method: 'POST',
        body: JSON.stringify({
          address: trade.fromPeer,
          mnemonic: loginManager.getMnemonic(),
          limit: 1000,
          transaction: contractSource
            .replace(/ARG0/g, trade.item)
            .replace(/ARG1/g, '0x' + trade.toPeer)
            .replace(/ARG2/g, 1),
          wait: true,
        }),
      });
      const response2 = await res.json();
      menu.trade = clone(defaultState.menu.trade);
      setState({ 
        menu,
      });
    } else {
      // no agreement
    }
  },
  'threeD-trade-inventory-card': e => {
    const {menu} = getState();
    menu.trade.selectedItem = parseInt(e.name, 10);
    menu.trade.agreement = false;
    setState({menu});
  },
  'twoD-menuNavTab-inventory': e => {
    const {menu} = getState();
    menu.activeTab = 'inventory';
    setState({
      menu,
    });
  },
  'twoD-menuNavTab-browse': e => {
    const {menu} = getState();
    menu.activeTab = 'browse';
    setState({
      menu,
    });
  },
  'twoD-menuNavTab-social': e => {
    const {menu} = getState();
    menu.activeTab = 'social';
    setState({
      menu,
    });
  },
  'twoD-menuNavTab-worlds': async (e) => {
    const {menu} = getState();
    const response = await fetch('https://worlds.exokit.org/list');
    const json = await response.json();
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
  'twoD-social-peerCard-trade': e => {
    const {menu} = getState();
    menu.trade.visible = true;
    menu.trade.toPeer = e.name;
    menu.trade.fromPeer = loginManager.getAddress();
    setState({menu});
  },
  'twoD-trade-inventory-card': e => {
    const {menu} = getState();
    menu.trade.selectedItem = parseInt(e.name, 10);
    setState({menu});
  },
  'twoD-trade-peers-card': e => {
    const {menu} = getState();
    menu.trade.toPeer = e.name;
    setState({menu});
  },
  'twoD-trade-cancel': e => {
    const {menu} = getState();
    menu.trade = defaultState.menu.trade;
    setState({
      menu,
    });
  },
  'twoD-trade-accept': async (e) => {
    const {menu} = getState();
    if (isTradeReady()) {
      const trade = {
        toPeer: menu.trade.toPeer,
        fromPeer: menu.trade.fromPeer,
        item: menu.trade.selectedItem
      };
      const contractSource = await getContractSource('transferNft.cdc');
      const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
        method: 'POST',
        body: JSON.stringify({
          address: trade.fromPeer,
          mnemonic: loginManager.getMnemonic(),
          limit: 1000,
          transaction: contractSource
            .replace(/ARG0/g, trade.item)
            .replace(/ARG1/g, '0x' + trade.toPeer)
            .replace(/ARG2/g, 1),
          wait: true,
        }),
      });
      const response2 = await res.json();
      menu.trade = clone(defaultState.menu.trade);
      setState({
        menu,
      });
    } else {
      // no agreement
    }
  },
  'twoD-trade-agreement': e => {
    const {menu} = getState();
    menu.trade.agreement = !menu.trade.agreement;
    setState({menu});
  },
  'inventory-spawn': async e => {
    const id = e.name;
    document.dispatchEvent(new MessageEvent('drop', {
      data: {
        dragid: 'inventory-' + id,
      },
    }));
  },
  'inventory-trade': async e => {
    const {menu} = getState();
    menu.trade.visible = true;
    menu.trade.selectedItem = parseInt(e.name, 10);
    menu.trade.fromPeer = loginManager.getAddress();
    setState({menu});
  },
  'browse-spawn': async e => {
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
    const {menu} = getState();
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
    const {menu} = getState();
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
    const {menu} = getState();
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
  'twoD-inventoryCardTradeBtn': e => {
    const {menu} = getState();
    menu.trade.visible = true;
    menu.trade.selectedItem = parseInt(e.name, 10);
    menu.trade.fromPeer = loginManager.getAddress();
    setState({menu});
  },
  'twoD-inventory-card': e => {
    const {menu} = getState();
    menu.inventory.selectedId = parseInt(e.name, 10);
    menu.inventory.selectedItem = menu.inventory.items.find(item => item.id === menu.inventory.selectedId);
    setState({menu});
  },
  'twoD-browse-card': e => {
    const {menu} = getState();
    menu.browse.selectedId = parseInt(e.name, 10);
    menu.browse.selectedItem = menu.browse.items.find(item => item.id === menu.browse.selectedId);
    setState({menu});
  }
};

inventory.addEventListener('ownedfilesupdate', e => {
  const {menu} = state;
  menu.inventory.items = e.data;
  updateProps({
    menu,
  });
});
planet.addEventListener('peersupdate', e => {
  const {menu} = state;
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
        allItems: appState.menu.browse.items,
        trade: appState.menu.trade,
        inventory: appState.menu.inventory,
        browse: appState.menu.browse
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
    appState[k] = newProps[k];
  }
  if (appState.pointerLock || appState.isXR) {
    appContainer.style.display = 'none';
    if ('menu' in newProps || 'pointerLock' in newProps || 'isXR' in newProps) {
      uiManager.menuMesh.update();
    }
  } else if (!appState.selectedWeapon) {
    appContainer.style.display = 'none';
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