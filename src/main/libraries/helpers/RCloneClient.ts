import { FileHelper, LoggerMain } from '@tser-framework/main';
import { Mutex } from 'async-mutex';
import { spawn } from 'child_process';

import { RCloneException } from '../exceptions/RCloneException';
import { Constants } from './Constants';

export class RCloneClient {
  private static MUTEX: Mutex = new Mutex();

  public static RCLONE_BACKEND: string = 'backend';

  private static COMMON_SYNC_COMMAND: Array<string> = [];
  private static LOCAL_SYNC_COMMAND: Array<string> = [];
  private static LOCAL_RESYNC_COMMAND: Array<string> = [];
  private static REMOTE_SYNC_COMMAND: Array<string> = [];
  private static REMOTE_RESYNC_COMMAND: Array<string> = [];
  private static ADDITIONAL_OPTIONS: Array<string> = [];

  public static initialize(): void {
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
    RCloneClient.REMOTE_SYNC_COMMAND.push(RCloneClient.RCLONE_BACKEND + ':decky-cloud-save');
    RCloneClient.REMOTE_SYNC_COMMAND.push(Constants.REMOTE_FOLDER);
    RCloneClient.REMOTE_SYNC_COMMAND.push(...RCloneClient.COMMON_SYNC_COMMAND);

    RCloneClient.REMOTE_RESYNC_COMMAND.push(...RCloneClient.REMOTE_SYNC_COMMAND);
    RCloneClient.REMOTE_RESYNC_COMMAND.push('--resync');

    RCloneClient.LOCAL_SYNC_COMMAND.push('bisync');
    RCloneClient.LOCAL_SYNC_COMMAND.push(Constants.REMOTE_FOLDER);
    RCloneClient.LOCAL_SYNC_COMMAND.push(RCloneClient.RCLONE_BACKEND + ':decky-cloud-save');
    RCloneClient.LOCAL_SYNC_COMMAND.push(...RCloneClient.COMMON_SYNC_COMMAND);

    RCloneClient.LOCAL_RESYNC_COMMAND.push(...RCloneClient.LOCAL_SYNC_COMMAND);
    RCloneClient.LOCAL_RESYNC_COMMAND.push('--resync');

    RCloneClient.ADDITIONAL_OPTIONS.push('--config');
    RCloneClient.ADDITIONAL_OPTIONS.push(Constants.RCLONE_CFG);
    RCloneClient.ADDITIONAL_OPTIONS.push('--log-format');
    RCloneClient.ADDITIONAL_OPTIONS.push('other');
    RCloneClient.ADDITIONAL_OPTIONS.push('--log-file');
    RCloneClient.ADDITIONAL_OPTIONS.push(LoggerMain.LOG_FILE);
    RCloneClient.ADDITIONAL_OPTIONS.push('-v');
  }

  public static localSync(): Promise<void> {
    return new Promise<void>((resolve) => {
      RCloneClient.MUTEX.acquire().then(async (release) => {
        LoggerMain.info('Syncing with server');
        RCloneClient.runRclone(RCloneClient.LOCAL_SYNC_COMMAND)
          .then((retCode) => {
            if (retCode > 0) {
              RCloneClient.runRclone(RCloneClient.LOCAL_RESYNC_COMMAND)
                .then((retCode) => {
                  if (retCode > 0) {
                    release();
                    resolve();
                    throw new RCloneException('Error on sync');
                  }
                  release();
                  resolve();
                })
                .catch((e) => {
                  LoggerMain.error('Error on sync', e);
                  release();
                  resolve();
                });
            } else {
              release();
              resolve();
            }
          })
          .catch((e) => {
            LoggerMain.error('Error on sync', e);
            release();
            resolve();
          });
      });
    });
  }

  public static remoteSync(): Promise<void> {
    return new Promise<void>((resolve) => {
      RCloneClient.MUTEX.acquire().then(async (release) => {
        LoggerMain.info('Syncing with server');
        RCloneClient.runRclone(RCloneClient.REMOTE_SYNC_COMMAND)
          .then((retCode) => {
            if (retCode > 0) {
              RCloneClient.runRclone(RCloneClient.REMOTE_RESYNC_COMMAND)
                .then((retCode) => {
                  if (retCode > 0) {
                    release();
                    resolve();
                    throw new RCloneException('Error on sync');
                  }
                  release();
                  resolve();
                })
                .catch((e) => {
                  LoggerMain.error('Error on sync', e);
                  release();
                  resolve();
                });
            } else {
              release();
              resolve();
            }
          })
          .catch((e) => {
            LoggerMain.error('Error on sync', e);
            release();
            resolve();
          });
      });
    });
  }

  public static async remoteResync(): Promise<void> {
    return new Promise<void>((resolve) => {
      RCloneClient.MUTEX.acquire().then(async (release) => {
        LoggerMain.info('Resyncing with server');
        RCloneClient.runRclone(RCloneClient.REMOTE_RESYNC_COMMAND)
          .then((retCode) => {
            if (retCode > 0) {
              throw new RCloneException('Error on resync');
            }
            release();
            resolve();
          })
          .catch((e) => {
            LoggerMain.error('Error on resync', e);
            release();
            resolve();
          });
      });
    });
  }

  private static runRclone(command: Array<string>): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      try {
        const fullCommand: Array<string> = [];
        fullCommand.push(Constants.RCLONE_EXE);
        fullCommand.push(...command);
        fullCommand.push(...RCloneClient.ADDITIONAL_OPTIONS);

        setTimeout(() => {
          try {
            FileHelper.append(LoggerMain.LOG_FILE, '\n' + fullCommand.join(' ') + '\n\n');
            const bin = fullCommand[0];
            fullCommand.shift();
            const params: Array<string> = fullCommand;

            const subProcess = spawn(bin, params);
            subProcess.stderr.on('data', (data) => {
              reject(data);
            });
            subProcess.on('close', (code) => {
              setTimeout(() => {
                LoggerMain.info('Execution finished with status code', code);
                resolve(code as number);
              }, 100);
            });
          } catch (e) {
            reject(new RCloneException(String(e)));
          }
        }, 100);
      } catch (e) {
        reject(new RCloneException(String(e)));
      }
    });
  }
}
