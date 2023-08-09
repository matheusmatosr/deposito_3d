import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface ShelfProps {
  x: number;
  z: number;
  occupied: boolean;
  onClick: () => void;
  position: [number, number, number];
}

const shelfSize = 0.8;
const spacing = 0.2;

const handleCreateWarehouse = (rows: number, columns: number) => {
  const newWarehouse: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => false)
  );
  return newWarehouse;
};

const getShelfPosition = (x: number, z: number, rows: number, columns: number): [number, number, number] => {
  const offsetX = (columns - 1) * (shelfSize + spacing) * 0.5;
  const offsetZ = (rows - 1) * (shelfSize + spacing) * 0.5;

  return [
    (x - columns / 2) * (shelfSize + spacing) + offsetX,
    0,
    (z - rows / 2) * (shelfSize + spacing) + offsetZ,
  ];
};

const Shelf3D: React.FC<ShelfProps> = ({ x, z, occupied, onClick, position }) => {
  return (
    <mesh onClick={onClick} position={position}>
      <boxGeometry args={[shelfSize, 0.1, shelfSize]} />
      <meshStandardMaterial color={occupied ? '#ff7675' : '#42cd62'} />
    </mesh>
  );
};

const AvailablePositionHighlight: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const ref = useRef<THREE.Mesh>(null);
  const [highlighted, setHighlighted] = useState(false);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      if (highlighted) {
        ref.current.scale.x = Math.sin(Date.now() * 0.005) * 0.1 + 1;
        ref.current.scale.z = Math.sin(Date.now() * 0.005) * 0.1 + 1;
      }
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setHighlighted(!highlighted);
    }, 1000);

    return () => clearTimeout(timer);
  }, [highlighted]);

  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[shelfSize, 0.1, shelfSize]} />
      <meshStandardMaterial color={'#5040e0'} />
    </mesh>
  );
};

const App: React.FC = () => {
  const [rows, setRows] = useState<number>(0);
  const [columns, setColumns] = useState<number>(0);
  const [warehouse, setWarehouse] = useState<boolean[][]>([]);
  const [availablePosition, setAvailablePosition] = useState<[number, number, number] | null>(null);

  const handleCreateWarehouseAndSetState = () => {
    const newWarehouse = handleCreateWarehouse(rows, columns);
    setWarehouse(newWarehouse);
  };

  const handleToggleShelf = (rowIndex: number, columnIndex: number) => {
    const updatedWarehouse = [...warehouse];
    updatedWarehouse[rowIndex][columnIndex] = !updatedWarehouse[rowIndex][columnIndex];
    setWarehouse(updatedWarehouse);

    if (!updatedWarehouse[rowIndex][columnIndex]) {
      const position = getShelfPosition(columnIndex, rowIndex, rows, columns);
      setAvailablePosition(position);
    }
  };

  const occupiedCount = warehouse.flat().filter((occupied) => occupied).length;
  const availableCount = rows * columns - occupiedCount;

  return (
    <div className="App">
      <div className="sidebar">
        <div className="inputs">
          <div className="input-group">
            <label>Linhas:</label>
            <input
              className="styled-input"
              type="number"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value))}
            />
          </div>
          <div className="input-group">
            <label>Colunas:</label>
            <input
              className="styled-input"
              type="number"
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value))}
            />
          </div>
          <button className="styled-button" onClick={handleCreateWarehouseAndSetState}>
            Criar armazém
          </button>
        </div>
        <div className="counts">
          <p className="occupied">Ocupado: {occupiedCount}</p>
          <p className="available">Disponível: {availableCount}</p>
        </div>
      </div>
      <div className="canvas-container">
        {rows > 0 && columns > 0 && (
          <Canvas camera={{ position: [columns * 1.5, 5, rows * 1.5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls />
            <group position={[0, 0, 0]}>
              {warehouse.map((row, rowIndex) =>
                row.map((occupied, columnIndex) => (
                  <Shelf3D
                    key={columnIndex}
                    x={columnIndex}
                    z={rowIndex}
                    occupied={occupied}
                    onClick={() => handleToggleShelf(rowIndex, columnIndex)}
                    position={getShelfPosition(columnIndex, rowIndex, rows, columns)}
                  />
                ))
              )}
              {availablePosition && (
                <group>
                  <AvailablePositionHighlight position={availablePosition} />
                </group>
              )}
              {/* Adiciona a borda preta */}
              <mesh
                position={[
                  (columns - 1) * (shelfSize + spacing) * 0.3,
                  -0.05,
                  (rows - 1) * (shelfSize + spacing) * 0.3,
                ]}
                scale={[
                  columns * (shelfSize + spacing) + spacing,
                  0.1,
                  rows * (shelfSize + spacing) + spacing,
                ]}
              >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="black" transparent opacity={0.5} />
              </mesh>
            </group>
          </Canvas>
        )}
      </div>
    </div>
  );
};

export default App;