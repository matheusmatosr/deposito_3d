import React, { useState } from 'react';
import { Modal, Form } from 'react-bootstrap';
import '../style/Modal.css';

interface WarehouseModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (status: string) => void;
}

const WarehouseModal: React.FC<WarehouseModalProps> = ({ show, onHide, onSubmit }) => {
  const [status, setStatus] = useState('');

  const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStatus(event.target.value);
  };

  const handleSubmit = () => {
    onSubmit(status);
    setStatus('');
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Editar status</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Check
              type="radio"
              label="Disponível"
              value="disponível"
              checked={status === 'disponível'}
              onChange={handleStatusChange}
            />
            <Form.Check
              type="radio"
              label="Ocupado"
              value="ocupado"
              checked={status === 'ocupado'}
              onChange={handleStatusChange}
            />
            <Form.Check
              type="radio"
              label="Guardar"
              value="guardar"
              checked={status === 'guardar'}
              onChange={handleStatusChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" onClick={onHide}>
          Fechar
        </button>
        <button type="button" onClick={handleSubmit}>
          Enviar
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default WarehouseModal;