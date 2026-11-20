import { createContext, useContext } from 'react';
import { browserStorageChanges, FakeScheduleServer } from '../data/FakeScheduleServer';
import type { ScheduleRepository } from '../data/ScheduleRepository';
import { SimulatedUser } from '../data/SimulatedUser';
import { SIMULATED_USER_KEY, sessionUserName } from '../data/userIdentity';

/** Dipendenze condivise dall'intera app, iniettate tramite Context */
export type AppServices = {
  repository: ScheduleRepository;
  currentUser: string;
  simulatedUser: SimulatedUser;
};

export function createBrowserServices(): AppServices {
  const server = new FakeScheduleServer({ storage: localStorage, externalChanges: browserStorageChanges });
  return {
    repository: server,
    currentUser: sessionUserName(sessionStorage, localStorage),
    simulatedUser: new SimulatedUser(server, sessionUserName(sessionStorage, localStorage, SIMULATED_USER_KEY)),
  };
}

export const AppServicesContext = createContext<AppServices | null>(null);

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (services === null) {
    throw new Error('useAppServices va usato dentro AppServicesProvider');
  }
  return services;
}
