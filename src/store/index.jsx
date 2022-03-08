
import React, { createContext, useReducer } from 'react';

import { CombinedReducer, initalState } from './reducers';

//

export const store = createContext( initalState );
const Provider = store.Provider;

export const StateProvider = ({ children }) => {

    const [ state, dispatch ] = useReducer( CombinedReducer, initalState );

    return <Provider value={{ state, dispatch }}>{ children }</Provider>;

};
