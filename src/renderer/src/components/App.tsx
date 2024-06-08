import { AppsContext } from '@renderer/contexts/AppsContext';
import { Constants } from '@renderer/libraries/Constants';
import {
  LoadScreen,
  Loading,
  NavBar,
  NavBarConfiguration,
  TranslatorRenderer
} from '@tser-framework/renderer';
import { useContext, useEffect } from 'react';
import { FaCog } from 'react-icons/fa';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ConfigurationModal } from './ConfigurationModal';
import { Games } from './Games';
import { NewEntryModal } from './NewEntryModal';
import { StatusBar } from './StatusBar';

export function App(): JSX.Element {
  const ctx = useContext(AppsContext);

  const navBarCfgTop: Array<NavBarConfiguration> = [
    {
      text: TranslatorRenderer.translate('games'),
      link: Constants.ROUTE_GAMES
    },
    {
      text: TranslatorRenderer.translate('emulators'),
      link: Constants.ROUTE_EMULATORS
    },
    {
      text: TranslatorRenderer.translate('launchers'),
      link: Constants.ROUTE_LAUNCHERS
    }
  ];
  const navBarCfgBottom: Array<NavBarConfiguration> = [
    {
      text: TranslatorRenderer.translate('configuration'),
      icon: <FaCog />,
      onClick: (): void => {
        ctx.setShowCfgModal(true);
      }
    }
  ];

  useEffect(() => {
    const unsubscribe = window.api.syncInProgress((_, value) => {
      if (value) LoadScreen.startLoading();
      else LoadScreen.stopLoading();
    });

    return (): void => {
      unsubscribe();
    };
  }, []);

  return (
    <MemoryRouter>
      <div>{JSON.stringify(ctx)}</div>
      {ctx.showCfgModal && <ConfigurationModal />}
      {ctx.showAddModal && <NewEntryModal />}
      <Loading color="white" />
      <NavBar top={navBarCfgTop} bottom={navBarCfgBottom} />
      <div id="router">
        <Routes>
          <Route path={Constants.ROUTE_GAMES} element={<Games type="game" />} />
          <Route path={Constants.ROUTE_EMULATORS} element={<Games type="emulator" />} />
          <Route path={Constants.ROUTE_LAUNCHERS} element={<Games type="launcher" />} />
        </Routes>
      </div>
      <StatusBar />
    </MemoryRouter>
  );
}
