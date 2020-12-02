import { ActionTypes } from "./ActionTypes";

export const reducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.Login:
      window.UserManager.trylogin();
      return { ...state, loginToken: storage.get('loginToken') };
    case ActionTypes.Logout:
      console.warn("Logout not implemented");
      return state;
    default:
      console.warn("Invalid action sent to reducer");
  }
};
