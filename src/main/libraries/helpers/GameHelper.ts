import { FileHelper, Powershell } from '@tser-framework/main';
import { spawn } from 'child_process';
import path from 'path';

import { mainWindow } from '../..';
import { Game } from '../dtos/Game';
import { SaveDataSynchronizer } from '../logic/SaveDataSynchronizer';
import { Constants } from './Constants';
import { FileUtils } from './FileUtils';

export class GameHelper {
  public static kill(appName: string): void {
    SaveDataSynchronizer.CONFIG.games.forEach((g) => {
      if (g.name == appName && g.pid) {
        Powershell.runCommand('taskkill /F /PID ' + g.pid);
      }
    });
  }
  public static deleteSdsFile(g: Game): void {
    const sds = path.join(g.localDir, Constants.SDS_FILE_NAME);
    if (FileHelper.exists(sds)) {
      FileHelper.delete(sds);
    }
  }
  public static touchSdsFile(g: Game): void {
    const sds = path.join(g.localDir, Constants.SDS_FILE_NAME);
    if (FileHelper.exists(sds)) {
      FileHelper.delete(sds);
    }
    FileHelper.write(sds, '');
  }
  public static resume(g: Game): Promise<number> {
    return GameHelper.runPssuspend('-r', g.psProcess as string);
  }

  public static suspend(g: Game): Promise<number> {
    return GameHelper.runPssuspend(g.psProcess as string);
  }

  public static async generateIcon(game: Game): Promise<void> {
    await Powershell.runCommand(
      "[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null"
    );
    await Powershell.runCommand(
      "[System.Drawing.Icon]::ExtractAssociatedIcon('" +
        game.executable +
        "').ToBitmap().Save('" +
        game.icon +
        "')"
    );
  }

  private static runPssuspend(...args: Array<string>): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const subProcess = spawn(Constants.PSSUSPEND_EXE, args);
      subProcess.stderr.on('data', (data) => {
        reject(data);
      });
      subProcess.on('close', (code) => {
        resolve(code as number);
      });
    });
  }

  public static synchronize(game: Game): number {
    let sync: boolean | undefined = game.inclusions && game.inclusions.length > 0;
    if (!sync) {
      sync = FileUtils.isPendingSync(
        game.localDir,
        game.remoteDir,
        game.localDir,
        game.remoteDir,
        game.exclusions
      );
    }
    if (sync) {
      if (
        FileUtils.getLastModifiedTime(game.localDir, game.inclusions, game.exclusions) <
        FileUtils.getLastModifiedTime(game.remoteDir, game.inclusions, game.exclusions)
      ) {
        return GameHelper.download(game);
      } else {
        if (
          FileUtils.getLastModifiedTime(game.localDir, game.inclusions, game.exclusions) >
          FileUtils.getLastModifiedTime(game.remoteDir, game.inclusions, game.exclusions)
        ) {
          return GameHelper.update(game);
        }
      }
    }
    return 0;
  }

  public static update(game: Game, dryRun: boolean = false): number {
    let count = 0;
    if (!dryRun) {
      console.info('Updating', game.name);
    }
    if (game.inclusions) {
      for (const inc in game.inclusions) {
        const f = path.join(game.localDir, game.inclusions[inc]);
        if (FileHelper.exists(f)) {
          count += FileUtils.syncFile(f, game.localDir, game.remoteDir, dryRun);
        }
      }
    } else if (
      FileUtils.isPendingSync(
        game.remoteDir,
        game.localDir,
        game.remoteDir,
        game.localDir,
        game.exclusions
      ) &&
      FileUtils.getLastModifiedTime(game.localDir, game.inclusions, game.exclusions) >
        FileUtils.getLastModifiedTime(game.remoteDir, game.inclusions, game.exclusions)
    ) {
      if (FileHelper.exists(game.remoteDir)) {
        FileHelper.mkdir(game.remoteDir);
      }
      count += FileUtils.syncFolder(
        game.localDir,
        game.remoteDir,
        game.localDir,
        game.remoteDir,
        game.exclusions,
        false
      );
    }
    return count;
  }
  static download(game: Game): number {
    let count = 0;
    console.info('Downloading', game.name);
    if (game.inclusions) {
      for (const inc in game.inclusions) {
        const f = path.join(game.remoteDir, game.inclusions[inc]);
        if (FileHelper.exists(f)) {
          count += FileUtils.syncFile(f, game.remoteDir, game.localDir, false);
        }
      }
    } else if (
      FileUtils.isPendingSync(
        game.remoteDir,
        game.localDir,
        game.remoteDir,
        game.localDir,
        game.exclusions
      ) &&
      FileUtils.getLastModifiedTime(game.localDir, game.inclusions, game.exclusions) <
        FileUtils.getLastModifiedTime(game.remoteDir, game.inclusions, game.exclusions)
    ) {
      if (FileHelper.exists(game.localDir)) {
        FileHelper.mkdir(game.localDir);
      }
      count += FileUtils.syncFolder(
        game.remoteDir,
        game.localDir,
        game.remoteDir,
        game.localDir,
        game.exclusions,
        false
      );
    }
    return count;
  }

  public static getEvent(game: Game, pid: string | undefined): Event {
    let event: Event = Event.NO_CHANGES;
    if (game.pid && !pid) {
      event = Event.STOPPED;
      mainWindow?.webContents?.send('listen-running', game.name, false);
    }
    if (!game.pid && pid) {
      event = Event.STARTED;
      mainWindow?.webContents?.send('listen-running', game.name, true);
    }
    game.pid = pid;
    return event;
  }

  public static launch(game: Game): void {
    spawn(game.executable, {
      cwd: game.executable.substring(0, game.executable.lastIndexOf(path.sep))
    });
  }
}

export enum Event {
  NO_CHANGES,
  STOPPED,
  STARTED
}
