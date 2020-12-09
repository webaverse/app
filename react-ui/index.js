import { React, ReactDOM, useEffect, useReducer, useState } from 'https://unpkg.com/es-react/dev';
import { PageRouter } from './components/PageRouter.js';
import ActionTypes from './constants/ActionTypes.js';
import { Context } from './constants/Context.js';
import htm from './web_modules/htm.js';
import { initializeStart, getProfileForCreator, getInventoryForCreator, getCreators, getBooths, loginWithEmailOrPrivateKey, loginWithEmailCode, logout, mintNft, setUsername } from './functions/StateFunctions.js';
import { InitialStateValues } from './constants/InitialStateValues.js';


window.html = htm.bind(React.createElement);

const Application = () => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case ActionTypes.InitializeState:
        initializeStart(state).then(newState => {
          dispatch({ type: ActionTypes.InitializeStateEnd, payload: { state: newState } });
        });
        return state;
  
      case ActionTypes.InitializeStateEnd:
        return { ...state, ...action.payload.state };
  
  
      case ActionTypes.GetProfileForCreator:
        getProfileForCreator(action.payload.address, state).then(newState => {
          dispatch({ type: ActionTypes.GetProfileForCreator.concat('End'), payload: { state: newState } });
        });
        return state;
  
      case ActionTypes.GetProfileForCreator.concat('End'):
        return { ...state, ...action.payload.state };
  
  
      case ActionTypes.GetInventoryForCreator:
        getInventoryForCreator(action.payload.address, action.payload.page, state).then(newState => {
          dispatch({ type: ActionTypes.GetInventoryForCreator.concat('End'), payload: { state: newState } });
        });
        return state;
  
      case ActionTypes.GetInventoryForCreator.concat('End'):
        return { ...state, ...action.payload.state };
  
  
      case ActionTypes.GetCreators:
        getCreators(action.payload.page, state).then(newState => {
          dispatch({ type: ActionTypes.GetCreators.concat('End'), payload: { state: newState } });
        });
        return state;
  
      case ActionTypes.GetCreators.concat('End'):
        return { ...state, ...action.payload.state };
  
  
      case ActionTypes.GetBooths:
        console.log("GetBooths for creator action is", action.payload);
        getBooths(action.payload.page, state).then(newState => {
          dispatch({ type: ActionTypes.GetBooths.concat('End'), payload: { state: newState } });
        });
        return state;
  
      case ActionTypes.GetBooths.concat('End'):
        return { ...state, ...action.payload.state };


      case ActionTypes.RequestEmailToken.concat('End'):
        return { ...state, ...action.payload.state };

      case ActionTypes.LoginWithEmailOrPrivateKey:
        loginWithEmailOrPrivateKey(action.payload.emailOrPrivateKey, state).then(newState => {
          dispatch({ type: ActionTypes.LoginWithEmailOrPrivateKey.concat('End'), payload: { state: newState } });

        });
      return state;
  
      case ActionTypes.LoginWithEmailOrPrivateKey.concat('End'):
        return { ...state, ...action.payload.state };


      case ActionTypes.GatewayWithEmail:
        loginWithEmailCode(action.payload.email, action.payload.code, state).then(newState => {
          dispatch({ type: ActionTypes.GatewayWithEmail.concat('End'), payload: { state: newState } });
        });
        return state;

      case ActionTypes.GatewayWithEmail.concat('End'):
        return { ...state, ...action.payload.state };

  
      case ActionTypes.Logout:
        logout(state).then(newState => {
          dispatch({ type: ActionTypes.Logout.concat('End'), payload: { state: newState } });
        });
        return state;

        case ActionTypes.Logout.concat('End'):
          return { ...state, ...action.payload.state };


      case ActionTypes.MintNft:
        mintNft(action.payload.file,
                action.payload.name,
                action.payload.description,
                action.payload.quantity,
                action.payload.successCallback,
                action.payload.errorCallback,
                state
          ).then(newState => {
          dispatch({ type: ActionTypes.MintNft.concat('End'), payload: { state: newState } });
        });
        return state;

      case ActionTypes.MintNft.concat('End'):
        return { ...state, ...action.payload.state };
        

      case ActionTypes.ChangeName:
        newState = setUsername(action.payload.name, state);
        break;

        case ActionTypes.ConnectMainnetWallet:

        break;

          case ActionTypes.DisconnectWallet:

          break;



      // case ActionTypes.SetAvatar:
      //   newState = setAvatar(action.payload.assetId, state);
      //   break;
  
      // case ActionTypes.SendNft:
      //   return sendNft(action.payload.receiverAddress, action.payload.assetId, state);
  
      // case ActionTypes.BuyNft:
      //   return buyNft(action.payload.assetId, state);
  
      // case ActionTypes.SellNft:
      //   return sellNft(action.payload.assetId, state);
  
      // case ActionTypes.DestroyNft:
      //   return destroyNft(action.payload.assetId, state);
  
      // case ActionTypes.AddFtToNft:
      //   return addFtToNft(action.payload.assetId, state);
  
      // case ActionTypes.DepositFt:
      //   return depositFt(action.payload.amount, state);
  
      // case ActionTypes.WithdrawFt:
      //   return withdrawFt(action.payload.amount, state);
  

      // case ActionTypes.SetHomespace:
      //   newState = setHomespace(action.payload.assetId, state);
      //   break;
  
      // case ActionTypes.AddToLoadout:
      //   newState = setLoadoutState(action.payload.assetId, true, state);
      //   break;
  
      // case ActionTypes.RemoveFromLoadout:
      //   newState = setLoadoutState(action.payload.assetId, false, state);
      //   break;
  
      // case ActionTypes.SetFtu:
      //   newState = setFtu(state);
      //   break;
  
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