import { ConfigurationHelper, FileHelper } from '@tser-framework/main';
import { join } from 'path';

export class Constants {
  public static REMOTE_FOLDER = join(FileHelper.APP_DIR, 'remote');
  public static DIST_FOLDER = join(FileHelper.APP_DIR, 'dist');
  public static ICONS_FOLDER = join(FileHelper.APP_DIR, 'icons');

  public static RCLONE_EXE = join(Constants.DIST_FOLDER, 'rclone.exe');
  public static RCLONE_CFG = join(ConfigurationHelper.CONFIG_FOLDER, 'rclone.cfg');
}
