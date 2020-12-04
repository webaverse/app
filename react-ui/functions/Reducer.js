import { ActionTypes } from "../constants/ActionTypes.js";
import { initialize, copyAddress, copyPrivateKey, setUsername, setAvatar, setHomespace, setLoadoutState, getInventoryForSelf, uploadFile, setFtu, requestTokenByEmail, loginWithEmailCode, loginWithEmailOrPrivateKey, logout } from "./Actions.js";

export const Reducer = async (state, action) => {
  switch (action.type) {

    case ActionTypes.InitializeState:
      return await initialize(state);

    case ActionTypes.SendNft:
      return await sendNft(action.payload.receiverAddress, action.payload.assetId, state);

    case ActionTypes.BuyNft:
      return await buyNft(action.payload.assetId, state);

    case ActionTypes.SellNft:
      return await sellNft(action.payload.assetId, state);

    case ActionTypes.DestroyNft:
      return await destroyNft(action.payload.assetId, state);

    case ActionTypes.AddFtToNft:
      return await addFtToNft(action.payload.assetId, state);

    case ActionTypes.DepositFt:
      return await depositFt(action.payload.amount, state);
    
    case ActionTypes.WithdrawFt:
      return await withdrawFt(action.payload.amount, state);

    case ActionTypes.GetBooths:
      return await getBooths(page, state);

    case ActionTypes.GetCreators:
      return await getCreators(page, state);

    case ActionTypes.GetInventoryForCreator:
      return await getInventoryForCreator(action.payload.address, page, state);

    case ActionTypes.GetInventoryForSelf:
      return await getInventoryForSelf(page, state);

    case ActionTypes.CopyAddress:
      return await copyAddress(state);

    case ActionTypes.CopyPrivateKey:
      return await copyPrivateKey(state);

    case ActionTypes.ChangeName:
      return await setUsername(action.payload.newUserName, state);

    case ActionTypes.SetAvatar:
      return await setAvatar(action.payload.assetId, state);

    case ActionTypes.SetHomespace:
      return await setHomespace(action.payload.assetId, state);

    case ActionTypes.AddToLoadout:
      return await setLoadoutState(action.payload.assetId, true, state);

    case ActionTypes.RemoveFromLoadout:
      return await setLoadoutState(action.payload.assetId, false, state);

    case ActionTypes.UploadFile:
      return await uploadFile(action.payload.file, state);

    case ActionTypes.SetFtu:
      return await setFtu(state);

    case ActionTypes.RequestEmailToken:
      return await requestTokenByEmail(action.payload.email, state);

    case ActionTypes.LoginWithEmail:
      return await loginWithEmailCode(action.payload.email, action.payload.code, state);

    case ActionTypes.LoginWithEmailOrPrivateKey:
      return await loginWithEmailOrPrivateKey(action.payload.emailOrPrivateKey, state);

    case ActionTypes.Logout:
      return await logout(action.payload.assetId, state);

    default:
      console.warn("Invalid action sent to reducer");
      return state;
  }
};
