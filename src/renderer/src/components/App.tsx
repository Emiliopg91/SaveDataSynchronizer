import { AppsContext } from '@renderer/contexts/AppsContext';
import {
  AppRouter,
  LoadScreen,
  NavBarConfiguration,
  RouteConfiguration,
  TranslatorRenderer
} from '@tser-framework/renderer';
import { useContext, useEffect, useState } from 'react';
import { FaCoffee, FaCog, FaExclamation } from 'react-icons/fa';

import { ConfigurationModal } from './ConfigurationModal';
import { Games } from './Games';
import { NewEntryModal } from './NewEntryModal';

export function App(): JSX.Element {
  const ctx = useContext(AppsContext);
  const [routes, setRoutes] = useState<Array<RouteConfiguration>>([]);
  const [navBarCfgTop, setNavBarCfgTop] = useState<Array<NavBarConfiguration>>([]);
  const [navBarCfgBottom, setNavBarCfgBottom] = useState<Array<NavBarConfiguration>>([]);

  const onClickBuyMeACoffee = (): void => {
    window.api.buyMeACoffee();
  };
  const onClickConfiguration = (): void => {
    ctx.setShowCfgModal(true);
  };
  const onClickUpdate = (): void => {
    window.api.triggerUpdate();
  };

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

    const newRoutes: Array<RouteConfiguration> = ctx.categories.map((c) => {
      let path = '/' + c.replace('game', '');
      if (c != 'game') {
        path += 's';
      }
      return { path, element: <Games type={c} /> };
    });
    setRoutes(newRoutes);
  }, [ctx.categories]);

  useEffect(() => {
    const newNavBarCfgBottom: Array<NavBarConfiguration> = [
      {
        text: TranslatorRenderer.translate('configuration'),
        icon: <FaCog />,
        onClick: onClickConfiguration
      },
      {
        text: TranslatorRenderer.translate('make.a.donation'),
        icon: <FaCoffee />,
        onClick: onClickBuyMeACoffee
      }
    ];
    if (ctx.pendingUpdate) {
      newNavBarCfgBottom.push({
        text: TranslatorRenderer.translate('update.available'),
        icon: <FaExclamation />,
        id: 'pendingUpdate',
        onClick: onClickUpdate
      });
    }
    setNavBarCfgBottom(newNavBarCfgBottom);
  }, [ctx.pendingUpdate]);

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
      {ctx.showCfgModal && <ConfigurationModal />}
      {ctx.showAddModal && <NewEntryModal />}
      <AppRouter
        navBarCfgTop={navBarCfgTop}
        navBarCfgBottom={navBarCfgBottom}
        routes={routes}
      ></AppRouter>
    </>
  );
}