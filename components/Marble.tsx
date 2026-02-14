import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MARBLE_RADIUS, CELL_SIZE } from '../constants.ts';
import { GameState, MazeData, MarbleColor } from '../types.ts';

interface MarbleProps {
  position: THREE.Vector3;
  tilt: { x: number, z: number };
  maze: MazeData;
  gameState: GameState;
  onVictory: () => void;
  gravity: number;
  friction: number;
  isDemoMode: boolean;
  demoPath: { x: number, y: number }[];
  setTilt: (t: { x: number, z: number }) => void;
  marbleColor: MarbleColor;
}

const COLOR_MAP = {
  // Hyper-saturated colors for maximum punch
  [MarbleColor.RED]: { color: '#ff0000', emissive: '#ff0000' },
  [MarbleColor.GREEN]: { color: '#00ff22', emissive: '#00ff22' },
  [MarbleColor.YELLOW]: { color: '#ffea00', emissive: '#ffea00' },
  [MarbleColor.BLUE]: { color: '#0099ff', emissive: '#0099ff' },
};

export const Marble: React.FC<MarbleProps> = ({ position, tilt, maze, gameState, onVictory, gravity, friction, isDemoMode, demoPath, setTilt, marbleColor }) => {
  const meshRef = useRef<THREE.Group>(null);
  const vel = useRef(new THREE.Vector3(0, 0, 0));
  const pos = useRef(position.clone());
  const [falling, setFalling] = useState(false);
  const currentPathIndex = useRef(0);

  const colors = useMemo(() => COLOR_MAP[marbleColor], [marbleColor]);

  useEffect(() => {
    pos.current.copy(position);
    vel.current.set(0, 0, 0);
    setFalling(false);
    currentPathIndex.current = 0;
  }, [position]);

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING || falling) return;

    const halfW = (maze.width - 1) / 2;
    const halfH = (maze.height - 1) / 2;

    if (isDemoMode && demoPath.length > 0) {
      const target = demoPath[currentPathIndex.current];
      if (target) {
        const targetWorldX = target.x - halfW;
        const targetWorldZ = target.y - halfH;
        const dx = targetWorldX - pos.current.x;
        const dz = targetWorldZ - pos.current.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < 0.2) {
          currentPathIndex.current++;
        } else {
          const steerX = THREE.MathUtils.clamp(dx * 6, -1, 1);
          const steerZ = THREE.MathUtils.clamp(dz * 6, -1, 1);
          const maxAutoTilt = 0.25; 
          setTilt({ x: steerZ * maxAutoTilt, z: -steerX * maxAutoTilt });
        }
      }
    }

    vel.current.x += Math.sin(-tilt.z) * gravity;
    vel.current.z += Math.sin(tilt.x) * gravity;
    vel.current.multiplyScalar(friction);

    let nextX = pos.current.x + vel.current.x;
    let nextZ = pos.current.z + vel.current.z;

    const checkWall = (gx: number, gz: number) => {
      if (gx < 0 || gx >= maze.width || gz < 0 || gz >= maze.height) return true;
      return maze.grid[gz][gx] === 1;
    };

    const currentGridX = Math.round(pos.current.x + halfW);
    const currentGridZ = Math.round(pos.current.z + halfH);
    const wallBuffer = MARBLE_RADIUS + 0.001; 
    
    if (vel.current.x > 0) {
      if (checkWall(currentGridX + 1, currentGridZ)) {
        const wallX = (currentGridX + 0.5) - halfW;
        if (nextX + MARBLE_RADIUS > wallX) {
          nextX = wallX - wallBuffer;
          vel.current.x *= -0.4;
        }
      }
    } else if (vel.current.x < 0) {
      if (checkWall(currentGridX - 1, currentGridZ)) {
        const wallX = (currentGridX - 0.5) - halfW;
        if (nextX - MARBLE_RADIUS < wallX) {
          nextX = wallX + wallBuffer;
          vel.current.x *= -0.4;
        }
      }
    }

    if (vel.current.z > 0) {
      if (checkWall(currentGridX, currentGridZ + 1)) {
        const wallZ = (currentGridZ + 0.5) - halfH;
        if (nextZ + MARBLE_RADIUS > wallZ) {
          nextZ = wallZ - wallBuffer;
          vel.current.z *= -0.4;
        }
      }
    } else if (vel.current.z < 0) {
      if (checkWall(currentGridX, currentGridZ - 1)) {
        const wallZ = (currentGridZ - 0.5) - halfH;
        if (nextZ - MARBLE_RADIUS < wallZ) {
          nextZ = wallZ + wallBuffer;
          vel.current.z *= -0.4;
        }
      }
    }

    const nextGridX = Math.round(nextX + halfW);
    const nextGridZ = Math.round(nextZ + halfH);
    if (checkWall(nextGridX, nextGridZ)) {
      nextX = pos.current.x;
      nextZ = pos.current.z;
    }

    pos.current.x = nextX;
    pos.current.z = nextZ;

    const distToCenterSq = pos.current.x ** 2 + pos.current.z ** 2;
    if (distToCenterSq < 0.17) {
      setFalling(true);
      vel.current.set(0, 0, 0);
      onVictory();
      return;
    }

    if (meshRef.current) {
      meshRef.current.position.set(pos.current.x, MARBLE_RADIUS, pos.current.z);
      const outerShell = meshRef.current.children[0] as THREE.Mesh;
      const innerCore = meshRef.current.children[1] as THREE.Mesh;
      if (outerShell) {
        outerShell.rotation.z -= vel.current.x / MARBLE_RADIUS;
        outerShell.rotation.x += vel.current.z / MARBLE_RADIUS;
      }
      if (innerCore) {
        innerCore.rotation.z -= vel.current.x / MARBLE_RADIUS;
        innerCore.rotation.x += vel.current.z / MARBLE_RADIUS;
        innerCore.rotation.y += delta * 2.0;
      }
    }
  });

  useFrame((state, delta) => {
    if (falling && meshRef.current) {
      meshRef.current.position.y -= delta * 5;
      meshRef.current.scale.multiplyScalar(0.95);
    }
  });

  return (
    <group ref={meshRef} position={[position.x, MARBLE_RADIUS, position.z]}>
      {/* Premium Glass Shell */}
      <mesh castShadow>
        <sphereGeometry args={[MARBLE_RADIUS, 128, 64]} />
        <meshPhysicalMaterial 
          roughness={0.0} 
          transmission={0.98} 
          thickness={0.6} 
          envMapIntensity={6.0}
          color="#ffffff"
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          ior={1.75}
          reflectivity={1.0}
          transparent={true}
          iridescence={1.0}
          iridescenceIOR={1.4}
        />
      </mesh>
      
      {/* High-Intensity Saturated Inner Core */}
      <mesh>
        <torusKnotGeometry args={[MARBLE_RADIUS * 0.52, 0.05, 120, 16, 3, 4]} />
        <meshStandardMaterial 
          color={colors.color} 
          emissive={colors.emissive} 
          emissiveIntensity={18.0} 
          roughness={0.0}
          metalness={1.0}
        />
      </mesh>
      
      {!falling && (
        <mesh position={[0, -MARBLE_RADIUS + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[MARBLE_RADIUS * 1.05, 64]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};