import { ConfigurationHelper, FileHelper, LoggerMain, Powershell } from '@tser-framework/main';
import path from 'path';

import { Configuration } from '../dtos/Configuration';
import { Constants } from '../helpers/Constants';
import { Event, GameHelper } from '../helpers/GameHelper';
import { NotificationUtils } from '../helpers/NotificationUtils';
import { RCloneClient } from '../helpers/RCloneClient';

export class SaveDataSynchronizer {
  public static CONFIG: Configuration = { checkInterval: 1000, games: [] };
  public static READY = false;

  public static main(): void {
    (async (): Promise<void> => {
      RCloneClient.initialize();
      const isFirstSync: boolean = await SaveDataSynchronizer.initializeRemote();
      await SaveDataSynchronizer.loadConfigFile();

      if (!isFirstSync) {
        LoggerMain.info('');
        await RCloneClient.remoteSync();
        LoggerMain.info('');
      }

      let count = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let error: any | undefined = undefined;
      SaveDataSynchronizer.CONFIG.games.forEach((g) => {
        try {
          count += GameHelper.synchronize(g);
        } catch (e) {
          LoggerMain.error("Error syncing '" + g.name + "'", e);
          error = e;
        }
      });

      if (!error) {
        if (count > 0) {
          LoggerMain.info('');
          await RCloneClient.localSync();
        }

        let command = 'Get-Process -ErrorAction SilentlyContinue -Name ';
        SaveDataSynchronizer.CONFIG.games.forEach((g) => {
          command += g.psProcess + ',';
        });
        if (command.endsWith(',')) {
          command = command.substring(0, command.length - 1);
        }
        command += ' | Select-Object ProcessName';

        setInterval(() => {
          Powershell.runCommand(command).then((res: string) => {
            let ab = false;
            const processes: Array<string> = [];
            res.split('\r').forEach((line: string) => {
              if (line.includes('---')) {
                ab = true;
              } else if (ab) {
                processes.push(line.trim());
              }
            });
            SaveDataSynchronizer.CONFIG.games.forEach(async (g) => {
              const event: Event = GameHelper.getEvent(
                g,
                processes.includes(g.psProcess as string)
              );
              let cnt = 0;
              switch (event) {
                case Event.STARTED:
                  LoggerMain.info("STARTED '" + g.name + "'");
                  /*GameHelper.suspend(g);*/
                  NotificationUtils.displayDownloadingData(g.icon);
                  await RCloneClient.remoteSync();
                  /*GameHelper.download(g);
                  GameHelper.resume(g);
                  GameHelper.touchSdsFile(g);*/
                  LoggerMain.info('');
                  break;
                case Event.STOPPED:
                  LoggerMain.info("STOPPED '" + g.name + "'");
                  NotificationUtils.displayUploadingData(g.icon);
                  /*cnt = GameHelper.update(g);
                  GameHelper.deleteSdsFile(g);*/
                  LoggerMain.info('');
                  if (cnt > 0) {
                    await RCloneClient.localSync();
                  }
                  NotificationUtils.displayUploadFinished(g.icon);
                  LoggerMain.info('');
                  break;
              }
            });
          });
        }, SaveDataSynchronizer.CONFIG.checkInterval);

        NotificationUtils.displayReadyToPlay();
        LoggerMain.info('');
        LoggerMain.info('Ready!');
        LoggerMain.info('');
        SaveDataSynchronizer.READY = true;
      } else {
        NotificationUtils.displayReadinessError();
      }
    })();
  }

  private static async initializeRemote(): Promise<boolean> {
    if (!FileHelper.exists(Constants.REMOTE_FOLDER)) {
      FileHelper.mkdir(Constants.REMOTE_FOLDER);
      await RCloneClient.remoteResync();
      LoggerMain.info('');
      return true;
    }
    return false;
  }

  private static async loadConfigFile(): Promise<void> {
    SaveDataSynchronizer.CONFIG = JSON.parse(
      JSON.stringify(ConfigurationHelper.configAsInterface<Configuration>())
    );
    if (!SaveDataSynchronizer.CONFIG.checkInterval) {
      SaveDataSynchronizer.CONFIG.checkInterval = 1000;
    }
    if (!SaveDataSynchronizer.CONFIG.games) {
      SaveDataSynchronizer.CONFIG.games = [];
    }
    LoggerMain.info('Validating configuration');
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
            FileHelper.setLastModified(game.remoteDir, FileHelper.getLastModified(game.localDir));
          }

          if (game.inclusions?.length == 0) {
            game.inclusions = undefined;
          }
          if (game.exclusions?.length == 0) {
            game.exclusions = undefined;
          }

          game.process = game.executable.substring(game.executable.lastIndexOf(path.sep) + 1);
          game.psProcess = game.process.substring(0, game.process.lastIndexOf('.'));

          await GameHelper.generateIcon(game);
        } else {
          allOk = false;
        }
      } catch (e) {
        LoggerMain.error('Error on validations', e);
        allOk = false;
      }
    }

    if (allOk) {
      LoggerMain.addTab();
      LoggerMain.info('Configured games: ', SaveDataSynchronizer.CONFIG.games.length);
      LoggerMain.info('Check interval: ', SaveDataSynchronizer.CONFIG.checkInterval);
      LoggerMain.removeTab();
      LoggerMain.debug(JSON.stringify(SaveDataSynchronizer.CONFIG, null, 2));
    } else {
      SaveDataSynchronizer.CONFIG.games = [];
      LoggerMain.info('Invalid configuration');
    }
  }
}
