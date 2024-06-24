import { electronApp, is } from '@electron-toolkit/utils';
import { JsonUtils } from '@tser-framework/commons';
import { AppUpdater, LoggerMain, TranslatorMain, WindowHelper } from '@tser-framework/main';
import {
  BrowserWindow,
  IpcMainInvokeEvent,
  Menu,
  app,
  dialog,
  ipcMain,
  protocol
} from 'electron/main';
import path from 'path';

import { runBeforeReady, runWhenReady } from './applicationLogic';
import { NotificationUtils } from './libraries/helpers/NotificationUtils';
import { RCloneClient } from './libraries/helpers/RCloneClient';
import {
  appConfig,
  deepLinkBindings,
  ipcListeners,
  menuTemplate,
  protocolBindings,
  trayBuilder,
  windowConfig
} from './setup';

export let mainWindow: BrowserWindow | null = null;
export let splashPromise: Promise<void> | undefined;
export let appUpdater: AppUpdater | undefined = undefined;

const LOGGER = new LoggerMain('main/index.ts');
const initTime = Date.now();
let shownUpdate = false;

(async (): Promise<void> => {
  await LoggerMain.initialize();

  LOGGER.system('##################################################');
  LOGGER.system('#                  Started main                  #');
  LOGGER.system('##################################################');
  LOGGER.system('Running runBeforeReady');
  LoggerMain.addTab();
  await runBeforeReady();
  LoggerMain.removeTab();
  LOGGER.system('Ended runBeforeReady');
  if (!app.requestSingleInstanceLock() && appConfig.singleInstance) {
    LOGGER.error('Application already running');
    app.quit();
  } else {
    if (ipcListeners && Object.keys(ipcListeners).length > 0) {
      LOGGER.system('Services registration');
      LoggerMain.addTab();
      Object.keys(ipcListeners)
        .sort((a, b) => {
          return a.localeCompare(b);
        })
        .forEach((id) => {
          const listener = ipcListeners[id];
          if (ipcListeners[id].sync) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ipcMain.handle(id, (event: IpcMainInvokeEvent, ...args: any): unknown => {
              return listener.fn(event, ...args);
            });
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ipcMain.on(id, (event: IpcMainInvokeEvent, ...args: any): void => {
              listener.fn(event, ...args);
            });
          }
          LOGGER.system(id);
        });
      LoggerMain.removeTab();
    }

    Object.keys(protocolBindings).forEach((id) => {
      protocol.registerSchemesAsPrivileged([
        { scheme: id, privileges: protocolBindings[id].privileges }
      ]);
    });

    app.whenReady().then(async () => {
      electronApp.setAppUserModelId(app.getName());

      if (protocolBindings && Object.keys(protocolBindings).length > 0) {
        LOGGER.system('HTTP protocol registration');
        LoggerMain.addTab();
        Object.keys(protocolBindings).forEach((id) => {
          protocol.handle(id, protocolBindings[id].handler);
          LOGGER.system(id);
        });
        LoggerMain.removeTab();
      }

      if (deepLinkBindings && Object.keys(deepLinkBindings).length > 0) {
        LOGGER.system('Deep link registration');
        LoggerMain.addTab();
        Object.keys(deepLinkBindings).forEach((id) => {
          if (process.defaultApp) {
            if (process.argv.length >= 2) {
              app.setAsDefaultProtocolClient(id, process.execPath, [path.resolve(process.argv[1])]);
            }
          } else {
            app.setAsDefaultProtocolClient(id);
          }
          LOGGER.system(id);
          LoggerMain.removeTab();
        });
      }
      LoggerMain.removeTab();
      LOGGER.system('Registration finished');

      let menu: Menu | null = null;
      if (menuTemplate) {
        const template = JsonUtils.modifyObject(menuTemplate, ['label'], (_, value: unknown) => {
          return TranslatorMain.translate(value as string);
        });
        menu = Menu.buildFromTemplate(template);
      }
      Menu.setApplicationMenu(menu);

      if (trayBuilder) {
        const tray = trayBuilder.build();
        if (windowConfig.closeToTray || windowConfig.minimizeToTray) {
          tray.on('double-click', async () => {
            if (mainWindow == null) {
              (await createWindow()).show();
            } else {
              if (!mainWindow.isDestroyed()) mainWindow.show();
            }
          });
        }
      }

      app.on('browser-window-created', (_, window) => {
        configureShortcutEvents(window);
      });

      if (appConfig.splashScreen) {
        splashPromise = WindowHelper.createSplashScreen(
          {
            width: 500,
            height: 300,
            transparent: true,
            frame: false,
            alwaysOnTop: true
          },
          appConfig.splashScreen
        );
      } else {
        createWindow();
      }

      app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });

      app.on('quit', function () {
        const msg = ' Stopped main after ' + msToTime(Date.now() - initTime) + ' ';
        LoggerMain.removeTab();
        LOGGER.system('##################################################');
        LOGGER.system(
          '#' +
            ''.padEnd((48 - msg.length) / 2, ' ') +
            msg +
            ''.padEnd((48 - msg.length) / 2, ' ') +
            '#'
        );
        LOGGER.system('##################################################');
      });

      app.on('window-all-closed', () => {
        if (windowConfig.closeToTray) {
          mainWindow = null;
        } else {
          app.quit();
        }
      });

      app.on('second-instance', (_, commandLine: Array<string>) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.focus();
        } else {
          createWindow();
        }

        if (deepLinkBindings) {
          const uri = commandLine.pop();
          Object.keys(deepLinkBindings).forEach((id) => {
            if (uri?.startsWith(id + '://')) {
              deepLinkBindings[id].handler(uri);
            }
          });
        }
      });

      appUpdater = new AppUpdater(24 * 60 * 60 * 1000, (): void => {
        if (!shownUpdate) {
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
                  appUpdater?.quitAndInstall(true, true);
                  release();
                });
              } else {
                if (!shownUpdate) {
                  setInterval(() => {
                    try {
                      mainWindow?.webContents?.send('listen-update', true);
                    } catch (e) {
                      //do nothing
                    }
                  }, 1000);
                }
              }
              shownUpdate = true;
            });
        }
      });

      LOGGER.system('Running runWhenReady');
      LoggerMain.addTab();
      runWhenReady();
    });
  }
})();

function configureShortcutEvents(window: Electron.BrowserWindow): void {
  const { webContents } = window;
  webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (!is.dev) {
        if (input.code === 'KeyR' && (input.control || input.meta)) {
          event.preventDefault();
        }
      } else {
        if (input.code === 'F12') {
          if (webContents.isDevToolsOpened()) {
            webContents.closeDevTools();
          } else {
            webContents.openDevTools();
          }
        }
      }
      if (windowConfig.escCloseWindow) {
        if (input.code === 'Escape' && input.key !== 'Process') {
          window.close();
          event.preventDefault();
        }
      }
      if (!windowConfig.zoom) {
        if (input.code === 'Minus' && (input.control || input.meta)) {
          event.preventDefault();
        }
        if (input.code === 'Equal' && input.shift && (input.control || input.meta)) {
          event.preventDefault();
        }
      }
    }
  });
}

export async function createWindow(): Promise<BrowserWindow> {
  mainWindow = WindowHelper.createMainWindow(windowConfig);
  return mainWindow;
}

function msToTime(duration): string {
  const milliseconds = String(Math.floor((duration % 1000) / 100)).padStart(3, '0');
  const seconds = String(Math.floor((duration / 1000) % 60)).padStart(2, '0');
  const minutes = String(Math.floor((duration / (1000 * 60)) % 60)).padStart(2, '0');
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
}
