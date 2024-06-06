import { AppsContext } from '@renderer/contexts/AppsContext';
import { TranslatorRenderer } from '@tser-framework/renderer';
import { useContext, useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

export function NewEntryModal(): JSX.Element {
  const ctx = useContext(AppsContext);

  const [game, setGame] = useState({});
  const [files, setFiles] = useState<Array<string>>([]);

  const validateForm = (): boolean => {
    if (!game) return false;
    if (!game['name']) return false;
    if (!game['executable']) return false;
    if (!game['localDir']) return false;
    if (
      game['policy'] == '1' &&
      (!game['inclusions'] || (game['inclusions'] as Array<string>).length == 0)
    )
      return false;
    if (
      game['policy'] == '2' &&
      (!game['exclusions'] || (game['exclusions'] as Array<string>).length == 0)
    )
      return false;
    if (!game['remoteDir']) return false;

    return true;
  };

  useEffect(() => {
    setGame({ policy: '0' });
  }, []);

  useEffect(() => {
    setTimeout(async () => {
      if (game['localDir']) {
        setFiles(await window.api.getLocalFiles(game['localDir']));
        setGame({ ...game, inclusions: [], exclusions: [] });
      }
    }, 250);
  }, [game['localDir']]);

  const handleClose = (): void => {
    ctx.setShowAddModal(false);
  };

  return (
    <Modal show={ctx.showAddModal} onHide={handleClose} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>{TranslatorRenderer.translate('add.new.entry')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="gameName">
            <Form.Label>{TranslatorRenderer.translate('game.name')}</Form.Label>
            <Form.Control
              type="text"
              onChange={(e) => {
                setGame({ ...game, name: e.target.value });
              }}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="gameExecutable">
            <Form.Label>{TranslatorRenderer.translate('game.executable')}</Form.Label>
            <br />
            <Button
              onClick={async () => {
                setGame({ ...game, executable: await window.api.exploreExecutable() });
              }}
            >
              {TranslatorRenderer.translate('explore')}
            </Button>
            {game['executable'] && (
              <span style={{ marginLeft: 10 }}>
                {(game['executable'] as string).substring(
                  (game['executable'] as string).lastIndexOf('\\') + 1
                )}
              </span>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="gameLocalDir">
            <Form.Label>{TranslatorRenderer.translate('game.local.dir')}</Form.Label>
            <br />
            <Button
              onClick={async () => {
                setGame({ ...game, localDir: await window.api.exploreLocal() });
              }}
            >
              {TranslatorRenderer.translate('explore')}
            </Button>
            {game['localDir'] && (
              <span style={{ marginLeft: 10 }}>
                {(game['localDir'] as string).substring(
                  (game['localDir'] as string).lastIndexOf('\\') + 1
                )}
              </span>
            )}
          </Form.Group>
          {game['localDir'] && (
            <Form.Group className="mb-3" controlId="gamePolicy">
              <Form.Label>{TranslatorRenderer.translate('game.policy')}</Form.Label>{' '}
              <Form.Select
                required={true}
                onChange={(e) => {
                  setGame({ ...game, policy: e.target.value, inclusions: [], exclusions: [] });
                }}
              >
                <option value="0">{TranslatorRenderer.translate('game.include.all')}</option>
                <option value="1">{TranslatorRenderer.translate('game.include.selected')}</option>
                <option value="2">{TranslatorRenderer.translate('game.exclude.selected')}</option>
              </Form.Select>
            </Form.Group>
          )}
          {game['policy'] == 1 && (
            <Form.Group className="mb-3" controlId="gameInclusion">
              <Form.Label>{TranslatorRenderer.translate('game.inclusions')}</Form.Label>{' '}
              <Form.Select
                multiple
                required={true}
                onChange={(e) => {
                  const arr: Array<string> = [];
                  for (const i in e.target.selectedOptions) {
                    if (e.target.selectedOptions[i].value) {
                      arr.push(e.target.selectedOptions[i].value);
                    }
                  }
                  console.log(arr);
                  setGame({ ...game, inclusions: arr });
                }}
              >
                {files.map((f) => {
                  return (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>
          )}
          {game['policy'] == 2 && (
            <Form.Group className="mb-3" controlId="gameExclusion">
              <Form.Label>{TranslatorRenderer.translate('game.exclusions')}</Form.Label>{' '}
              <Form.Select
                multiple
                required={true}
                onChange={(e) => {
                  const arr: Array<string> = [];
                  for (const i in e.target.selectedOptions) {
                    if (e.target.selectedOptions[i].value) {
                      arr.push(e.target.selectedOptions[i].value);
                    }
                  }
                  console.log(arr);
                  setGame({ ...game, exclusions: arr });
                }}
              >
                {files.map((f) => {
                  return (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>
          )}
          <Form.Group className="mb-3" controlId="gameRemoteDir">
            <Form.Label>{TranslatorRenderer.translate('game.remote.dir')}</Form.Label>
            <br />
            <Button
              onClick={async () => {
                setGame({ ...game, remoteDir: await window.api.exploreRemote() });
              }}
            >
              {TranslatorRenderer.translate('explore')}
            </Button>
            {game['remoteDir'] && (
              <span style={{ marginLeft: 10 }}>
                {(game['remoteDir'] as string).substring(
                  (game['remoteDir'] as string).lastIndexOf('\\') + 1
                )}
              </span>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          disabled={!validateForm()}
          onClick={async () => {
            if (confirm(TranslatorRenderer.translate('confirm.save'))) {
              const entry = { ...game, category: ctx.category };
              await window.api.saveEntry(entry);
              setGame({});
              setTimeout(() => {
                ctx.setShowAddModal(false);
                location.reload();
              }, 250);
            }
          }}
        >
          {TranslatorRenderer.translate('save')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
