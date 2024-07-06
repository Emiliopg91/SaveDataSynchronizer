import { File, LoggerMain, OSHelper } from '@tser-framework/main';
import { spawn } from 'child_process';
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
    file: path.join('C:', 'Program Files (x86)', 'Steam', 'steam.exe')
  });

  private static EMUDECK_START_ENTRY = new File({
    file: path.join(OSHelper.getHome(), 'AppData', 'Local', 'Programs', 'EmuDeck', 'EmuDeck.exe')
  });

  private static ESDE_START_ENTRY = new File({
    file: path.join(OSHelper.getHome(), 'EmuDeck', 'EmulationStation-DE', 'ES-DE.exe')
  });

  private static PEGASUS_START_ENTRY = new File({
    file: path.join(OSHelper.getHome(), 'EmuDeck', 'Pegasus', 'pegasus-fe.exe')
  });

  private constructor() {}

  public static async generateIcons(): Promise<void> {
    const launchers: Record<string, string> = {};
    if (Launchers.isSteamInstalled()) {
      launchers['EA'] = Launchers.getEaPath();
      launchers['Emudeck'] = Launchers.getEmudeckPath();
      launchers['ESDE'] = Launchers.getEsdePath();
      launchers['Epic'] = Launchers.getEpicPath();
      launchers['GOG-GALAXY'] = Launchers.getGOGPath();
      launchers['Pegasus'] = Launchers.getPegasusPath();
      launchers['Steam'] = Launchers.getSteamPath();
      launchers['Ubisoft'] = Launchers.getUbisoftPath();
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

  private static async runLaucher(exe: string, params: Array<string> = []): Promise<void> {
    spawn(exe, params, {
      cwd: new File({ file: exe }).getParentFile().getAbsolutePath(),
      detached: true
    }).unref();
  }

  public static isEmudeckInstalled(): boolean {
    return Launchers.EMUDECK_START_ENTRY.exists();
  }

  public static getEmudeckPath(): string {
    if (Launchers.EMUDECK_START_ENTRY.exists()) {
      return Launchers.EMUDECK_START_ENTRY.getAbsolutePath();
    } else {
      Launchers.LOGGER.error('No Emudeck installation found');
      return '';
    }
  }

  public static launchEmudeck(): void {
    if (Launchers.EMUDECK_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching Emudeck');
      Launchers.runLaucher(Launchers.getEmudeckPath());
    } else {
      Launchers.LOGGER.error('No Emudeck installation found');
    }
  }

  public static isEsdeInstalled(): boolean {
    return Launchers.ESDE_START_ENTRY.exists();
  }

  public static getEsdePath(): string {
    if (Launchers.ESDE_START_ENTRY.exists()) {
      return Launchers.ESDE_START_ENTRY.getAbsolutePath();
    } else {
      Launchers.LOGGER.error('No ESDE installation found');
      return '';
    }
  }

  public static launchEsde(): void {
    if (Launchers.ESDE_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching ESDE');
      Launchers.runLaucher(Launchers.getEsdePath());
    } else {
      Launchers.LOGGER.error('No ESDE installation found');
    }
  }

  public static isPegasusInstalled(): boolean {
    return Launchers.PEGASUS_START_ENTRY.exists();
  }

  public static getPegasusPath(): string {
    if (Launchers.PEGASUS_START_ENTRY.exists()) {
      return Launchers.PEGASUS_START_ENTRY.getAbsolutePath();
    } else {
      Launchers.LOGGER.error('No Pegasus installation found');
      return '';
    }
  }

  public static launchPegasus(): void {
    if (Launchers.PEGASUS_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching Pegasus');
      Launchers.runLaucher(Launchers.getPegasusPath());
    } else {
      Launchers.LOGGER.error('No Pegasus installation found');
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
      Launchers.runLaucher(Launchers.getEaPath());
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
      Launchers.runLaucher(Launchers.getUbisoftPath());
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
      Launchers.runLaucher(Launchers.getEpicPath());
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
      Launchers.runLaucher(Launchers.getGOGPath());
    } else {
      Launchers.LOGGER.error('No GOG Galaxy installation found');
    }
  }

  public static isSteamInstalled(): boolean {
    return Launchers.STEAM_START_ENTRY.exists();
  }

  public static getSteamPath(): string {
    if (Launchers.STEAM_START_ENTRY.exists()) {
      return Launchers.STEAM_START_ENTRY.getAbsolutePath();
    } else {
      Launchers.LOGGER.error('No Steam installation found');
      return '';
    }
  }

  public static launchSteam(): void {
    if (Launchers.STEAM_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching Steam');
      Launchers.runLaucher(Launchers.getSteamPath(), ['/wait', '/b', 'steam://open/main']);
    } else {
      Launchers.LOGGER.error('No Steam installation found');
    }
  }

  public static launchSteamBigPicture(): void {
    if (Launchers.STEAM_START_ENTRY.exists()) {
      Launchers.LOGGER.info('Launching Steam Big Picture');
      Launchers.runLaucher(Launchers.getSteamPath(), ['/wait', '/b', 'steam://open/bigpicture']);
    } else {
      Launchers.LOGGER.error('No Steam installation found');
    }
  }
}
