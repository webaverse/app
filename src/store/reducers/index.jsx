
import { SettingsReducer, initalSettingsStateValue } from './Settings.Reducer';

//

export const initalState = {
    settings:       initalSettingsStateValue
};

export const CombinedReducer = ( state, action ) => {

    const newState = {

        settings: SettingsReducer( state.settings, action )

    };

    return newState;

};
