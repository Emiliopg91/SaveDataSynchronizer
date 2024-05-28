import {
  AppConfig,
  DeepLinkBinding,
  IpcListener,
  ProtocolBinding,
  TrayBuilder,
  WindowConfig,
  defaultIpcListeners,
  defaultProtocolBindings
} from '@tser-framework/main';
import { MenuItemConstructorOptions, app, dialog } from 'electron';
import path from 'path';

import icon45 from '../../resources/icons/icon-45x45.png?asset';
import icon512 from '../../resources/icons/icon-512x512.png?asset';

export const appConfig: AppConfig = {
  singleInstance: true,
  splashScreen: 3000
};

export const windowConfig: WindowConfig = {
  hideMenu: true,
  minimizeToTray: true,
  closeToTray: true,
  escCloseWindow: false,
  zoom: false,
  icon: icon512,
  constructorOptions: {
    width: 900,
    height: 670,
    show: false,
    title: app.getName(),
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon512 } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  }
};

export const menuTemplate: Array<MenuItemConstructorOptions> | undefined = undefined;

export const trayBuilder: TrayBuilder | undefined = TrayBuilder.builder(icon45)
  .withToolTip(app.name)
  .withMenu([
    {
      label: 'exit',
      accelerator: 'ctrl+Q',
      click(): void {
        app.quit();
      }
    }
  ]);

export const ipcListeners: Record<string, IpcListener> = {
  ...defaultIpcListeners
};

export const protocolBindings: Record<string, ProtocolBinding> = {
  ...defaultProtocolBindings
};

export const deepLinkBindings: Record<string, DeepLinkBinding> = {
  'electron-fiddle': {
    handler(uri) {
      dialog.showErrorBox('Welcome Back', `You arrived from: ${uri}`);
    }
  }
};
