
import { SET_SETTINGS_OPEN } from '../../actions/Actions';

//

export const initalSettingsStateValue = {
    opened:     false,
    activeTab:  'general'
};

export const SettingsReducer = ( state, action ) => {

    switch ( action.type ) {

        case SET_SETTINGS_OPEN: {

            return {
                ...state,
                opened:     action.opened ?? ( ! state.opened )
            };

        }

        case SET_SETTINGS_ACTIVE_TAB: {

            return {
                ...state,
                activeTab:  action.activeTab
            };

        }

    }

};
