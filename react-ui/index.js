import { React, ReactDOM, useEffect, useReducer, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import { PageRouter } from './components/PageRouter.js';
import ActionTypes from './constants/ActionTypes.js';
import { Context } from './constants/Context.js';

import htm from './web_modules/htm.js';
import { initializeStart, clearInventroryForCreator, getProfileForCreator, getInventoryForCreator, disconnectMetamask, getCreators, getBooths, loginWithEmailOrPrivateKey, loginWithEmailCode, logout, setName } from './functions/StateFunctions.js';
import { InitialStateValues } from './constants/InitialStateValues.js';


window.html = htm.bind(React.createElement);

const Application = () => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      // Async actions will return by updating their state with this action
      case ActionTypes.ReturnAsyncState:
        return { ...state, ...action.payload.state };

      case ActionTypes.InitializeState:
        initializeStart(state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.GetProfileForCreator:
        getProfileForCreator(action.payload.address, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.GetInventoryForCreator:
        getInventoryForCreator(action.payload.address, action.payload.page, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;


      case ActionTypes.GetCreators:
        getCreators(action.payload.page, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.GetBooths:
        console.log("GetBooths for creator action is", action.payload);
        getBooths(action.payload.page, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.LoginWithEmailOrPrivateKey:
        loginWithEmailOrPrivateKey(action.payload.emailOrPrivateKey, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });

        });
        return state;

      case ActionTypes.GatewayWithEmail:
        loginWithEmailCode(action.payload.email, action.payload.code, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.Logout:
        logout(state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.UpdateInventory:
        // TODO: Update inventory
        clearInventroryForCreator(action.payload.address,
          state
        ).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.SetName:
        setName(action.payload.name, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.ConnectMainnetWallet:
        connectMetamask().then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.DisonnectMainnetWallet:
        disconnectMetamask(state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.SetAvatar:
        setAvatar(action.payload.assetId, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.SetHomespace:
        setHomespace(action.payload.assetId, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.AddToLoadout:
        setLoadoutState(action.payload.assetId, true, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.RemoveFromLoadout:
        setLoadoutState(action.payload.assetId, false, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.SendNft:
        sendNft(action.payload.receiverAddress, action.payload.assetId, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.BuyNft:
        buyNft(action.payload.assetId, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.SellNft:
        sellNft(action.payload.assetId, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.DestroyNft:
        destroyNft(action.payload.assetId, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.AddFtToNft:
        addFtToNft(action.payload.assetId, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.DepositFt:
        depositFt(action.payload.amount, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.WithdrawFt:
        withdrawFt(action.payload.amount, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

      case ActionTypes.SetFtu:
        setFtu(state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;
        
      default:
        console.warn("Default case in reducer, something is wrong");
        console.warn(action);
        return state;

    }
  }, InitialStateValues);
  window.dispatch = dispatch;
  window.state = state;
  const [initState, setInitState] = useState(false);

  useEffect(() => {
    window.dispatch = dispatch;
  }, [dispatch]);

  useEffect(() => {
    window.state = state;
  }, [state]);

  useEffect(() => {
    if (!initState) {
      setInitState(true);
      dispatch({ type: ActionTypes.InitializeState });
      console.log("Render!");
    }
  }, []);
  return html`
  <${React.Suspense} fallback=${html`<div>Loading...</div>`}>
  ${state.address && html`
  <${Context.Provider} value=${{ state, dispatch }}>  
    ${!state.useWebXR ? html`
      <${PageRouter} />
    ` : html`
      <${WebXRContext} />
    `}
    </${Context.Provider}>
    `}
  <//>
`
}

ReactDOM.render(html`<${Application} />`,
  document.getElementById('root')
)