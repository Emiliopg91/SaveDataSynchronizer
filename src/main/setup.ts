import {
  AppConfig,
  ConfigurationHelper,
  DeepLinkBinding,
  File,
  IpcListener,
  LoggerMain,
  ProtocolBinding,
  TranslatorMain,
  TrayBuilder,
  WindowConfig,
  defaultIpcListeners,
  defaultProtocolBindings
} from '@tser-framework/main';
import { Mutex } from 'async-mutex';
import { autoUpdater } from 'electron-updater';
import { shell } from 'electron/common';
import { BrowserWindow, MenuItemConstructorOptions, Settings, app, dialog } from 'electron/main';
import path from 'path';

import { mainWindow } from '.';
import { issues } from '../../package.json';
import icon45 from '../../resources/icons/icon-45x45.png?asset';
import icon512 from '../../resources/icons/icon-512x512.png?asset';
import { Configuration } from './libraries/dtos/Configuration';
import { Game } from './libraries/dtos/Game';
import { Constants } from './libraries/helpers/Constants';
import { GameHelper } from './libraries/helpers/GameHelper';
import { NotificationUtils } from './libraries/helpers/NotificationUtils';
import { RCloneClient } from './libraries/helpers/RCloneClient';
import { Launchers } from './libraries/logic/Launchers';
import { SaveDataSynchronizer } from './libraries/logic/SaveDataSynchronizer';

const LOGGER = new LoggerMain('main/setup.ts');
const sdsStartupDefinition: Settings = { path: app.getPath('exe') };

let connectedToInet = false;
const mutex: Mutex = new Mutex();

export const appConfig: AppConfig = {
  singleInstance: true,
  splashScreen: 3000
};

export const windowConfig: WindowConfig = {
  hideMenu: true,
  minimizeToTray: false,
  closeToTray: true,
  escCloseWindow: false,
  zoom: false,
  icon: icon512,
  constructorOptions: {
    width: 760,
    minWidth: 760,
    maxWidth: 760,
    height: 760,
    minHeight: 760,
    maxHeight: 760,
    maximizable: false,
    fullscreenable: false,
    resizable: false,
    show: false,
    title: app.getName() + ' v' + app.getVersion(),
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
  .withToolTip(app.name + ' v' + app.getVersion())
  .withMenu([
    {
      label: 'exit',
      click(): void {
        RCloneClient.MUTEX.acquire().then(() => {
          process.exit();
        });
      }
    }
  ]);

export const ipcListeners: Record<string, IpcListener> = {
  ...defaultIpcListeners,
  'get-games': {
    sync: true,
    fn(_, type: string) {
      return SaveDataSynchronizer.CONFIG.games
        .filter((g) => {
          return g.category == type;
        })
        .map((g) => {
          return {
            name: g.name,
            icon: g.icon
          };
        })
        .sort((a, b) => {
          return a.name.localeCompare(b.name);
        });
    }
  },
  'get-running-games': {
    sync: true,
    fn(_, type: string) {
      return SaveDataSynchronizer.CONFIG.games
        .filter((g) => {
          return g.category == type && g.pid;
        })
        .map((g) => {
          return g.name;
        })
        .sort((a, b) => {
          return a.localeCompare(b);
        });
    }
  },
  'get-all-games': {
    sync: true,
    fn() {
      return SaveDataSynchronizer.CONFIG.games
        .map((g) => {
          return {
            name: g.name,
            icon: g.icon,
            category: g.category
          };
        })
        .sort((a, b) => {
          return a.name.localeCompare(b.name);
        });
    }
  },
  launch: {
    sync: false,
    fn(_, name: string) {
      GameHelper.launch(
        SaveDataSynchronizer.CONFIG.games.filter((g) => {
          return g.name == name;
        })[0]
      );
    }
  },
  sync: {
    sync: false,
    async fn(_, name: string) {
      await RCloneClient.remoteSync();
      if (
        GameHelper.synchronize(
          SaveDataSynchronizer.CONFIG.games.filter((g) => {
            return g.name == name;
          })[0]
        ) > 0
      ) {
        await RCloneClient.localSync();
      }
    }
  },
  'explore-exe': {
    sync: true,
    fn() {
      const exe = dialog.showOpenDialogSync(mainWindow as BrowserWindow, {
        title: TranslatorMain.translate('select.executable'),
        filters: [{ name: '', extensions: ['exe'] }],
        properties: ['openFile']
      });
      if (exe) {
        console.info('Selected executable ' + exe);
      }
      return exe ? exe[0] : '';
    }
  },
  'explore-local': {
    sync: true,
    fn() {
      const localDir = dialog.showOpenDialogSync(mainWindow as BrowserWindow, {
        title: TranslatorMain.translate('select.local.dir'),
        properties: ['openDirectory']
      });

      if (localDir) {
        console.info('Selected local dir ' + localDir);
      }
      return localDir ? localDir[0] : '';
    }
  },
  'list-local': {
    sync: true,
    fn(_, localDir: string): Array<string> {
      return new File({ file: localDir })
        .list()
        .filter((f) => {
          return !f.isDirectory();
        })
        .map((f) => {
          return f.getName();
        });
    }
  },
  'explore-remote': {
    sync: true,
    fn() {
      do {
        const remoteDir = dialog.showOpenDialogSync(mainWindow as BrowserWindow, {
          title: TranslatorMain.translate('select.remote.dir'),
          defaultPath: Constants.REMOTE_FOLDER,
          properties: ['openDirectory']
        });

        if (remoteDir) {
          if (remoteDir[0].startsWith(Constants.REMOTE_FOLDER)) {
            return remoteDir[0];
          } else {
            dialog.showErrorBox(
              TranslatorMain.translate('invalid.remote.dir'),
              TranslatorMain.translate('remote.must.be.inside', { remote: Constants.REMOTE_FOLDER })
            );
          }
        } else {
          return undefined;
        }
        // eslint-disable-next-line no-constant-condition
      } while (true);
    }
  },
  'delete-entry': {
    sync: true,
    async fn(_, name: string) {
      console.info("Looking for game '" + name + "' for deletion");
      const cfg: Configuration = ConfigurationHelper.configAsInterface<Configuration>();
      for (const i in cfg.games) {
        if (cfg.games[i].name == name) {
          for (const j in SaveDataSynchronizer.CONFIG.games) {
            if (SaveDataSynchronizer.CONFIG.games[j].name == cfg.games[i].name) {
              if (SaveDataSynchronizer.CONFIG.games[i].icon) {
                try {
                  new File({ file: SaveDataSynchronizer.CONFIG.games[i].icon as string }).delete();
                } catch (e) {
                  console.error(
                    "Error deleting icon '" + SaveDataSynchronizer.CONFIG.games[i].icon + "'"
                  );
                }
              }
            }
          }
          cfg.games.splice(Number(i), 1);
          console.info('Reloading application configuration');
          SaveDataSynchronizer.loadConfigFile();
          break;
        }
      }
    }
  },
  'save-entry': {
    sync: true,
    async fn(_, data: object) {
      const game: Game = data as Game;
      if (game.inclusions?.length == 0) {
        game.inclusions = undefined;
      }
      if (game.exclusions?.length == 0) {
        game.exclusions = undefined;
      }
      game.remoteDir = game.remoteDir.replaceAll(Constants.REMOTE_FOLDER, '');
      delete game['policy'];

      console.info('Saving to file:\n' + JSON.stringify(game, null, 2));
      ConfigurationHelper.configAsInterface<Configuration>().games.push(game);
      await SaveDataSynchronizer.loadConfigFile();
      for (const j in SaveDataSynchronizer.CONFIG.games) {
        if (SaveDataSynchronizer.CONFIG.games[j].name == game.name) {
          NotificationUtils.displayEntrySaved(SaveDataSynchronizer.CONFIG.games[j].icon);
        }
      }
    }
  },
  'trigger-update': {
    sync: false,
    async fn() {
      dialog
        .showMessageBox({
          type: 'info',
          buttons: [
            TranslatorMain.translate('restart.now'),
            TranslatorMain.translate('update.on.restart')
          ],
          defaultId: 0,
          cancelId: 1,
          title: TranslatorMain.translate('update.available'),
          message: TranslatorMain.translate('update.available.msg')
        })
        .then((returnValue) => {
          if (returnValue.response === 0) {
            RCloneClient.MUTEX.acquire().then((release) => {
              NotificationUtils.displayInstallingUpdate();
              autoUpdater.quitAndInstall();
              release();
            });
          }
        });
    }
  },
  'buy-me-a-coffee': {
    sync: false,
    fn() {
      shell.openExternal('https://buymeacoffee.com/emiliopg91');
    }
  },
  'kill-app': {
    sync: false,
    fn(_, appName: string) {
      GameHelper.kill(appName);
    }
  },
  'get-app-cfg': {
    sync: true,
    fn() {
      const cfg = JSON.parse(
        JSON.stringify(ConfigurationHelper.configAsInterface<Configuration>())
      );
      cfg['autostart'] = app.getLoginItemSettings(sdsStartupDefinition).openAtLogin;
      if (!cfg['minimized']) {
        cfg['minimized'] = false;
      }
      delete cfg['games'];
      delete cfg['checkInterval'];

      return cfg;
    }
  },
  'save-app-cfg': {
    sync: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn(_, newCfg: any) {
      LOGGER.info('Saving new configuration', newCfg);
      const cfg = ConfigurationHelper.configAsInterface<Configuration>();
      const restart = cfg.remote != newCfg['remote'];
      app.setLoginItemSettings({
        ...sdsStartupDefinition,
        openAtLogin: newCfg['autostart']
      });
      Object.keys(newCfg).forEach((id) => {
        if (id != 'autostart') {
          cfg[id] = newCfg[id];
        }
      });
      if (restart) {
        app.relaunch();
        app.quit();
      }
    }
  },
  'get-launchers': {
    sync: true,
    fn() {
      return {
        steam: Launchers.isSteamInstalled(),
        gog: Launchers.isGOGInstalled(),
        epic: Launchers.isEpicInstalled()
      };
    }
  },
  'get-icon-path': {
    sync: true,
    fn() {
      return Constants.ICONS_FOLDER;
    }
  },
  'launch-steam': {
    sync: false,
    fn() {
      Launchers.launchSteam();
    }
  },
  'launch-steam-bp': {
    sync: false,
    fn() {
      Launchers.launchSteamBigPicture();
    }
  },
  'launch-gog': {
    sync: false,
    fn() {
      Launchers.launchGOG();
    }
  },
  'launch-epic': {
    sync: false,
    fn() {
      Launchers.launchEpic();
    }
  },
  'report-bug': {
    sync: false,
    fn() {
      shell.openExternal(issues);
    }
  },
  'network-status': {
    sync: false,
    fn(_, connected: boolean) {
      mutex.acquire().then((release) => {
        if (String(connected) != String(connectedToInet)) {
          new LoggerMain('NetworkStatus').info(
            connected ? 'Connected to Internet' : 'Disconnected to Internet'
          );
        }

        connectedToInet = connected;
        RCloneClient.CONNECTED = connected;

        release();
      });
    }
  }
};
export const protocolBindings: Record<string, ProtocolBinding> = {
  ...defaultProtocolBindings
};

export const deepLinkBindings: Record<string, DeepLinkBinding> = {};
