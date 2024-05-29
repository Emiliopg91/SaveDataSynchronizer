import { FileHelper, LoggerMain, Powershell } from '@tser-framework/main';
import path from 'path';

import iconPs1 from '../../../../resources/scripts/icon.ps1?asset';
import { Game } from '../dtos/Game';
import { Constants } from './Constants';
import { FileUtils } from './FileUtils';

export class GameHelper {
  public static async generateIcon(game: Game): Promise<void> {
    game.icon = path.join(Constants.ICONS_FOLDER, (game.psProcess as string) + '.ico');
    await Powershell.runCommand("$exeFile='" + game.executable + "'");
    await Powershell.runCommand("$iconFile='" + game.icon + "'");

    const lines = FileHelper.read(iconPs1).split('\n');
    for (let i = 0; i < lines.length; i++) {
      await Powershell.runCommand(lines[i]);
    }
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
      LoggerMain.info('Updating', game.name);
    }
    if (game.inclusions) {
      for (const inc in game.inclusions) {
        const f = path.join(game.localDir, inc);
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
    LoggerMain.info('Downloading', game.name);
    if (game.inclusions) {
      for (const inc in game.inclusions) {
        const f = path.join(game.remoteDir, inc);
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

  public static getEvent(game: Game, running: boolean): Event {
    let event: Event = Event.NO_CHANGES;
    if (game.wasRunning && !running) {
      event = Event.STOPPED;
    }
    if (!game.wasRunning && running) {
      event = Event.STARTED;
    }
    game.wasRunning = running;
    return event;
  }
}

export enum Event {
  NO_CHANGES,
  STOPPED,
  STARTED
}
