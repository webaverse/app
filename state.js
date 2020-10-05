export const state = {
    isXR: false,
    pointerLock: false,
    menu: {
        visible: false,
        activeTab: 'inventory',
        account: {
            name: '',
            avatar: null,
            isMic: false,
            equipped: []
        },
        inventory: {
            items: [],
            selectedId: null,
            selectedHash: null,
            selectedFileName: null,
        },
        world: {
            peers: []
        },
    },
    weaponWheel: {
        visible: false,
        activeWeapon: '',
        weapons: [],
    }
};

const emitChange = (changedKeys) => {
    window.dispatchEvent(new CustomEvent("stateChanged", { 
        detail: {
            changedKeys: changedKeys 
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

export const setState = (newState) => {
    for (const k in newState) {
       state[k] = newState[k];
    }
    emitChange(Object.keys(newState));
};

export const getState = () => {
    return state;
};