import React, { useState, useRef, useEffect, useMemo } from 'react';
import './App.css';
import { Canvas, useThree } from '@react-three/fiber';

import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { Box, Text, OrbitControls, Line, useCursor, } from '@react-three/drei';

import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import WarehouseModal from './components/WarehouseModal';
import { useGLTF } from '@react-three/drei';
import { TransformControls } from '@react-three/drei';
import { useSnapshot, proxy } from 'valtio';
import { useControls } from 'leva'

const development = process.env.REACT_APP_ENV === 'development'

extend({ TextGeometry })

// type SelectedBlueBalls = { [key: string]: boolean };
type SelectedBlueBalls = { [key: string]: [number, number, number] }; // Correção na tipagem

// Valtio
const modes = ['translate', 'rotate', 'scale']

const state: {
  current: any | null;
  mode: number;
} = proxy({ current: null , mode: 0 })

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
  const offsetX = (columns - 0) * (shelfSize + spacing) * 0;
  const offsetZ = (rows - 0) * (shelfSize + spacing) * 0;

  return [
    (x - columns / 5.5) * (shelfSize + spacing) + offsetX,
    0,
    (z - rows / 5.5) * (shelfSize + spacing) + offsetZ,
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
  const [selected, setSelected] = useState(false);
  const selectedRef = useRef<THREE.Mesh>(null);
  const [elevated, setElevated] = useState(false);

  const lineVertices = useMemo(() => {
    return [new THREE.Vector3(0, 0.6, 0), selectedRef.current?.position || new THREE.Vector3()];
  }, [selected]);

  const handleDoubleClick = () => {
    setAnimationActive(!animationActive);
    setSelected(!selected);
  };

  const handleShelfClick = () => {
    onClick();
  }

  useEffect(() => {
    if (!animationActive) {
      setAnimationActive(false);
      setElevated(false); 
      setSelected(!selected);
    }
  }, [animationActive]);

  return (
    <mesh onClick={handleShelfClick} position={position}>
      <boxGeometry args={[shelfSize, elevated ? 0.7 : 0.7, shelfSize]} />
      <meshStandardMaterial color={status==='ocupado' ? '#ff7675' : '#42cd62'} />
      {animationActive && <AnimatedPositionHighlight position={[0, 0.9, 0]} />} 
      {selected && (
        <line>
          {/* <bufferGeometry attach="geometry" {...lineVertices} /> */}
          {/* <lineBasicMaterial color="yellow" /> */}
        </line>
      )}
      <mesh ref={selectedRef} position={position} />
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
      <boxGeometry args={[0, 0, 0]} />
    </mesh>
  );
};

function Model({ name, ...props } : any) {
  const snap = useSnapshot(state)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  return (
    <mesh
      onClick={(e) => (e.stopPropagation(), (state.current = name))}
      onPointerMissed={(e) => e.type === 'click' && (state.current = null)}
      onContextMenu={(e) => snap.current === name && (e.stopPropagation(), (state.mode = (snap.mode + 1) % modes.length))}
      onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      onPointerOut={(e) => setHovered(false)}
      name={name}
      {...props}
      dispose={null}
    />
  )
}

const App: React.FC = () => {
  const [rows, setRows] = useState<number>(0);
  const [columns, setColumns] = useState<number>(0);
  const [warehouse, setWarehouse] = useState<boolean[][]>([]);
  const [availablePosition, setAvailablePosition] = useState<[number, number, number] | null>(null);
  const [selected, setSelected] = useState<SelectedBlueBalls>({});
  const [animatedCount, setAnimatedCount] = useState<number>(0);
  const [modalShow, setModalShow] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<[number, number] | null>(null);
  
  // const [blueBalls, setBlueBalls] = useState<{ [key: string]: boolean }>({});
  // const [blueBalls, setBlueBalls] = useState<{ [key: string]: [number, number, number] }>({});
  const [blueBalls, setBlueBalls] = useState<{ [key: string]: [number, number, number] | boolean }>({});
  
  const font = new FontLoader();

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

  const handleToggleShelf = (rowIndex: number, columnIndex: number) => {
    const updatedWarehouse = [...warehouse];
    const updatedShelfValue = !updatedWarehouse[rowIndex][columnIndex];
    const key = `${rowIndex}-${columnIndex}`;

    setSelectedShelf([rowIndex, columnIndex]);
    setModalShow(true);

    if (blueBalls[key]) {
      const updatedBlueBalls = { ...blueBalls };
      delete updatedBlueBalls[key];
      setBlueBalls(updatedBlueBalls);
    }

    updatedWarehouse[rowIndex][columnIndex] = updatedShelfValue;
    setWarehouse(updatedWarehouse);

    const animatedShelfCount = updatedWarehouse.flat().filter((animated) => animated).length;
    setAnimatedCount(animatedShelfCount);

    if (!updatedShelfValue) {
      const position = getShelfPosition(columnIndex, rowIndex, rows, columns);
      setAvailablePosition(position);
      setBlueBalls({ ...blueBalls, [key]: position });
    }
  };

  const occupiedCount = warehouse.flat().filter((occupied) => occupied).length;
  const availableCount = rows * columns - occupiedCount;
  const distanceFromCorner = .5;

  // modelo do chão
  // 1
  const { scene } = useGLTF('https://www.datocms-assets.com/77681/1692812436-cargill001.glb')
  //2
  // const { scene } = useGLTF('https://www.datocms-assets.com/77681/1692814938-cargill002.glb')

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
            <Controls/>
            <group position-y={-2}>
              <group>
                <mesh>
                {Object.keys(blueBalls).length > 0 && (
                  <mesh>
                    {Object.keys(blueBalls).map((key, index) => {
                      const value = blueBalls[key];
                      if (Array.isArray(value)) {
                        const [x, y, z] = value;
                        return (
                          <Line
                            key={`line-${index}`}
                            points={[
                              new THREE.Vector3(
                                (columns - 0.000) * (shelfSize + spacing) - distanceFromCorner,
                                0.6,
                                (rows - 1.1) * (shelfSize + spacing) - distanceFromCorner
                              ),
                              new THREE.Vector3(x, y, z),
                            ]}
                            color="yellow"
                            lineWidth={7}
                          >
                            <lineBasicMaterial color="yellow" />
                          </Line>
                        );
                      }
                      return null; 
                    })}
                  </mesh>
                  )}
                </mesh>
              </group>
              <Model name={'entrance'} position={[
                  (columns - 0.000) * (shelfSize + spacing) - distanceFromCorner,
                  0.2,
                  (rows - 1.1) * (shelfSize + spacing) - distanceFromCorner
                ]} 
                scale={.5}>
              <Box
                args={[1.5, 1, 2.5, 32]}
                name='entrance'

              >
                <meshStandardMaterial color="#000" />
              </Box>
              <Text
                position={[0, 0, 1.5]}
                scale={[1, 1, 10]}
                rotation={[-1, 0, 0]}
                fontSize={0.5}
                color="red"
                anchorX="center"
                anchorY="middle"
              >
                ENTRADA
              </Text>
              </Model>
            </group>
            <group position={[0, -2, 0]}>
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
              {availablePosition && (
                <group>
                  <AvailablePositionHighlight position={availablePosition} />
                </group>
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
  
              <Model 
                name="floor" 
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
                  {/* <boxGeometry args={[1.5, 1, 1.5]}/>
                  <meshStandardMaterial color="black" transparent opacity={0.5} /> */}
                              {/* <mesh> */}
                  <primitive object={scene} args={[1.5, 1, 1.5]} />
                  {/* </mesh> */}
                </Model>
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

function Controls() {
  const snap = useSnapshot(state)
  const scene = useThree((state) => state.scene)
  const { mode } = useControls({ mode: { value: 'translate', options: ['translate', 'rotate', 'scale'] } })
  return (
    <>
      {snap.current && development && <TransformControls object={scene.getObjectByName(snap.current)} mode={mode as "scale" | "translate" | "rotate" } />}
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
    </>
  )
}

export default App;