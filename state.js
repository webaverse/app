const state = {
    inventory: {},
    avaersAviary: {}
};

export const setState = (newState) => {
    for (const k in newState) {
       state[k] = newState[k];
    }
}

export const getState = () => {
    return state;
}