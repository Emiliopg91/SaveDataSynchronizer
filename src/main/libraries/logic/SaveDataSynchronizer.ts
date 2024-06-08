import { ConfigurationHelper, FileHelper, Powershell, TranslatorMain } from '@tser-framework/main';
import { Mutex } from 'async-mutex';
import { BrowserWindow, app, dialog } from 'electron';
import path from 'path';

import { createWindow, mainWindow, splashPromise } from '../..';
import { Configuration } from '../dtos/Configuration';
import { Constants } from '../helpers/Constants';
import { Event, GameHelper } from '../helpers/GameHelper';
import { NotificationUtils } from '../helpers/NotificationUtils';
import { RCloneClient } from '../helpers/RCloneClient';

export class SaveDataSynchronizer {
  public static MUTEX: Mutex = new Mutex();
  public static CONFIG: Configuration = {
    checkInterval: 500,
    remote: app.getName().toLowerCase(),
    games: []
  };
  public static READY = false;

  public static main(): void {
    (async (): Promise<void> => {
      RCloneClient.initialize();
      await splashPromise;

      if (!FileHelper.exists(Constants.RCLONE_CFG)) {
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

      createWindow();
      mainWindow?.show();
      mainWindow?.focus();
      mainWindow?.on('ready-to-show', () => {
        setTimeout(async () => {
          const isFirstSync: boolean = await SaveDataSynchronizer.initializeRemote();
          if (!isFirstSync) {
            console.info('');
            await RCloneClient.remoteSync();
            console.info('');
          }

          let count = 0;
          SaveDataSynchronizer.CONFIG.games.forEach((g) => {
            try {
              count += GameHelper.synchronize(g);
            } catch (e) {
              console.error("Error syncing '" + g.name + "'", e);
            }
          });

          if (count > 0) {
            console.info('');
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
                        console.info("STARTED '" + g.name + "' WITH PID " + pid);
                        g.pid = pid;
                        await GameHelper.suspend(g);
                        NotificationUtils.displayDownloadingData(g.icon);
                        await RCloneClient.remoteSync();
                        GameHelper.download(g);
                        await GameHelper.resume(g);
                        GameHelper.touchSdsFile(g);
                        console.info('');
                        break;
                      case Event.STOPPED:
                        console.info("STOPPED '" + g.name + "'");
                        NotificationUtils.displayUploadingData(g.icon);
                        cnt = GameHelper.update(g);
                        GameHelper.deleteSdsFile(g);
                        console.info('');
                        if (cnt > 0) {
                          await RCloneClient.localSync();
                        }
                        NotificationUtils.displayUploadFinished(g.icon);
                        console.info('');
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
          console.info('');
          console.info('Ready!');
          console.info('');
          SaveDataSynchronizer.READY = true;
        }, 250);
      });
    })();
  }

  private static async initializeRemote(): Promise<boolean> {
    if (!FileHelper.exists(Constants.REMOTE_FOLDER)) {
      FileHelper.mkdir(Constants.REMOTE_FOLDER);
      await RCloneClient.remoteResync();
      console.info('');
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
          console.info('Validating configuration');
          let allOk = true;
          for (let i = 0; i < SaveDataSynchronizer.CONFIG.games.length; i++) {
            try {
              const game = SaveDataSynchronizer.CONFIG.games[i];
              if (FileHelper.exists(game.executable)) {
                if (!FileHelper.exists(game.localDir)) {
                  FileHelper.mkdir(game.localDir);
                }
                game.remoteDir = Constants.REMOTE_FOLDER + game.remoteDir;
                if (!FileHelper.exists(game.remoteDir)) {
                  FileHelper.mkdir(game.remoteDir);
                  FileHelper.setLastModified(
                    game.remoteDir,
                    FileHelper.getLastModified(game.localDir)
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
                if (!FileHelper.exists(game.icon)) {
                  await GameHelper.generateIcon(game);
                }
              } else {
                allOk = false;
              }
            } catch (e) {
              console.error('Error on validations', e);
              allOk = false;
            }
          }

          if (allOk) {
            console.addTab();
            console.info('Configured games: ', SaveDataSynchronizer.CONFIG.games.length);
            console.info('Check interval: ', SaveDataSynchronizer.CONFIG.checkInterval);
            console.removeTab();
            console.debug(JSON.stringify(SaveDataSynchronizer.CONFIG, null, 2));
          } else {
            SaveDataSynchronizer.CONFIG.games = [];
            console.info('Invalid configuration');
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
