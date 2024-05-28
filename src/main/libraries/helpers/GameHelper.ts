import { FileHelper, Powershell } from '@tser-framework/main';
import path from 'path';

import iconPs1 from '../../../../resources/scripts/icon.ps1?asset';
import { Game } from '../dtos/Game';
import { Constants } from './Constants';

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
}
