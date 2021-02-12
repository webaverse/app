import {menuActions} from '../store/actions.js';
import {menuState} from '../store/state.js';
import {inventorySpecs} from '../../inventory.js';

const InventoryListCard = (initialVnode) => {
  return {
    view: (vnode) => {
      return m("div", { class: "Inventory-list-card" }, [
        m("img", { 
          src: initialVnode.attrs.preview_url,
          class: "Inventory-list-card-image"
        })
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
        ])
      ]);
    }
  };
};