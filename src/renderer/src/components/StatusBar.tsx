import { AppsContext } from '@renderer/contexts/AppsContext';
import { TranslatorRenderer } from '@tser-framework/renderer';
import { useContext } from 'react';

export function StatusBar(): JSX.Element {
  const ctx = useContext(AppsContext);

  return (
    <div id="statusBar" style={{ height: 24, width: '100%' }}>
      <div style={{ textAlign: 'left', position: 'absolute', left: 5, bottom: 0 }}>
        {!ctx.pendingUpdate && <span>{TranslatorRenderer.translate('up.to.date')}</span>}
        {ctx.pendingUpdate && (
          <span
            id="pendingUpdate"
            onClick={() => {
              window.api.triggerUpdate();
            }}
          >
            {TranslatorRenderer.translate('update.available')}
          </span>
        )}
      </div>
      <div style={{ textAlign: 'right', position: 'absolute', right: 5, bottom: 0 }}>
        <span
          id="makeADonation"
          onClick={() => {
            window.api.buyMeACoffee();
          }}
        >
          {TranslatorRenderer.translate('make.a.donation')}
        </span>
      </div>
    </div>
  );
}
