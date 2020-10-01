let state = {
    inventory: {},
    avaersAviary: {}
};

export const setState = (newState) => {
    for (let k in newState) {
       state[k] = newState[k];
    }
}

export const getState = () => {
    return state;
}