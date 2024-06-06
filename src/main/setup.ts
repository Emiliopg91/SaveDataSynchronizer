import {
  AppConfig,
  ConfigurationHelper,
  DeepLinkBinding,
  FileHelper,
  IpcListener,
  LoggerMain,
  ProtocolBinding,
  TranslatorMain,
  TrayBuilder,
  WindowConfig,
  defaultIpcListeners,
  defaultProtocolBindings
} from '@tser-framework/main';
import { BrowserWindow, MenuItemConstructorOptions, app, dialog, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

import { mainWindow } from '.';
import icon45 from '../../resources/icons/icon-45x45.png?asset';
import icon512 from '../../resources/icons/icon-512x512.png?asset';
import { Configuration } from './libraries/dtos/Configuration';
import { Game } from './libraries/dtos/Game';
import { Constants } from './libraries/helpers/Constants';
import { GameHelper } from './libraries/helpers/GameHelper';
import { NotificationUtils } from './libraries/helpers/NotificationUtils';
import { RCloneClient } from './libraries/helpers/RCloneClient';
import { SaveDataSynchronizer } from './libraries/logic/SaveDataSynchronizer';

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
    width: 680,
    minWidth: 680,
    maxWidth: 680,
    height: 760,
    minHeight: 760,
    maxHeight: 760,
    maximizable: false,
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
  .withToolTip(app.name)
  .withMenu([
    {
      label: 'exit',
      click(): void {
        RCloneClient.MUTEX.acquire().then((release) => {
          app.quit();
          release();
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
          return g.category == type && g.wasRunning;
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
        LoggerMain.info('Selected executable ' + exe);
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
        LoggerMain.info('Selected local dir ' + localDir);
      }
      return localDir ? localDir[0] : '';
    }
  },
  'list-local': {
    sync: true,
    fn(_, localDir: string): Array<string> {
      return FileHelper.list(localDir).filter((f) => {
        return !FileHelper.isDirectory(path.join(localDir, f));
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
      LoggerMain.info("Looking for game '" + name + "' for deletion");
      const cfg: Configuration = ConfigurationHelper.configAsInterface<Configuration>();
      for (const i in cfg.games) {
        if (cfg.games[i].name == name) {
          for (const j in SaveDataSynchronizer.CONFIG.games) {
            if (SaveDataSynchronizer.CONFIG.games[j].name == cfg.games[i].name) {
              if (SaveDataSynchronizer.CONFIG.games[i].icon) {
                try {
                  FileHelper.delete(SaveDataSynchronizer.CONFIG.games[i].icon as string);
                } catch (e) {
                  LoggerMain.error(
                    "Error deleting icon '" + SaveDataSynchronizer.CONFIG.games[i].icon + "'"
                  );
                }
              }
            }
          }
          cfg.games.splice(Number(i), 1);
          LoggerMain.info('Reloading application configuration');
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

      LoggerMain.info('Saving to file:\n' + JSON.stringify(game, null, 2));
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
  }
};

export const protocolBindings: Record<string, ProtocolBinding> = {
  ...defaultProtocolBindings
};

export const deepLinkBindings: Record<string, DeepLinkBinding> = {};
