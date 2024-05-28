import { Toaster } from '@tser-framework/main';

import icon45 from '../../../../resources/icons/icon-45x45.png?asset';

export class NotificationUtils {
  public static displayReadyToPlay(): void {
    Toaster.toast('ready.to.play', icon45);
  }
  public static displayStarting(): void {
    Toaster.toast('starting.synchronizer', icon45);
  }
}
