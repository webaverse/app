new Error('dead code')
export const defaultState = {
    isXR: false,
    pointerLock: false,
    menu: {
        visible: false,
        activeTab: 'inventory',
        username: 'Anonymous',
        avatarHash: null,
        avatarFileName: null,
        avatarPreview: null,
        inventory: {
        	balance: 0,
            items: [],
            selectedId: null,
            selectedHash: null,
            selectedFileName: null,
            selectedItem: null
        },
        browse: {
            page: 0,
            items: [],
            selectedId: null, // Int
            selectedItem: null // {}
        },
        social: {
            peers: []
        },
        world: {
            peers: [],
            selectedPeerId: null,
        },
        worlds: [],
        trade: {
            visible: false,
            toPeer: null,
            fromPeer: null,
            selectedItem: null,
            agreement: false,
            inventoryPage: 0,
            peersPage: 0,
        }
    },
    weaponWheel: {
        visible: false,
        activeWeapon: '',
        weapons: [],
    }
};

export const state = JSON.parse(JSON.stringify(defaultState));

const emitChange = changedKeys => {
    window.dispatchEvent(new CustomEvent('stateChanged', { 
        detail: {
            changedKeys,
        }
    }));
};

export const getSpecificState = (keys) => {
    let returnState = {};
    for (const k in keys) {
        returnState[keys[k]] = state[keys[k]];
     }
     return returnState;
}

export const setState = newState => {
    for (const k in newState) {
       state[k] = newState[k];
    }
    emitChange(Object.keys(newState));
};

export const getState = () => {
    return state;
};
