import type { ReactNode } from 'react';
import { AppServicesContext, type AppServices } from './services';

export function AppServicesProvider({ services, children }: { services: AppServices; children: ReactNode }) {
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}
