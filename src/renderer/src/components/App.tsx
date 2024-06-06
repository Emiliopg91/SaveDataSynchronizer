import { Constants } from '@renderer/libraries/Constants';
import {
  LoadScreen,
  Loading,
  NavBar,
  NavBarConfiguration,
  TranslatorRenderer
} from '@tser-framework/renderer';
import { useEffect } from 'react';
import { IoIosRocket } from 'react-icons/io';
import { IoGameController } from 'react-icons/io5';
import { SiRetroarch } from 'react-icons/si';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Games } from './Games';
import { NewEntryModal } from './NewEntryModal';
import { StatusBar } from './StatusBar';

export function App(): JSX.Element {
  const navBarCfg: Array<NavBarConfiguration> = [
    {
      text: TranslatorRenderer.translate('games'),
      link: Constants.ROUTE_GAMES,
      icon: <IoGameController />
    },
    {
      text: TranslatorRenderer.translate('emulators'),
      link: Constants.ROUTE_EMULATORS,
      icon: <SiRetroarch />
    },
    {
      text: TranslatorRenderer.translate('launchers'),
      link: Constants.ROUTE_LAUNCHERS,
      icon: <IoIosRocket />
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
    <>
      <>
        {' '}
        <MemoryRouter>
          <NewEntryModal />
          <Loading color="white" />
          <NavBar config={navBarCfg} />
          <div id="router">
            <Routes>
              <Route path={Constants.ROUTE_GAMES} element={<Games type="game" />} />
              <Route path={Constants.ROUTE_EMULATORS} element={<Games type="emulator" />} />
              <Route path={Constants.ROUTE_LAUNCHERS} element={<Games type="launcher" />} />
            </Routes>
          </div>
          <StatusBar />
        </MemoryRouter>
      </>
    </>
  );
}
