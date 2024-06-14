import { AppsContext } from '@renderer/contexts/AppsContext';
import { TranslatorRenderer } from '@tser-framework/renderer';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

import '../styles/components/ConfigurationModal.css';

export function ConfigurationModal(): JSX.Element {
  const ctx = useContext(AppsContext);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [visible, setVisible] = useState(true);

  const handleClose = (): void => {
    setVisible(false);
    setTimeout(() => {
      ctx.setShowCfgModal(false);
    }, 300);
  };

  const validateForm = (): boolean => {
    if (!cfg) return false;

    if (!cfg['remote'] || (cfg['remote'].trim() as string).length == 0) return false;

    return true;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cfg, setCfg] = useState<any | undefined>(undefined);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [def, setDef] = useState<any | undefined>(undefined);

  useEffect(() => {
    window.api.getAppConfig().then((cfg) => {
      setCfg(cfg);
      setDef(cfg);
    });
  }, []);

  const handleChangeAutostart = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setCfg({ ...cfg, autostart: e.target.checked });
  };

  const handleChangeBigPicture = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setCfg({ ...cfg, bigpicture: e.target.checked });
  };

  const handleChangeRemote = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setCfg({ ...cfg, remote: e.target.value });
  };

  const onClickRestore = (): void => {
    setCfg(def);
  };

  const onFormSubmit = async (event: FormEvent | MouseEvent): Promise<void> => {
    event.preventDefault();
    if (validateForm()) {
      cfg['remote'] = cfg['remote'].trim();
      await window.api.saveAppConfig(cfg);
      ctx.setShowCfgModal(false);
    }
  };

  return (
    <>
      {cfg && (
        <Modal
          id="ConfigurationModal"
          show={visible}
          onHide={handleClose}
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header closeButton>
            <Modal.Title>{TranslatorRenderer.translate('configuration')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={onFormSubmit}>
              <Form.Group className="mb-3" controlId="autostartup">
                <Form.Label>
                  <b>{TranslatorRenderer.translate('global.config')}</b>
                </Form.Label>
                <Form.Check
                  id="autostartCheckbox"
                  label={TranslatorRenderer.translate('autostart')}
                  checked={cfg['autostart']}
                  onChange={handleChangeAutostart}
                />
                {cfg['steampresent'] != 'NA' && (
                  <Form.Check
                    id="bigPictureCheckbox"
                    label={TranslatorRenderer.translate('bigpicture')}
                    checked={cfg['bigpicture'] && String(cfg['bigpicture']) == 'true'}
                    onChange={handleChangeBigPicture}
                  />
                )}
                <div>{JSON.stringify(cfg)}</div>
              </Form.Group>
              <Form.Group className="mb-3" controlId="cloudDirName">
                <Form.Label>
                  <b>{TranslatorRenderer.translate('cloud.dir.name')}</b>
                </Form.Label>
                <Form.Control value={cfg['remote']} type="text" onChange={handleChangeRemote} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" disabled={!validateForm()} onClick={onClickRestore}>
              {TranslatorRenderer.translate('restore.defaults')}
            </Button>
            <Button variant="primary" disabled={!validateForm()} onClick={onFormSubmit}>
              {TranslatorRenderer.translate(
                cfg['remote'].trim() != def['remote'].trim() ? 'save.and.restart' : 'save'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}
