const state = {
    isXR: false,
    inventory: {
        items: []
    },
    selectedWeapon: null,
    pointerLock: false
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