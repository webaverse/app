import Inventory from './Inventory.js';

let appProps = {
    test: 'hello'
};
const appContainer = document.getElementById('appContainer');

const App = (props) => {
    return `
        ${Inventory(props)}
    `;
}

window.addEventListener('load', (e) => {
    appContainer.innerHTML = App(appProps);
})

const updateProps = (newProps) => {
    let shouldUpdate = false;
    for (let k in newProps) {
        if (appProps[k] !== newProps[k] && newProps[k]) {
            appProps[k] = newProps[k];
            shouldUpdate = true;
        }
    }
    if (shouldUpdate) {
        appContainer.innerHTML = App(appProps)
    }
    console.log(appProps)
}

const functionValueExtractor = async (fn) => {
    return await fn();
}

export {
    App,
    updateProps,
    functionValueExtractor
}