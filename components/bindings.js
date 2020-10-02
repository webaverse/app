import { App, updateProps } from './App.js';

export const setBindings = (appProps, appHelpers) => {

    // INVENTORY
    appHelpers.inventory.addEventListener('filesupdate', (e) => {
        updateProps({ inventoryItems: appProps.inventoryItems.concat(e.data)})
    })

    window.handleInventoryUpload = () => {
        const file = document.getElementById("twoD-inventoryUploadBtn").files[0];
        appHelpers.inventory.uploadFile(file);
    }
}