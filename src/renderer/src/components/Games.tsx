import { AppsContext } from '@renderer/contexts/AppsContext';
import { useApp } from '@renderer/hooks/useApp';
import { TranslatorRenderer } from '@tser-framework/renderer';
import { useContext, useEffect } from 'react';
import { Col, Container, Form, Row } from 'react-bootstrap';
import { FaSyncAlt } from 'react-icons/fa';
import { FaRegTrashAlt } from 'react-icons/fa';
import { FaPlay } from 'react-icons/fa6';
import { IoAddCircleOutline } from 'react-icons/io5';

export function Games({ type }: { type: string }): JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apps, setType, setFilter] = useApp();
  const ctx = useContext(AppsContext);
  useEffect(() => {
    setType(type);
  }, [type]);

  return (
    <>
      <Form.Control
        type="text"
        placeholder={TranslatorRenderer.translate('filter.entries')}
        onChange={(event) => {
          setFilter(event.target.value);
        }}
        style={{ marginBottom: 5 }}
      />
      <Container>
        {apps.map((g, idx) => {
          return (
            <Row className="gameEntryRow" key={idx} style={{ paddingBottom: 5 }}>
              <Col sm={8} style={{ margin: 'auto' }}>
                <img
                  className="card-img-top"
                  src={'local://' + g.icon?.replaceAll('\\', '/')}
                  style={{ maxHeight: 45, maxWidth: 40, paddingTop: 5, marginRight: 10 }}
                />
                <b>{g.name}</b>
              </Col>
              <Col sm={4} style={{ paddingTop: 5, textAlign: 'right', margin: 'auto' }}>
                {g['running'] && <b>{TranslatorRenderer.translate('running.now')}</b>}
                {!g['running'] && (
                  <>
                    <button
                      type="button"
                      className="btn"
                      title={TranslatorRenderer.translate('launch.now')}
                      onClick={() => {
                        window.api.launch(g.name);
                      }}
                    >
                      <FaPlay color="green" />
                    </button>
                    <button
                      type="button"
                      className="btn"
                      title={TranslatorRenderer.translate('sync.now')}
                      onClick={() => {
                        window.api.sync(g.name);
                      }}
                      disabled={ctx.syncing}
                    >
                      <FaSyncAlt color="blue" />
                    </button>
                    <button
                      type="button"
                      className="btn"
                      title={TranslatorRenderer.translate('remove.entry')}
                      onClick={() => {
                        if (confirm(TranslatorRenderer.translate('sure.to.remove'))) {
                          window.api.deleteEntry(g.name);
                          location.reload();
                        }
                      }}
                    >
                      <FaRegTrashAlt color="red" />
                    </button>
                  </>
                )}
              </Col>
            </Row>
          );
        })}
        <Row>
          <Col sm={12} id="addNewEntryRow">
            <span
              onClick={() => {
                ctx.setShowAddModal(true);
              }}
            >
              <IoAddCircleOutline /> {TranslatorRenderer.translate('add.new.entry')}
            </span>
          </Col>
        </Row>
      </Container>
    </>
  );
}
