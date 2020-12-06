import { React, ReactDOM, useEffect, useReducer, useState } from 'https://unpkg.com/es-react/dev';
import ActionTypes from './constants/ActionTypes.js';
import { Context } from './constants/Context.js';
import { copyAddress, copyPrivateKey, getBooths, getInventoryForCreator, getProfileForCreator, initializeStart, loginWithEmailCode, loginWithEmailOrPrivateKey, logout, requestTokenByEmail, setAvatar, setFtu, setHomespace, setLoadoutState, setUsername, uploadFile } from './functions/ReducerFunctions.js';
import NavBar from './components/NavBar.js';

import htm from './web_modules/htm.js';
import { PageRouter } from './components/PageRouter.js';

window.html = htm.bind(React.createElement);

const initialValues = {
  loginToken: null,
  name: null,
  mainnetAddress: null,
  avatarThumbnail: null,
  showUserDropdown: false,
  address: null,
  avatarUrl: null,
  avatarFileName: null,
  avatarPreview: null,
  ftu: true,
  inventory: null,
  creatorProfiles: {},
  creatorInventories: {},
  lastFileHash: null,
  lastFileId: null
};

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
        })
        return state;

      case ActionTypes.GetProfileForCreator.concat('End'):
        console.log("New state is", { ...state, ...action.payload.state });
        return { ...state, ...action.payload.state };


      case ActionTypes.GetInventoryForCreator:
        getInventoryForCreator(action.payload.address, action.payload.page, state).then(newState => {
          dispatch({ type: ActionTypes.GetInventoryForCreator.concat('End'), payload: { state: newState } });
        });
        return state;

      case ActionTypes.GetInventoryForCreator.concat('End'):
        return { ...state, ...action.payload.state };


      case ActionTypes.GetCreators:
        getCreators.then(newState => {
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


      case ActionTypes.SendNft:
        return sendNft(action.payload.receiverAddress, action.payload.assetId, state);

      case ActionTypes.BuyNft:
        return buyNft(action.payload.assetId, state);

      case ActionTypes.SellNft:
        return sellNft(action.payload.assetId, state);

      case ActionTypes.DestroyNft:
        return destroyNft(action.payload.assetId, state);

      case ActionTypes.AddFtToNft:
        return addFtToNft(action.payload.assetId, state);

      case ActionTypes.DepositFt:
        return depositFt(action.payload.amount, state);

      case ActionTypes.WithdrawFt:
        return withdrawFt(action.payload.amount, state);




      case ActionTypes.CopyAddress:
        newState = copyAddress(state);
        break;

      case ActionTypes.CopyPrivateKey:
        newState = copyPrivateKey(state);
        break;

      case ActionTypes.ChangeName:
        newState = setUsername(action.payload.newUserName, state);
        break;

      case ActionTypes.SetAvatar:
        newState = setAvatar(action.payload.assetId, state);
        break;

      case ActionTypes.SetHomespace:
        newState = setHomespace(action.payload.assetId, state);
        break;

      case ActionTypes.AddToLoadout:
        newState = setLoadoutState(action.payload.assetId, true, state);
        break;

      case ActionTypes.RemoveFromLoadout:
        newState = setLoadoutState(action.payload.assetId, false, state);
        break;

      case ActionTypes.UploadFile:
        newState = uploadFile(action.payload.file, state);
        break;

      case ActionTypes.SetFtu:
        newState = setFtu(state);
        break;

      case ActionTypes.RequestEmailToken:
        newState = requestTokenByEmail(action.payload.email, state);
        break;

      case ActionTypes.LoginWithEmail:
        newState = loginWithEmailCode(action.payload.email, action.payload.code, state);
        break;

      case ActionTypes.LoginWithEmailOrPrivateKey:
        newState = loginWithEmailOrPrivateKey(action.payload.emailOrPrivateKey, state);
        break;

      case ActionTypes.Logout:
        newState = logout(action.payload.assetId, state);
        break;

      default:
        console.warn("Default case in reducer, something is wrong");
        return state;

    }
  }, initialValues);

  const [initState, setInitState] = useState(false);


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
  <${NavBar} />
    <${PageRouter} />
    </${Context.Provider}>
    `}
  <//>
`
}

ReactDOM.render(html`<${Application} />`,
  document.getElementById('root')
)