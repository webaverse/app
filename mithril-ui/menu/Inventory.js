import {menuActions, actionSlotsActions} from '../store/actions.js';
import {menuState, actionSlotsState} from '../store/state.js';
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

const InspectActions = (initialVnode) => {
  return {
    view: (vnode) => {
      return menuState.selectedItem?.id && m("div", { class: "Inventory-inspect-actions" }, [
        m("button", { class: "Inventory-inspect-button wear" }, "WEAR"),
        m("button", { class: "Inventory-inspect-button spawn" }, "SPAWN"),
      ])
    }
  };
};

const InspectPanel = (initialVnode) => {
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
        m(InspectActions),
      ]);
    }
  };
};

const ActionSlots = (initialVnode) => {
  const onSlotClick = (slot) => {
    actionSlotsActions.setActionSlot({
      id: slot.id,
      image: !slot.image ? menuState.selectedItem.preview_url : null
    })
  };
  return {
    view: (vnode) => {
      return m("div", { class: "Inventory-actionslots" }, [
        m("h2", { class: "Inventory-actionslots-header" }, "Action Slots"),
        m("div", { class: "Inventory-actionslots-container" }, [
          actionSlotsState.slots.map(slot => {
            return m("div", { 
              class: "Inventory-actionslots-slot",
              onclick: () => onSlotClick(slot),
            }, [
              m("p", { class: "Inventory-actionslots-slot-number" }, slot.id),
              slot.image && m("img", {
                src: slot.image,
                class: "Inventory-actionslots-slot-image"
              }),
            ])
          })
        ]),
      ])
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
        m(InspectPanel, menuState.selectedItem),
        m(ActionSlots)
      ]);
    }
  };
};