import { Toaster, TranslatorMain } from '@tser-framework/main';
import { shell } from 'electron';

import icon45 from '../../../../resources/icons/icon-45x45.png?asset&asarUnpack';

export class NotificationUtils {
  public static displayInstallingUpdate(): void {
    Toaster.toast(TranslatorMain.translate('installing.update'), icon45);
  }
  public static displayEntrySaved(icon: string | undefined): void {
    Toaster.toast(TranslatorMain.translate('entry.saved'), icon ? icon : icon45);
  }
  public static displayAlreadyRunning(): void {
    Toaster.toast(TranslatorMain.translate('already.running'), icon45, () => {
      shell.openExternal(console.logFile());
    });
  }
  public static displaySyncError(): void {
    Toaster.toast(TranslatorMain.translate('error.sync'), icon45, () => {
      shell.openExternal(console.logFile());
    });
  }
  public static displayUploadFinished(icon: string | undefined): void {
    Toaster.toast(TranslatorMain.translate('upload.finished'), icon ? icon : icon45);
  }
  public static displayUploadingData(icon: string | undefined): void {
    Toaster.toast(TranslatorMain.translate('uploading.data'), icon ? icon : icon45);
  }
  public static displaySyncingData(icon: string | undefined): void {
    Toaster.toast(TranslatorMain.translate('syncing.data'), icon ? icon : icon45);
  }
  public static displaySyncingDataFinished(icon: string | undefined): void {
    Toaster.toast(TranslatorMain.translate('syncing.data.finished'), icon ? icon : icon45);
  }
  public static displayDownloadingData(icon: string | undefined): void {
    Toaster.toast(TranslatorMain.translate('downloading.data'), icon ? icon : icon45);
  }
  public static displayReadinessError(): void {
    Toaster.toast(TranslatorMain.translate('error.loading'), icon45, () => {
      shell.openExternal(console.logFile());
    });
  }
  public static displayReadyToPlay(): void {
    Toaster.toast(TranslatorMain.translate('ready.to.play'), icon45);
  }
  public static displayStarting(): void {
    Toaster.toast(TranslatorMain.translate('starting.synchronizer'), icon45);
  }
}
