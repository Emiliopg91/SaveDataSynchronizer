import { App } from '@renderer/components/App';
import { AppsProvider } from '@renderer/contexts/AppsContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import 'primereact/resources/themes/bootstrap4-light-blue/theme.css';
import React from 'react';
import { createRoot } from 'react-dom/client';

import '../../styles/styles.css';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AppsProvider>
      <App />
    </AppsProvider>
  </React.StrictMode>
);
