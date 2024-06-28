import { File, LoggerMain, OSHelper } from '@tser-framework/main';
import { spawn } from 'child_process';
import { shell } from 'electron/common';
import path from 'path';

import { Game } from '../dtos/Game';
import { Constants } from '../helpers/Constants';
import { GameHelper } from '../helpers/GameHelper';

export class Launchers {
  private static LOGGER = new LoggerMain('Launchers');

  private static EPIC_START_ENTRY = new File({
    file: path.join(
      'C:',
      'Program Files (x86)',
      'Epic Games',
      'Launcher',
      'Portal',
      'Binaries',
      'Win32',
      'EpicGamesLauncher.exe'
    )
  });

  private static GOG_START_ENTRY = new File({
    file: path.join('C:', 'Program Files (x86)', 'GOG Galaxy', 'GalaxyClient.exe')
  });

  private static EA_START_ENTRY = new File({
    file: path.join(
      'C:',
      'Program Files',
      'Electronic Arts',
      'EA Desktop',
      'EA Desktop',
      'EALauncher.exe'
    )
  });

  private static UBISOFT_START_ENTRY = new File({
    file: path.join(
      'C:',
      'Program Files (x86)',
      'Ubisoft',
      'Ubisoft Game Launcher',
      'UbisoftConnect.exe'
    )
  });

  private static STEAM_START_ENTRY = new File({
    file: path.join(
      OSHelper.getHome(),
      'AppData',
      'Roaming',
      'Microsoft',
      'Windows',
      'Start Menu',
      'Programs',
      'Steam',
      'Steam.lnk'
    )
  });

  private constructor() {}

  public static async generateIcons(): Promise<void> {
    const launchers: Record<string, string> = {};
    if (Launchers.isSteamInstalled()) {
      launchers['Steam'] = Launchers.getSteamPath();
      launchers['GOG-GALAXY'] = Launchers.getGOGPath();
      launchers['Epic'] = Launchers.getEpicPath();
      launchers['Ubisoft'] = Launchers.getUbisoftPath();
      launchers['EA'] = Launchers.getEaPath();
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

  public static isEaInstalled(): boolean {
    return Launchers.EA_START_ENTRY.exists();
  }

  public static getEaPath(): string {
    if (Launchers.EA_START_ENTRY.exists()) {
      return Launchers.EA_START_ENTRY.getAbsolutePath();
    } else {
      Launchers.LOGGER.error('No EA installation found');
      return '';
    }
  }

  public static launchEa(): void {
    if (Launchers.EA_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching EA');
      (async (): Promise<void> => {
        spawn(Launchers.getEaPath(), {
          detached: true
        }).unref();
      })();
    } else {
      Launchers.LOGGER.error('No EA installation found');
    }
  }

  public static isUbisoftInstalled(): boolean {
    return Launchers.UBISOFT_START_ENTRY.exists();
  }

  public static getUbisoftPath(): string {
    if (Launchers.UBISOFT_START_ENTRY.exists()) {
      return Launchers.UBISOFT_START_ENTRY.getAbsolutePath();
    } else {
      Launchers.LOGGER.error('No Ubisoft installation found');
      return '';
    }
  }

  public static launchUbisoft(): void {
    if (Launchers.UBISOFT_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching Ubisoft');
      (async (): Promise<void> => {
        spawn(Launchers.getUbisoftPath(), {
          detached: true
        }).unref();
      })();
    } else {
      Launchers.LOGGER.error('No Ubisoft installation found');
    }
  }

  public static isEpicInstalled(): boolean {
    return Launchers.EPIC_START_ENTRY.exists();
  }

  public static getEpicPath(): string {
    if (Launchers.EPIC_START_ENTRY.exists()) {
      return Launchers.EPIC_START_ENTRY.getAbsolutePath();
    } else {
      Launchers.LOGGER.error('No Epic installation found');
      return '';
    }
  }

  public static launchEpic(): void {
    if (Launchers.EPIC_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching Epic');
      (async (): Promise<void> => {
        spawn(Launchers.getEpicPath(), {
          detached: true
        }).unref();
      })();
    } else {
      Launchers.LOGGER.error('No Epic installation found');
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
        spawn(Launchers.getGOGPath(), {
          detached: true
        }).unref();
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
        spawn(Launchers.getSteamPath(), ['/wait', '/b', 'steam://open/main'], {
          detached: true
        }).unref();
      })();
    } else {
      Launchers.LOGGER.error('No Steam installation found');
    }
  }

  public static launchSteamBigPicture(): void {
    if (Launchers.STEAM_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching Steam Big Picture');
      (async (): Promise<void> => {
        spawn(Launchers.getSteamPath(), ['/wait', '/b', 'steam://open/bigpicture'], {
          detached: true
        }).unref();
      })();
    } else {
      Launchers.LOGGER.error('No Steam installation found');
    }
  }
}
