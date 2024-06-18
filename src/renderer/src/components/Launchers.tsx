import { AppsContext } from '@renderer/contexts/AppsContext';
import { TranslatorRenderer } from '@tser-framework/renderer';
import { useContext } from 'react';
import { Col, Container, Row } from 'react-bootstrap';

import '../styles/components/Launchers.css';

export function Launchers(): JSX.Element {
  const ctx = useContext(AppsContext);

  const onClickGogGalaxy = (): void => {
    window.api.launchGog();
  };

  const onClickLaunchSteam = (): void => {
    window.api.launchSteam();
  };

  const onClickLaunchSteamBP = (): void => {
    window.api.launchSteamBP();
  };

  return (
    <div id="LaunchersComponent">
      <Container>
        {ctx.launchers.includes('gog') && (
          <Row className="gameEntryRow">
            <Col className="gameEntryRowInfo" sm={6}>
              <img
                className="card-img-top"
                src={'local://' + ctx.iconPath?.replaceAll('\\', '/') + '/Launcher-GOG-GALAXY.ico'}
              />
              <b>{TranslatorRenderer.translate('gog.galaxy')}</b>
            </Col>
            <Col className="gameEntryRowControl" sm={6}>
              <button
                type="button"
                className="btn"
                title={TranslatorRenderer.translate('launch.now')}
                onClick={() => {
                  onClickGogGalaxy();
                }}
              >
                <b>{TranslatorRenderer.translate('launch.now')}</b>
              </button>
            </Col>
          </Row>
        )}
        {ctx.launchers.includes('steam') && (
          <Row className="gameEntryRow">
            <Col className="gameEntryRowInfo" sm={6}>
              <img
                className="card-img-top"
                src={'local://' + ctx.iconPath?.replaceAll('\\', '/') + '/Launcher-Steam.ico'}
              />
              <b>{TranslatorRenderer.translate('steam')}</b>
            </Col>
            <Col className="gameEntryRowControl" sm={6}>
              <button
                type="button"
                className="btn"
                title={TranslatorRenderer.translate('launch.now')}
                onClick={() => {
                  onClickLaunchSteam();
                }}
              >
                <b>{TranslatorRenderer.translate('launch.now')}</b>
              </button>
              <button
                type="button"
                className="btn"
                title={TranslatorRenderer.translate('launch.big.picture')}
                onClick={() => {
                  onClickLaunchSteamBP();
                }}
              >
                <b>{TranslatorRenderer.translate('launch.big.picture')}</b>
              </button>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}
