import React, { useContext } from 'react';
import { Application } from '@feathersjs/feathers';


const AppContext = React.createContext<Application>({} as Application);
export const AppProvider = AppContext.Provider;

export function useApp() {
  return useContext(AppContext);
}
