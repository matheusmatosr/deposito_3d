import React, { useState } from 'react';
import './App.css';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface ShelfProps {
  x: number;
  z: number;
  occupied: boolean;
  onClick: () => void;
}

const shelfSize = 0.8; // Tamanho da prateleira
const spacing = 0.2; // Espaçamento entre as prateleiras e colunas

const Shelf3D: React.FC<ShelfProps> = ({ x, z, occupied, onClick }) => {
  return (
    <mesh onClick={onClick} position={[x * (shelfSize + spacing), 0, z * (shelfSize + spacing)]}>
      <boxGeometry args={[shelfSize, 0.1, shelfSize]} />
      <meshStandardMaterial color={occupied ? '#ff7675' : '#42cd62'} />
    </mesh>
  );
};

const App: React.FC = () => {
  const [rows, setRows] = useState<number>(0);
  const [columns, setColumns] = useState<number>(0);
  const [warehouse, setWarehouse] = useState<boolean[][]>([]);

  const handleCreateWarehouse = () => {
    const newWarehouse: boolean[][] = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => false)
    );
    setWarehouse(newWarehouse);
  };

  const handleToggleShelf = (rowIndex: number, columnIndex: number) => {
    const updatedWarehouse = [...warehouse];
    updatedWarehouse[rowIndex][columnIndex] = !updatedWarehouse[rowIndex][columnIndex];
    setWarehouse(updatedWarehouse);
  };

  const occupiedCount = warehouse.flat().filter((occupied) => occupied).length;
  const availableCount = rows * columns - occupiedCount;

  return (
    <div className="App">
      <div className="sidebar">
        <div className="inputs">
          <div className="input-group">
            <label>Rows:</label>
            <input
              className="styled-input"
              type="number"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value))}
            />
          </div>
          <div className="input-group">
            <label>Columns:</label>
            <input
              className="styled-input"
              type="number"
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value))}
            />
          </div>
          <button className="styled-button" onClick={handleCreateWarehouse}>
            Create Warehouse
          </button>
        </div>
        <div className="counts">
          <p className="occupied">Occupied: {occupiedCount}</p>
          <p className="available">Available: {availableCount}</p>
        </div>
      </div>
      <div className="canvas-container">
        {rows > 0 && columns > 0 && (
          <Canvas camera={{ position: [columns * 1.5, 5, rows * 1.5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls />
            <group position={[-columns / 2, 0, -rows / 2]}>
              {warehouse.map((row, rowIndex) =>
                row.map((occupied, columnIndex) => (
                  <Shelf3D
                    key={columnIndex}
                    x={columnIndex}
                    z={rowIndex}
                    occupied={occupied}
                    onClick={() => handleToggleShelf(rowIndex, columnIndex)}
                  />
                ))
              )}
            </group>
          </Canvas>
        )}
      </div>
    </div>
  );
};

export default App;