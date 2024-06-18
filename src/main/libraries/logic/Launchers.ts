import { File, LoggerMain, OSHelper } from '@tser-framework/main';
import { spawn } from 'child_process';
import { shell } from 'electron/common';
import path from 'path';

import { Game } from '../dtos/Game';
import { Constants } from '../helpers/Constants';
import { GameHelper } from '../helpers/GameHelper';

export class Launchers {
  private static LOGGER = new LoggerMain('Launchers');

  private static GOG_START_ENTRY = new File({
    file: 'GalaxyClient.exe',
    parent: path.join('C:', 'Program Files (x86)', 'GOG Galaxy')
  });

  private static STEAM_START_ENTRY = new File({
    file: 'Steam.lnk',
    parent: path.join(
      OSHelper.getHome(),
      'AppData',
      'Roaming',
      'Microsoft',
      'Windows',
      'Start Menu',
      'Programs',
      'Steam'
    )
  });

  private constructor() {}

  public static async generateIcons(): Promise<void> {
    const launchers: Record<string, string> = {};
    if (Launchers.isSteamInstalled()) {
      launchers['Steam'] = Launchers.getSteamPath();
      launchers['GOG-GALAXY'] = Launchers.getGOGPath();
    }
    for (const id in launchers) {
      const g: Game = {
        name: id,
        category: '',
        localDir: '',
        remoteDir: '',
        executable: launchers[id],
        icon: path.join(Constants.ICONS_FOLDER, 'Launcher-' + id + '.ico')
      };
      await GameHelper.generateIcon(g);
    }
  }

  public static isGOGInstalled(): boolean {
    return Launchers.GOG_START_ENTRY.exists();
  }

  public static getGOGPath(): string {
    if (Launchers.GOG_START_ENTRY.exists()) {
      return Launchers.GOG_START_ENTRY.getAbsolutePath();
    } else {
      Launchers.LOGGER.error('No GOG installation found');
      return '';
    }
  }

  public static launchGOG(): void {
    if (Launchers.GOG_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching GOG Galaxy');
      (async (): Promise<void> => {
        spawn(Launchers.getGOGPath());
      })();
    } else {
      Launchers.LOGGER.error('No GOG Galaxy installation found');
    }
  }

  public static isSteamInstalled(): boolean {
    return Launchers.STEAM_START_ENTRY.exists();
  }

  public static getSteamPath(): string {
    if (Launchers.STEAM_START_ENTRY.exists()) {
      return shell.readShortcutLink(Launchers.STEAM_START_ENTRY.getAbsolutePath()).target;
    } else {
      Launchers.LOGGER.error('No Steam installation found');
      return '';
    }
  }

  public static launchSteam(): void {
    if (Launchers.STEAM_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching Steam');
      (async (): Promise<void> => {
        spawn(Launchers.getSteamPath(), ['/wait', '/b', 'steam://open/main']);
      })();
    } else {
      Launchers.LOGGER.error('No Steam installation found');
    }
  }

  public static launchSteamBigPicture(): void {
    if (Launchers.STEAM_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching Steam Big Picture');
      (async (): Promise<void> => {
        spawn(Launchers.getSteamPath(), ['/wait', '/b', 'steam://open/bigpicture']);
      })();
    } else {
      Launchers.LOGGER.error('No Steam installation found');
    }
  }
}
