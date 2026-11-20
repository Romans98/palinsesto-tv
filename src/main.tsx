import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppServicesProvider } from './app/AppServicesProvider';
import { createBrowserServices } from './app/services';
import { ScheduleScreen } from './ui/ScheduleScreen';
import './index.css';

const services = createBrowserServices();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppServicesProvider services={services}>
      <ScheduleScreen />
    </AppServicesProvider>
  </StrictMode>,
);
