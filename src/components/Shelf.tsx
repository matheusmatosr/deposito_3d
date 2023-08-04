import React from 'react';
import { Shelf } from '../models/WarehouseType';

interface ShelfProps {
  shelf: Shelf;
  onToggle: () => void;
}

const ShelfComponent: React.FC<ShelfProps> = ({ shelf, onToggle }) => {
  return (
    <div
      className={`shelf ${shelf.occupied ? 'occupied' : 'available'}`}
      onClick={onToggle}
    >
      {shelf.occupied ? 'Ocupada' : 'Disponível'}
    </div>
  );
};

export default ShelfComponent;