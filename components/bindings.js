import { App, updateProps } from './App.js';

export const setBindings = (appState, appProps, appHelpers) => {
    window.addEventListener('load', () => {

        // INVENTORY
        console.log('lolrofl', appHelpers.inventory.getItems());

        appContainer.querySelector('#twoD-inventoryUploadBtn').addEventListener('change', (e) => {
            const file = e.target.files[0];
            appHelpers.inventory.uploadFile(file);
        })

        appHelpers.inventory.addEventListener('filesupdate', (e) => {
            console.log(e.data)
            updateProps({ inventoryItems: e.data })
        })

        // Nav
        // const toolbar = document.getElementById('twoD-toolbar');
        // const buttons = toolbar.querySelectorAll('button');
        // console.log(buttons)
        // for (let i = 0; i < buttons.length; ++i) {
        //     buttons[i].addEventListener('click', (e) => {
        //         console.log(e.target.name, e.target.value)
        //     })
        // }

    })
}