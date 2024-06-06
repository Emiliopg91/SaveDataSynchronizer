import { FileHelper, LoggerMain } from '@tser-framework/main';
import { Mutex } from 'async-mutex';
import { spawn } from 'child_process';
import path from 'path';

import { mainWindow } from '../..';
import { RCloneException } from '../exceptions/RCloneException';
import { SaveDataSynchronizer } from '../logic/SaveDataSynchronizer';
import { Constants } from './Constants';
import { NotificationUtils } from './NotificationUtils';

export class RCloneClient {
  public static MUTEX: Mutex = new Mutex();

  public static RCLONE_BACKEND: string = 'backend';

  private static COMMON_PROV_COMMAND_P1: Array<string> = [];
  private static COMMON_PROV_COMMAND_P2: Array<string> = [];
  private static COMMON_SYNC_COMMAND: Array<string> = [];
  private static LOCAL_SYNC_COMMAND: Array<string> = [];
  private static LOCAL_RESYNC_COMMAND: Array<string> = [];
  private static REMOTE_SYNC_COMMAND: Array<string> = [];
  private static REMOTE_RESYNC_COMMAND: Array<string> = [];
  private static ADDITIONAL_OPTIONS: Array<string> = [];

  public static initialize(): void {
    RCloneClient.COMMON_PROV_COMMAND_P1.push('--config');
    RCloneClient.COMMON_PROV_COMMAND_P1.push(Constants.RCLONE_CFG);
    RCloneClient.COMMON_PROV_COMMAND_P1.push('config');
    RCloneClient.COMMON_PROV_COMMAND_P1.push('create');
    RCloneClient.COMMON_PROV_COMMAND_P1.push(RCloneClient.RCLONE_BACKEND);
    RCloneClient.COMMON_PROV_COMMAND_P2.push('--log-format');
    RCloneClient.COMMON_PROV_COMMAND_P2.push('other');
    RCloneClient.COMMON_PROV_COMMAND_P2.push('--log-file');
    RCloneClient.COMMON_PROV_COMMAND_P2.push(LoggerMain.LOG_FILE);
    RCloneClient.COMMON_PROV_COMMAND_P2.push('-v');

    RCloneClient.ADDITIONAL_OPTIONS.push('--config');
    RCloneClient.ADDITIONAL_OPTIONS.push(Constants.RCLONE_CFG);
    RCloneClient.ADDITIONAL_OPTIONS.push('--log-format');
    RCloneClient.ADDITIONAL_OPTIONS.push('other');
    RCloneClient.ADDITIONAL_OPTIONS.push('--log-file');
    RCloneClient.ADDITIONAL_OPTIONS.push(LoggerMain.LOG_FILE);
    RCloneClient.ADDITIONAL_OPTIONS.push('-v');

    RCloneClient.COMMON_SYNC_COMMAND.push('--ignore-size');
    RCloneClient.COMMON_SYNC_COMMAND.push('--conflict-resolve');
    RCloneClient.COMMON_SYNC_COMMAND.push('path1');
    RCloneClient.COMMON_SYNC_COMMAND.push('--conflict-loser');
    RCloneClient.COMMON_SYNC_COMMAND.push('delete');
    RCloneClient.COMMON_SYNC_COMMAND.push('--transfers');
    RCloneClient.COMMON_SYNC_COMMAND.push('8');
    RCloneClient.COMMON_SYNC_COMMAND.push('--checkers');
    RCloneClient.COMMON_SYNC_COMMAND.push('16');

    RCloneClient.REMOTE_SYNC_COMMAND.push('bisync');
    RCloneClient.REMOTE_SYNC_COMMAND.push(
      RCloneClient.RCLONE_BACKEND + ':' + SaveDataSynchronizer.CONFIG.remote
    );
    RCloneClient.REMOTE_SYNC_COMMAND.push(Constants.REMOTE_FOLDER);
    RCloneClient.REMOTE_SYNC_COMMAND.push(...RCloneClient.COMMON_SYNC_COMMAND);
    RCloneClient.REMOTE_SYNC_COMMAND.push(...RCloneClient.ADDITIONAL_OPTIONS);

    RCloneClient.REMOTE_RESYNC_COMMAND.push(...RCloneClient.REMOTE_SYNC_COMMAND);
    RCloneClient.REMOTE_RESYNC_COMMAND.push('--resync');

    RCloneClient.LOCAL_SYNC_COMMAND.push('bisync');
    RCloneClient.LOCAL_SYNC_COMMAND.push(Constants.REMOTE_FOLDER);
    RCloneClient.LOCAL_SYNC_COMMAND.push(
      RCloneClient.RCLONE_BACKEND + ':' + SaveDataSynchronizer.CONFIG.remote
    );
    RCloneClient.LOCAL_SYNC_COMMAND.push(...RCloneClient.COMMON_SYNC_COMMAND);
    RCloneClient.LOCAL_SYNC_COMMAND.push(...RCloneClient.ADDITIONAL_OPTIONS);

    RCloneClient.LOCAL_RESYNC_COMMAND.push(...RCloneClient.LOCAL_SYNC_COMMAND);
    RCloneClient.LOCAL_RESYNC_COMMAND.push('--resync');
  }

  public static setupProvider(provider: string): Promise<void> {
    return new Promise<void>((resolve) => {
      RCloneClient.MUTEX.acquire().then(async (release) => {
        LoggerMain.info('Setting up "' + provider + '" as cloud provider');
        const params = [
          ...RCloneClient.COMMON_PROV_COMMAND_P1,
          provider,
          ...RCloneClient.COMMON_PROV_COMMAND_P2
        ];
        RCloneClient.runRclone(params)
          .then((retCode) => {
            if (retCode > 0) {
              throw new RCloneException('Error on setup');
            }
            LoggerMain.info('Setup up successful');
            release();
            resolve();
          })
          .catch((e) => {
            LoggerMain.error('Error on setup', e);
            release();
            resolve();
          });
      });
    });
  }

  public static localSync(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      RCloneClient.MUTEX.acquire().then(async (release) => {
        LoggerMain.info('Syncing with server');
        RCloneClient.runRclone(RCloneClient.LOCAL_SYNC_COMMAND)
          .then((retCode) => {
            if (retCode > 0) {
              RCloneClient.runRclone(RCloneClient.LOCAL_RESYNC_COMMAND)
                .then((retCode) => {
                  if (retCode > 0) {
                    release();
                    reject();
                    NotificationUtils.displaySyncError();
                    throw new RCloneException('Error on sync');
                  }
                  release();
                  resolve();
                })
                .catch((e) => {
                  NotificationUtils.displaySyncError();
                  LoggerMain.error('Error on sync', e);
                  release();
                  reject(e);
                });
            } else {
              release();
              resolve();
            }
          })
          .catch((e) => {
            NotificationUtils.displaySyncError();
            LoggerMain.error('Error on sync', e);
            release();
            resolve();
          });
      });
    });
  }

  public static remoteSync(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      RCloneClient.MUTEX.acquire().then(async (release) => {
        LoggerMain.info('Syncing with server');
        RCloneClient.runRclone(RCloneClient.REMOTE_SYNC_COMMAND)
          .then((retCode) => {
            if (retCode > 0) {
              RCloneClient.runRclone(RCloneClient.REMOTE_RESYNC_COMMAND)
                .then((retCode) => {
                  if (retCode > 0) {
                    release();
                    reject();
                    NotificationUtils.displaySyncError();
                    throw new RCloneException('Error on sync');
                  }
                  release();
                  resolve();
                })
                .catch((e) => {
                  NotificationUtils.displaySyncError();
                  LoggerMain.error('Error on sync', e);
                  release();
                  reject(e);
                });
            } else {
              release();
              resolve();
            }
          })
          .catch((e) => {
            NotificationUtils.displaySyncError();
            LoggerMain.error('Error on sync', e);
            release();
            reject(e);
          });
      });
    });
  }

  public static async remoteResync(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      RCloneClient.MUTEX.acquire().then(async (release) => {
        LoggerMain.info('Resyncing with server');
        RCloneClient.runRclone(RCloneClient.REMOTE_RESYNC_COMMAND)
          .then((retCode) => {
            if (retCode > 0) {
              NotificationUtils.displaySyncError();
              reject();
              throw new RCloneException('Error on resync');
            }
            release();
            resolve();
          })
          .catch((e) => {
            NotificationUtils.displaySyncError();
            LoggerMain.error('Error on resync', e);
            release();
            reject(e);
          });
      });
    });
  }

  private static runRclone(command: Array<string>): Promise<number> {
    RCloneClient.clearLockFiles();
    return new Promise<number>((resolve, reject) => {
      try {
        mainWindow?.webContents.send('sync-in-progress', true);
        const fullCommand: Array<string> = [];
        fullCommand.push(Constants.RCLONE_EXE);
        fullCommand.push(...command);

        setTimeout(() => {
          try {
            FileHelper.append(LoggerMain.LOG_FILE, '\n' + fullCommand.join(' ') + '\n\n');
            const bin = fullCommand[0];
            fullCommand.shift();
            const params: Array<string> = fullCommand;

            const subProcess = spawn(bin, params);
            subProcess.stderr.on('data', (data) => {
              mainWindow?.webContents.send('sync-in-progress', false);
              reject(data);
            });
            subProcess.on('close', (code) => {
              setTimeout(() => {
                mainWindow?.webContents.send('sync-in-progress', false);
                resolve(code as number);
              }, 100);
            });
          } catch (e) {
            mainWindow?.webContents.send('sync-in-progress', false);
            reject(new RCloneException(String(e)));
          }
        }, 100);
      } catch (e) {
        mainWindow?.webContents.send('sync-in-progress', false);
        reject(new RCloneException(String(e)));
      }
    });
  }
  public static clearLockFiles(): void {
    let count = 0;
    FileHelper.list(Constants.RCLONE_BYSINC_FOLDER).forEach((f) => {
      if (f.endsWith('.lck')) {
        FileHelper.delete(path.join(Constants.RCLONE_BYSINC_FOLDER, f));
        count++;
      }
    });
    if (count > 0) {
      LoggerMain.info('Removed ' + count + ' lock files');
    }
  }
}
