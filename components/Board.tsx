import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MazeData, Theme } from '../types.ts';
import { CELL_SIZE, WALL_HEIGHT } from '../constants.ts';

interface BoardProps {
  maze: MazeData;
  tilt: { x: number, z: number };
  theme: Theme;
}

const useWoodTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#e5c090';
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.lineWidth = 3;
    for (let i = 0; i < 80; i++) {
      ctx.strokeStyle = i % 3 === 0 ? '#7a421a' : '#5a2d0c';
      ctx.beginPath();
      const x = Math.random() * 1024;
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 100, 256, x - 100, 768, x, 1024);
      ctx.globalAlpha = 0.2 + Math.random() * 0.3;
      ctx.stroke();
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < 200; i++) {
      ctx.strokeStyle = '#4a2508';
      ctx.beginPath();
      const x = Math.random() * 1024;
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.random() - 0.5) * 50, 1024);
      ctx.globalAlpha = 0.1;
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const kx = Math.random() * 1024;
      const ky = Math.random() * 1024;
      const radX = 15 + Math.random() * 25;
      const radY = 10 + Math.random() * 15;
      const rot = Math.random() * Math.PI;

      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#3a1d06';
      ctx.beginPath();
      ctx.ellipse(kx, ky, radX, radY, rot, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#3a1d06';
      ctx.beginPath();
      ctx.ellipse(kx, ky, radX * 1.5, radY * 1.5, rot, 0, Math.PI * 2);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.anisotropy = 16;
    return tex;
  }, []);
};

const TargetHole: React.FC = () => {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 4) + 1) / 2;
      glowRef.current.scale.setScalar(1 + pulse * 0.15);
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0 + pulse * 2.5;
    }
    if (ringRef.current) {
        ringRef.current.rotation.z += 0.02;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, -2.5, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 5, 32, 1, true]} />
        <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
      </mesh>
      
      <mesh position={[0, -4.5, 0]}>
        <circleGeometry args={[0.45, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.8} />
      </mesh>

      <mesh ref={glowRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.6, 32]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#fbbf24" 
          emissiveIntensity={1.5} 
          transparent 
          opacity={0.9}
        />
      </mesh>

      <mesh ref={ringRef} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.65, 64]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} transparent opacity={0.5} />
      </mesh>

      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
        <meshStandardMaterial color="#eeeeee" metalness={0.9} roughness={0.1} />
      </mesh>
      
      <mesh position={[0.3, 1.8, 0]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.02]} />
        <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};

export const Board: React.FC<BoardProps> = ({ maze, tilt, theme }) => {
  const halfW = (maze.width - 1) / 2;
  const halfH = (maze.height - 1) / 2;
  const woodTexture = useWoodTexture();

  const isMetal = theme === Theme.METAL;

  const floorMaterial = isMetal 
    ? <meshStandardMaterial color="#222222" roughness={1.0} metalness={0.0} />
    : <meshStandardMaterial map={woodTexture} color="#ffffff" roughness={0.7} metalness={0.1} />;

  const wallMaterial = isMetal
    ? <meshStandardMaterial color="#f0f0f0" roughness={0.05} metalness={1.0} envMapIntensity={3.0} />
    : <meshStandardMaterial map={woodTexture} color="#7a421a" roughness={0.6} metalness={0.1} />;

  return (
    <group rotation={[tilt.x, 0, tilt.z]}>
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[maze.width * CELL_SIZE, 0.1, maze.height * CELL_SIZE]} />
        {floorMaterial}
      </mesh>

      <TargetHole />

      {maze.grid.map((row, z) => 
        row.map((cell, x) => {
          if (cell === 0) return null;
          const posX = (x - halfW) * CELL_SIZE;
          const posZ = (z - halfH) * CELL_SIZE;
          return (
            <mesh key={`${x}-${z}`} position={[posX, WALL_HEIGHT / 2, posZ]} castShadow receiveShadow>
              <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
              {wallMaterial}
            </mesh>
          );
        })
      )}

      <group position={[0, WALL_HEIGHT / 2, 0]}>
        <mesh position={[0, 0, (halfH + 1) * CELL_SIZE]} castShadow receiveShadow>
          <boxGeometry args={[(maze.width + 2) * CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
          {wallMaterial}
        </mesh>
        <mesh position={[0, 0, -(halfH + 1) * CELL_SIZE]} castShadow receiveShadow>
          <boxGeometry args={[(maze.width + 2) * CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
          {wallMaterial}
        </mesh>
        <mesh position={[(halfW + 1) * CELL_SIZE, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, (maze.height + 2) * CELL_SIZE]} />
          {wallMaterial}
        </mesh>
        <mesh position={[-(halfW + 1) * CELL_SIZE, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, (maze.height + 2) * CELL_SIZE]} />
          {wallMaterial}
        </mesh>
      </group>
    </group>
  );
};