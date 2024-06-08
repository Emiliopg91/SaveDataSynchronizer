import { AppsContext } from '@renderer/contexts/AppsContext';
import {
  LoadScreen,
  Loading,
  NavBar,
  NavBarConfiguration,
  TranslatorRenderer
} from '@tser-framework/renderer';
import { useContext, useEffect, useState } from 'react';
import { FaCog } from 'react-icons/fa';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ConfigurationModal } from './ConfigurationModal';
import { Games } from './Games';
import { NewEntryModal } from './NewEntryModal';
import { StatusBar } from './StatusBar';

export function App(): JSX.Element {
  const ctx = useContext(AppsContext);
  const [navBarCfgTop, setNavBarCfgTop] = useState<Array<NavBarConfiguration>>([]);

  useEffect(() => {
    const newNavBarCfgTop: Array<NavBarConfiguration> = [];
    ctx.categories.forEach((c) => {
      let path = '/' + c.replace('game', '');
      if (c != 'game') {
        path += 's';
      }
      newNavBarCfgTop.push({
        text: TranslatorRenderer.translate(c + 's'),
        link: path
      });
    });
    setNavBarCfgTop(newNavBarCfgTop);
  }, [ctx.categories]);

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
    <>
      <>
        {' '}
        <MemoryRouter>
          <div>{JSON.stringify(ctx)}</div>
          {ctx.showCfgModal && <ConfigurationModal />}
          {ctx.showAddModal && <NewEntryModal />}
          <Loading color="white" />
          <NavBar top={navBarCfgTop} bottom={navBarCfgBottom} />
          <div id="router">
            <Routes>
              {ctx.categories.map((c) => {
                let path = '/' + c.replace('game', '');
                if (c != 'game') {
                  path += 's';
                }
                return <Route key={c} path={path} element={<Games type={c} />} />;
              })}
            </Routes>
          </div>
          <StatusBar />
        </MemoryRouter>
      </>
    </>
  );
}
