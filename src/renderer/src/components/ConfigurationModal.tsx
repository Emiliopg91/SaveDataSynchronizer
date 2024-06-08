import { AppsContext } from '@renderer/contexts/AppsContext';
import { TranslatorRenderer } from '@tser-framework/renderer';
import { useContext, useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

export function ConfigurationModal(): JSX.Element {
  const ctx = useContext(AppsContext);

  const handleClose = (): void => {
    ctx.setShowCfgModal(false);
  };

  const validateForm = (): boolean => {
    if (!cfg) return false;

    if (!cfg['remote'] || (cfg['remote'].trim() as string).length == 0) return false;

    return true;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cfg, setCfg] = useState<any | undefined>(undefined);

  useEffect(() => {
    window.api.getAppConfig().then((cfg) => {
      setCfg(cfg);
    });
  }, []);

  return (
    <Modal show={true} onHide={handleClose} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>{TranslatorRenderer.translate('configuration')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {cfg && (
          <>
            <Form>
              <Form.Group className="mb-3" controlId="cloudDirName">
                <Form.Label>
                  <b>{TranslatorRenderer.translate('cloud.dir.name')}*</b>
                </Form.Label>
                <Form.Control
                  defaultValue={cfg['remote']}
                  type="text"
                  onChange={(e) => {
                    setCfg({ ...cfg, remote: e.target.value });
                  }}
                />
              </Form.Group>
            </Form>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          disabled={!validateForm()}
          onClick={async () => {
            window.api.saveAppConfig(cfg);
          }}
        >
          {TranslatorRenderer.translate('save.and.restart')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
