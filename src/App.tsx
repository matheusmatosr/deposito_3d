import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import WarehouseModal from './components/WarehouseModal';

interface ShelfProps {
  x: number;
  z: number;
  occupied: boolean;
  onClick: () => void;
  position: [number, number, number];
  status: string; 
}

const shelfSize = 0.8;
const spacing = 0.35;

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

const AnimatedPositionHighlight: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.15 + 0.3;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.2, 32, 32]} /> 
      <meshStandardMaterial color={'#5040e0'} />
    </mesh>
  );
};

const Shelf3D: React.FC<ShelfProps> = ({ onClick, position, status }) => {
  const [animationActive, setAnimationActive] = useState(false);
  const [elevated, setElevated] = useState(false);

  const handleShelfClick = () => {
    onClick();
  }

  useEffect(() => {
    if (!animationActive) {
      setAnimationActive(false);
      setElevated(false); 
    }
  }, [animationActive]);

  return (
    <mesh onClick={handleShelfClick} position={position}>
      <boxGeometry args={[shelfSize, elevated ? 0.7 : 0.7, shelfSize]} />
      <meshStandardMaterial color={status==='ocupado' ? '#ff7675' : '#42cd62'} />
      {animationActive && <AnimatedPositionHighlight position={[0, 0.9, 0]} />} 
    </mesh>
  );
};

const App: React.FC = () => {
  const [rows, setRows] = useState<number>(0);
  const [columns, setColumns] = useState<number>(0);
  const [warehouse, setWarehouse] = useState<boolean[][]>([]);
  const [animatedCount, setAnimatedCount] = useState<number>(0);
  const [blueBalls, setBlueBalls] = useState<{ [key: string]: boolean }>({});
  const [modalShow, setModalShow] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<[number, number] | null>(null);

  const handleToggleShelf = (rowIndex: number, columnIndex: number) => {
    setSelectedShelf([rowIndex, columnIndex]);
    setModalShow(true);
  };

  const handleModalSubmit = (status: string) => {
    if (selectedShelf) {
      const [rowIndex, columnIndex] = selectedShelf;
      const key = `${rowIndex}-${columnIndex}`;

      if (status === "guardar") {
        const updatedBlueBalls = { ...blueBalls, [key]: true };
        setBlueBalls(updatedBlueBalls);
        setAnimatedCount(Object.keys(updatedBlueBalls).length);
      } else if (blueBalls[key]) {
        const updatedBlueBalls = { ...blueBalls };
        delete updatedBlueBalls[key];
        setBlueBalls(updatedBlueBalls);
        setAnimatedCount(Object.keys(updatedBlueBalls).length);
      }

      const updatedWarehouse = [...warehouse];
      updatedWarehouse[rowIndex][columnIndex] = status === "ocupado";
      setWarehouse(updatedWarehouse);
      setModalShow(false);
    }
  };

  const handleCreateWarehouseAndSetState = () => {
    const newWarehouse = handleCreateWarehouse(rows, columns);
    setWarehouse(newWarehouse);
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
          <p className="saved">Guardar: {Object.keys(blueBalls).length}</p> 
        </div>
      </div>
      <div className="canvas-container">
        {rows > 0 && columns > 0 && (
          <Canvas camera={{ position: [columns * 1.5, 8, rows * 1.5], fov: 60 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls />
            <group position={[0, 2, 0]}>
              {warehouse.map((row, rowIndex) =>
                row.map((occupied, columnIndex) => (
                  <Shelf3D
                    key={columnIndex}
                    x={columnIndex}
                    z={rowIndex}
                    occupied={occupied}
                    onClick={() => handleToggleShelf(rowIndex, columnIndex)}
                    position={getShelfPosition(columnIndex, rowIndex, rows, columns)}
                    status={occupied ? "ocupado" : "disponível"} 
                  />
                ))
              )}
              <group>
                {Object.keys(blueBalls).map((key) => {
                  const [rowIndex, columnIndex] = key.split("-").map(Number);
                  const shelfPosition = getShelfPosition(columnIndex, rowIndex, rows, columns);
                  const ballPosition: [number, number, number] = [
                    shelfPosition[0],
                    shelfPosition[1] + 1.0, 
                    shelfPosition[2],
                  ];
                  return (
                    <AnimatedPositionHighlight
                      key={key}
                      position={ballPosition}
                    />
                  );
                })}
              </group>
              <mesh
                position={[
                  (columns - 1) * (shelfSize + spacing) * 0.25,
                  -0.4,
                  (rows - 1) * (shelfSize + spacing) * 0.25,
                ]}
                scale={[
                  columns * (shelfSize + spacing) + spacing,
                  0.1,
                  rows * (shelfSize + spacing) + spacing,
                ]}
              >
                <boxGeometry args={[1.5, 1, 1.5]} />
                <meshStandardMaterial color="black" transparent opacity={0.5} />
              </mesh>
            </group>
          </Canvas>
        )}
      </div>
      <WarehouseModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default App;