import { Toaster } from '@tser-framework/main';

import icon45 from '../../../../resources/icons/icon-45x45.png?asset&asarUnpack';

export class NotificationUtils {
  public static displayUploadFinished(icon: string | undefined): void {
    Toaster.toast('upload.finished', icon ? icon : icon45);
  }
  public static displayUploadingData(icon: string | undefined): void {
    Toaster.toast('uploading.data', icon ? icon : icon45);
  }
  public static displayDownloadingData(icon: string | undefined): void {
    Toaster.toast('downloading.data', icon ? icon : icon45);
  }
  public static displayReadinessError(): void {
    Toaster.toast('error.loading', icon45);
  }
  public static displayReadyToPlay(): void {
    Toaster.toast('ready.to.play', icon45);
  }
  public static displayStarting(): void {
    Toaster.toast('starting.synchronizer', icon45);
  }
}
