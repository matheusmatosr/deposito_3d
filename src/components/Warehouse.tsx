import React from 'react';
import { Warehouse as WarehouseType } from '../models/WarehouseType';
import ShelfComponent from './Shelf';

interface WarehouseProps {
  data: WarehouseType;
  onShelfToggle: (shelfId: string) => void;
}

const Warehouse: React.FC<WarehouseProps> = ({ data, onShelfToggle }) => {
  return (
    <div className="warehouse">
      {data.rows.map((row) => (
        <div key={row.id} className="row">
          {row.shelves.map((shelf) => (
            <ShelfComponent
              key={shelf.id}
              shelf={shelf}
              onToggle={() => onShelfToggle(shelf.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Warehouse;