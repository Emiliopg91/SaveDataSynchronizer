import { ConfigurationHelper, FileHelper, OSHelper } from '@tser-framework/main';
import path, { join } from 'path';

export class Constants {
  public static SDS_FILE_NAME = '.sds';
  public static REMOTE_FOLDER = join(FileHelper.APP_DIR, 'remote');
  public static DIST_FOLDER = join(FileHelper.APP_DIR, 'dist');
  public static ICONS_FOLDER = join(FileHelper.APP_DIR, 'icons');

  public static RCLONE_EXE = join(Constants.DIST_FOLDER, 'rclone.exe');
  public static RCLONE_BYSINC_FOLDER = path.join(
    OSHelper.getHome(),
    'AppData',
    'Local',
    'rclone',
    'bisync'
  );
  public static RCLONE_CFG = join(ConfigurationHelper.CONFIG_FOLDER, 'rclone.cfg');
  public static PSSUSPEND_EXE = join(Constants.DIST_FOLDER, 'pssuspend.exe');
}
