import { ConfigurationHelper, FileHelper, Powershell, TranslatorMain } from '@tser-framework/main';

import rcloneCfg from '../../resources/cfg/rclone.cfg?asset';
import rcloneExe from '../../resources/dist/rclone.exe?asset';
import translations from '../../resources/translations.i18n.json';
import { Constants } from './libraries/helpers/Constants';
import { NotificationUtils } from './libraries/helpers/NotificationUtils';
import { SaveDataSynchronizer } from './libraries/logic/SaveDataSynchronizer';

export async function runBeforeReady(): Promise<void> {
  TranslatorMain.initialize(translations);
  ConfigurationHelper.initialize();
}

export async function runWhenReady(): Promise<void> {
  NotificationUtils.displayStarting();
  await Powershell.initialize();

  if (!FileHelper.exists(Constants.DIST_FOLDER)) {
    FileHelper.mkdir(Constants.DIST_FOLDER);
  }

  if (!FileHelper.exists(Constants.ICONS_FOLDER)) {
    FileHelper.mkdir(Constants.ICONS_FOLDER);
  }

  if (!FileHelper.exists(Constants.RCLONE_CFG)) {
    FileHelper.copy(rcloneCfg, Constants.RCLONE_CFG);
  }

  if (!FileHelper.exists(Constants.RCLONE_EXE)) {
    FileHelper.copy(rcloneExe, Constants.RCLONE_EXE);
  }

  SaveDataSynchronizer.main();
}
