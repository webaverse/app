export const Menu = (initialVnode) => {
  return {
    oninit: (vnode) => {

    },
    view: (vnode) => {
      return m("div", { class: "Menu" }, [
        m("h1", "Menu"),
      ]);
    }
  };
};