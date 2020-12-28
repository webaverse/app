import { React, ReactDOM, useEffect, useReducer, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import { EthereumManagerFactory } from "./classes/EthereumManager.js";
import { PageRouter } from './components/PageRouter.js';
import ActionTypes from './constants/ActionTypes.js';
import { Context } from './constants/Context.js';
import { InitialStateValues } from './constants/InitialStateValues.js';
import { addToLoadout, clearInventroryForCreator, getBoothForCreator, getBooths, getCreators, getInventoryForCreator, getProfileForCreator, initializeStart, loginWithEmailCode, loginWithEmailOrPrivateKey, logout, setMainnetAddress } from './functions/Functions.js';
import htm from './web_modules/htm.js';

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
        getProfileForCreator(action.payload.address, action.payload.successCallback, action.payload.errorCallback, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

        case ActionTypes.GetBoothForCreator:
          getBoothForCreator(action.payload.address, action.payload.page, state).then(newState => {
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

      case ActionTypes.ConnectMainnetWallet:
        setMainnetAddress(action.payload.address, state).then(newState => {
          dispatch({ type: ActionTypes.ReturnAsyncState, payload: { state: newState } });
        });
        return state;

        case ActionTypes.AddToLoadout:
          addToLoadout(action.payload.id, state).then(newState => {
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

      default:
        console.warn("Default case in reducer, something is wrong");
        console.warn(action);
        return state;

    }
  }, InitialStateValues);
  window.dispatch = dispatch;
  window.state = state;
  const [initState, setInitState] = useState(false);

  const handleEthereumAddressChange = (address) =>
    dispatch( { type: ActionTypes.ConnectMainnetWallet, payload: { address }});

  // Create an instance of the ethereum manager that can be called from window.ethereumManager or EthereumManager.instance
  window.ethereumManager = EthereumManagerFactory(handleEthereumAddressChange);

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
      <${PageRouter} subdirectory=${window.locationSubdirectory } />
    </${Context.Provider}>
    `}
  <//>
`
}

ReactDOM.render(html`<${Application} />`,
  document.getElementById('root')
)