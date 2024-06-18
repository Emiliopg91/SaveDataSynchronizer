import {
  ConfigurationHelper,
  File,
  FileHelper,
  LoggerMain,
  Powershell,
  TranslatorMain
} from '@tser-framework/main';
import { Mutex } from 'async-mutex';
import { BrowserWindow, app, dialog } from 'electron/main';
import path from 'path';

import { createWindow, mainWindow, splashPromise } from '../..';
import { Configuration } from '../dtos/Configuration';
import { Constants } from '../helpers/Constants';
import { Event, GameHelper } from '../helpers/GameHelper';
import { NotificationUtils } from '../helpers/NotificationUtils';
import { RCloneClient } from '../helpers/RCloneClient';
import { Launchers } from './Launchers';

export class SaveDataSynchronizer {
  private static LOGGER = new LoggerMain('SaveDataSynchronizer');
  public static MUTEX: Mutex = new Mutex();
  public static CONFIG: Configuration = {
    checkInterval: 500,
    remote: app.getName().toLowerCase(),
    bigpicture: false,
    games: []
  };
  public static READY = false;

  public static main(): void {
    (async (): Promise<void> => {
      RCloneClient.initialize();
      await splashPromise;

      if (!new File({ file: Constants.RCLONE_CFG }).exists()) {
        FileHelper.write(Constants.RCLONE_CFG, '');
      }
      if (
        !FileHelper.read(Constants.RCLONE_CFG).includes('[' + RCloneClient.RCLONE_BACKEND + ']')
      ) {
        const buts = ['OneDrive', 'Google Drive', 'Drobpox'];
        const vals = ['onedrive', 'drive', 'drobpox'];
        let prov: string | undefined = undefined;
        while (!prov) {
          prov =
            vals[
              dialog.showMessageBoxSync(mainWindow as BrowserWindow, {
                message: TranslatorMain.translate('select.cloud.provider'),
                buttons: buts,
                cancelId: buts.length
              })
            ];
        }
        await RCloneClient.setupProvider(prov);
      }
      await SaveDataSynchronizer.loadConfigFile();
      await Launchers.generateIcons();

      if (SaveDataSynchronizer.CONFIG.bigpicture) {
        SaveDataSynchronizer.LOGGER.info('');
        Launchers.launchSteamBigPicture();
      }

      createWindow();
      mainWindow?.show();
      mainWindow?.focus();
      mainWindow?.on('ready-to-show', () => {
        setTimeout(async () => {
          const isFirstSync: boolean = await SaveDataSynchronizer.initializeRemote();
          if (!isFirstSync) {
            SaveDataSynchronizer.LOGGER.info('');
            await RCloneClient.remoteSync();
            SaveDataSynchronizer.LOGGER.info('');
          }

          let count = 0;
          SaveDataSynchronizer.CONFIG.games.forEach((g) => {
            try {
              count += GameHelper.synchronize(g);
            } catch (e) {
              SaveDataSynchronizer.LOGGER.error("Error syncing '" + g.name + "'", e);
            }
          });

          if (count > 0) {
            SaveDataSynchronizer.LOGGER.info('');
            await RCloneClient.localSync();
          }

          setInterval(() => {
            SaveDataSynchronizer.MUTEX.acquire().then((release) => {
              try {
                let command = 'Get-Process -ErrorAction SilentlyContinue -Name ';
                SaveDataSynchronizer.CONFIG.games.forEach((g) => {
                  command += g.psProcess + ',';
                });
                if (command.endsWith(',')) {
                  command = command.substring(0, command.length - 1);
                }
                command += ' | Select-Object ProcessName,Id';

                Powershell.runCommand(command).then((res: string) => {
                  let ab = false;
                  const processNames: Array<string> = [];
                  const processIds: Array<string> = [];
                  res.split('\r').forEach((line: string) => {
                    if (line.includes('---')) {
                      ab = true;
                    } else if (ab) {
                      if (line.trim().length > 0) {
                        processNames.push(line.substring(0, line.indexOf(' ')).trim());
                        processIds.push(line.substring(line.indexOf(' ')).trim());
                      }
                    }
                  });
                  SaveDataSynchronizer.CONFIG.games.forEach(async (g) => {
                    let pid: string | undefined = undefined;
                    if (processNames.indexOf(g.psProcess as string) > -1) {
                      pid = processIds[processNames.indexOf(g.psProcess as string)];
                    }

                    const event: Event = GameHelper.getEvent(g, pid);
                    let cnt = 0;
                    switch (event) {
                      case Event.STARTED:
                        SaveDataSynchronizer.LOGGER.info(
                          "STARTED '" + g.name + "' WITH PID " + pid
                        );
                        g.pid = pid;
                        await GameHelper.suspend(g);
                        NotificationUtils.displayDownloadingData(g.icon);
                        await RCloneClient.remoteSync();
                        GameHelper.download(g);
                        await GameHelper.resume(g);
                        GameHelper.touchSdsFile(g);
                        SaveDataSynchronizer.LOGGER.info('');
                        break;
                      case Event.STOPPED:
                        SaveDataSynchronizer.LOGGER.info("STOPPED '" + g.name + "'");
                        NotificationUtils.displayUploadingData(g.icon);
                        cnt = GameHelper.update(g);
                        GameHelper.deleteSdsFile(g);
                        SaveDataSynchronizer.LOGGER.info('');
                        if (cnt > 0) {
                          await RCloneClient.localSync();
                        }
                        NotificationUtils.displayUploadFinished(g.icon);
                        SaveDataSynchronizer.LOGGER.info('');
                        break;
                    }
                  });
                });
              } finally {
                release();
              }
            });
          }, SaveDataSynchronizer.CONFIG.checkInterval);

          NotificationUtils.displayReadyToPlay();
          SaveDataSynchronizer.LOGGER.info('');
          SaveDataSynchronizer.LOGGER.info('Ready!');
          SaveDataSynchronizer.LOGGER.info('');
          SaveDataSynchronizer.READY = true;
        }, 250);
      });
    })();
  }

  private static async initializeRemote(): Promise<boolean> {
    if (!new File({ file: Constants.REMOTE_FOLDER }).exists()) {
      new File({ file: Constants.REMOTE_FOLDER }).mkdir();
      await RCloneClient.remoteResync();
      SaveDataSynchronizer.LOGGER.info('');
      return true;
    }
    return false;
  }

  public static async loadConfigFile(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      SaveDataSynchronizer.MUTEX.acquire().then(async (release) => {
        try {
          const cfg: Configuration = ConfigurationHelper.configAsInterface<Configuration>();
          if (!cfg.checkInterval) {
            cfg.checkInterval = 1000;
          }
          if (!cfg.games) {
            cfg.games = [];
          }
          if (!cfg.remote) {
            cfg.remote = app.getName().toLowerCase();
          }
          SaveDataSynchronizer.CONFIG = JSON.parse(JSON.stringify(cfg));
          if (!SaveDataSynchronizer.CONFIG.checkInterval) {
            SaveDataSynchronizer.CONFIG.checkInterval = 1000;
          }
          if (!SaveDataSynchronizer.CONFIG.games) {
            SaveDataSynchronizer.CONFIG.games = [];
          }
          SaveDataSynchronizer.LOGGER.info('Validating configuration');
          let allOk = true;
          for (let i = 0; i < SaveDataSynchronizer.CONFIG.games.length; i++) {
            try {
              const game = SaveDataSynchronizer.CONFIG.games[i];
              if (new File({ file: game.executable }).exists()) {
                if (!new File({ file: game.localDir }).exists()) {
                  new File({ file: game.localDir }).mkdir();
                }
                game.remoteDir = Constants.REMOTE_FOLDER + game.remoteDir;
                if (!new File({ file: game.remoteDir }).exists()) {
                  new File({ file: game.remoteDir }).mkdir();
                  new File({ file: game.remoteDir }).setLastModified(
                    new File({ file: game.localDir }).getLastModified()
                  );
                }

                if (game.inclusions?.length == 0) {
                  game.inclusions = undefined;
                }
                if (game.exclusions?.length == 0) {
                  game.exclusions = undefined;
                }

                game.process = game.executable.substring(game.executable.lastIndexOf(path.sep) + 1);
                game.psProcess = game.process.substring(0, game.process.lastIndexOf('.'));

                game.icon = path.join(Constants.ICONS_FOLDER, (game.psProcess as string) + '.ico');
                if (!new File({ file: game.icon }).exists()) {
                  await GameHelper.generateIcon(game);
                }
              } else {
                allOk = false;
              }
            } catch (e) {
              SaveDataSynchronizer.LOGGER.error('Error on validations', e);
              allOk = false;
            }
          }

          if (allOk) {
            LoggerMain.addTab();
            SaveDataSynchronizer.LOGGER.info(
              'Configured games: ',
              SaveDataSynchronizer.CONFIG.games.length
            );
            SaveDataSynchronizer.LOGGER.info(
              'Check interval: ',
              SaveDataSynchronizer.CONFIG.checkInterval
            );
            LoggerMain.removeTab();
            SaveDataSynchronizer.LOGGER.debug(JSON.stringify(SaveDataSynchronizer.CONFIG, null, 2));
          } else {
            SaveDataSynchronizer.CONFIG.games = [];
            SaveDataSynchronizer.LOGGER.info('Invalid configuration');
          }
          resolve();
        } catch (e) {
          reject(e);
        } finally {
          release();
        }
      });
    });
  }
}
