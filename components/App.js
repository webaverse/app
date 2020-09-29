import Inventory from './Inventory.js';
import Nav from './Nav.js';
import inventory from '../inventory.js';

let appProps = {
    inventory: inventory,
    inventoryItems: []
};
const appContainer = document.getElementById('appContainer');

const App = (props) => {
    return `
        ${Nav(props)}
        ${Inventory(props)}
    `;
}

window.addEventListener('load', (e) => {
    appContainer.innerHTML = App(appProps);
    appContainer.querySelector('#twoD-inventoryUploadBtn').addEventListener('change', (e) => {
        const file = e.target.files[0];
        appProps.inventory.uploadFile(file);
    })
    console.log(appProps);
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
        appContainer.innerHTML = App(appProps);
    }
}

const functionValueExtractor = async (fn) => {
    return await fn();
}

appProps.inventory.addEventListener('filesupdate', (e) => {
    console.log(e.data)
    updateProps({ inventoryItems: e.data })
})

export {
    App,
    updateProps,
    functionValueExtractor
}