import {menuActions} from '../store/actions.js';
import {menuState} from '../store/state.js';
import {inventorySpecs} from '../../inventory.js';

const InventoryListCard = (initialVnode) => {
  return {
    view: (vnode) => {
      return m("div", { 
        class: `Inventory-list-card ${menuState.selectedItem.id === initialVnode.attrs.id ? "selected" : ""}`,
        onclick: () => menuActions.setSelectedItem(initialVnode.attrs)
       }, [
        m("img", { 
          src: initialVnode.attrs.preview_url,
          class: "Inventory-list-card-image"
        })
      ]);
    }
  };
};

const InventoryActions = (initialVnode) => {
   return {
    view: (vnode) => {
      return menuState.selectedItem?.id && m("div", { class: "Inventory-inspect-actions" }, [
        m("button", { class: "Inventory-inspect-button wear" }, "WEAR"),
        m("button", { class: "Inventory-inspect-button spawn" }, "SPAWN"),
      ])
    }
  };
};

const InventoryInspect = (initialVnode) => {
  return {
    view: (vnode) => {
      return m("div", { class: "Inventory-inspect" }, [
        m("img", { class: "Inventory-inspect-preview", src: menuState.selectedItem.preview_url }),
        m("div", { class: "Inventory-inspect-info" }, [
          m("h1", { class: "Inventory-inspect-title" }, menuState.selectedItem.title),
          m("h3", { class: "Inventory-inspect-description" }, menuState.selectedItem.description),
          m("small", { class: "Inventory-inspect-hash" }, menuState.selectedItem.hash),
        ]),
        m("div", { style: "flex-grow: 1" }),
        m(InventoryActions),
      ]);
    }
  };
};

export const Inventory = (initialVnode) => {
  return {
    view: (vnode) => {
      return m("div", { class: "Inventory" }, [
        m("div", { class: "Inventory-list" }, [
          inventorySpecs.map(item => {
            return m(InventoryListCard, item);
          })
        ]),
        m(InventoryInspect, menuState.selectedItem)
      ]);
    }
  };
};