import { React, useEffect } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '/web_modules/htm.js';
import MockAddress from "../mock/Address.js"
import Profile from "./Profile.js"
import MockUserProfileData from "../mock/UserProfileData.js";

const html = htm.bind(React.createElement)

const CreatorProfilePage = () => {
    const [ state, dispatch ] = useContext(Context);
    useEffect(() => {
        // dispatch({type: ActionTypes.GetProfileForCreator, payload: {address: userAddress}})
        // dispatch({type: ActionTypes.GetInventoryForCreator, payload: {address: userAddress, page: 1}})
    }, [userAddress])


    return html`
        <${Profile} userAddress=${MockAddress} userData=${MockUserProfileData} />
    `
  };

  export default CreatorProfilePage;
