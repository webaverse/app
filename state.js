    const state = {
        isXR: false,
        pointerLock: false,
        menu: {
            isHidden: true,
            activeTab: '',
            account: {
                name: '',
                avatar: null,
                isMic: false,
                equipped: []
            },
            inventory: {
                items: []
            },
            world: {
                peers: []
            },

        },
        weaponWheel: {
            isHidden: true,
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