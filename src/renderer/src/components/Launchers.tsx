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

  const onClickLaunchEpic = (): void => {
    window.api.launchEpic();
  };

  const onClickLaunchUbisoft = (): void => {
    window.api.launchUbisoft();
  };

  const onClickLaunchEmudeck = (): void => {
    window.api.launchEmudeck();
  };

  const onClickLaunchEa = (): void => {
    window.api.launchEa();
  };

  const onClickLaunchEsde = (): void => {
    window.api.launchEsde();
  };

  const onClickLaunchPegasus = (): void => {
    window.api.launchPegasus();
  };

  return (
    <div id="LaunchersComponent">
      <Container>
        {ctx.launchers.includes('ea') && (
          <Row className="gameEntryRow">
            <Col className="gameEntryRowInfo" sm={6}>
              <img
                className="card-img-top"
                src={'local://' + ctx.iconPath?.replaceAll('\\', '/') + '/Launcher-EA.ico'}
              />
              <b>{TranslatorRenderer.translate('ea')}</b>
            </Col>
            <Col className="gameEntryRowControl" sm={6}>
              <button
                type="button"
                className="btn"
                title={TranslatorRenderer.translate('launch.now')}
                onClick={() => {
                  onClickLaunchEa();
                }}
              >
                <b>{TranslatorRenderer.translate('launch.now')}</b>
              </button>
            </Col>
          </Row>
        )}
        {ctx.launchers.includes('emudeck') && (
          <Row className="gameEntryRow">
            <Col className="gameEntryRowInfo" sm={6}>
              <img
                className="card-img-top"
                src={'local://' + ctx.iconPath?.replaceAll('\\', '/') + '/Launcher-Emudeck.ico'}
              />
              <b>{TranslatorRenderer.translate('emudeck')}</b>
            </Col>
            <Col className="gameEntryRowControl" sm={6}>
              <button
                type="button"
                className="btn"
                title={TranslatorRenderer.translate('launch.now')}
                onClick={() => {
                  onClickLaunchEmudeck();
                }}
              >
                <b>{TranslatorRenderer.translate('launch.now')}</b>
              </button>
            </Col>
          </Row>
        )}
        {ctx.launchers.includes('esde') && (
          <Row className="gameEntryRow">
            <Col className="gameEntryRowInfo" sm={6}>
              <img
                className="card-img-top"
                src={'local://' + ctx.iconPath?.replaceAll('\\', '/') + '/Launcher-ESDE.ico'}
              />
              <b>{TranslatorRenderer.translate('esde')}</b>
            </Col>
            <Col className="gameEntryRowControl" sm={6}>
              <button
                type="button"
                className="btn"
                title={TranslatorRenderer.translate('launch.now')}
                onClick={() => {
                  onClickLaunchEsde();
                }}
              >
                <b>{TranslatorRenderer.translate('launch.now')}</b>
              </button>
            </Col>
          </Row>
        )}
        {ctx.launchers.includes('epic') && (
          <Row className="gameEntryRow">
            <Col className="gameEntryRowInfo" sm={6}>
              <img
                className="card-img-top"
                src={'local://' + ctx.iconPath?.replaceAll('\\', '/') + '/Launcher-Epic.ico'}
              />
              <b>{TranslatorRenderer.translate('epic')}</b>
            </Col>
            <Col className="gameEntryRowControl" sm={6}>
              <button
                type="button"
                className="btn"
                title={TranslatorRenderer.translate('launch.now')}
                onClick={() => {
                  onClickLaunchEpic();
                }}
              >
                <b>{TranslatorRenderer.translate('launch.now')}</b>
              </button>
            </Col>
          </Row>
        )}
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
        {ctx.launchers.includes('pegasus') && (
          <Row className="gameEntryRow">
            <Col className="gameEntryRowInfo" sm={6}>
              <img
                className="card-img-top"
                src={'local://' + ctx.iconPath?.replaceAll('\\', '/') + '/Launcher-Pegasus.ico'}
              />
              <b>{TranslatorRenderer.translate('pegasus')}</b>
            </Col>
            <Col className="gameEntryRowControl" sm={6}>
              <button
                type="button"
                className="btn"
                title={TranslatorRenderer.translate('launch.now')}
                onClick={() => {
                  onClickLaunchPegasus();
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
        {ctx.launchers.includes('ubisoft') && (
          <Row className="gameEntryRow">
            <Col className="gameEntryRowInfo" sm={6}>
              <img
                className="card-img-top"
                src={'local://' + ctx.iconPath?.replaceAll('\\', '/') + '/Launcher-Ubisoft.ico'}
              />
              <b>{TranslatorRenderer.translate('ubisoft')}</b>
            </Col>
            <Col className="gameEntryRowControl" sm={6}>
              <button
                type="button"
                className="btn"
                title={TranslatorRenderer.translate('launch.now')}
                onClick={() => {
                  onClickLaunchUbisoft();
                }}
              >
                <b>{TranslatorRenderer.translate('launch.now')}</b>
              </button>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}
