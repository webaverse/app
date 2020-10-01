let state = {
    inventory: {},
    avaersAviary: {}
};

export const setState = (newState) => {
    for (let k in newState) {
        if (state[k] !== newState[k] && newState[k]) {
            state[k] = newState[k];
        }
    }
}

export const getState = (newState) => {
    return state;
}