import { ConfigurationHelper, File, Powershell, TranslatorMain } from '@tser-framework/main';

import pssuspendExe from '../../resources/dist/pssuspend.exe?asset';
import rcloneExe from '../../resources/dist/rclone.exe?asset';
import translations from '../../translations.i18n.json';
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

  if (!new File({ file: Constants.DIST_FOLDER }).exists()) {
    new File({ file: Constants.DIST_FOLDER }).mkdir();
  }

  if (!new File({ file: Constants.ICONS_FOLDER }).exists()) {
    new File({ file: Constants.ICONS_FOLDER }).mkdir();
  }

  if (!new File({ file: Constants.RCLONE_EXE }).exists()) {
    new File({ file: rcloneExe }).copy(new File({ file: Constants.RCLONE_EXE }));
  }

  if (!new File({ file: Constants.PSSUSPEND_EXE }).exists()) {
    new File({ file: pssuspendExe }).copy(new File({ file: Constants.PSSUSPEND_EXE }));
  }

  SaveDataSynchronizer.main();
}
