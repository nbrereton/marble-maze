import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MARBLE_RADIUS } from '../constants';
import { GameState, MazeData, MarbleColor } from '../types';

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
  [MarbleColor.RED]: { color: '#ff0000', emissive: '#aa0000' },
  [MarbleColor.GREEN]: { color: '#00ff00', emissive: '#005500' },
  [MarbleColor.YELLOW]: { color: '#ffff00', emissive: '#ffaa00' },
  [MarbleColor.BLUE]: { color: '#0088ff', emissive: '#0022aa' },
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

    // Demo Mode Logic: Proportional Steering
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
          
          setTilt({ 
            x: steerZ * maxAutoTilt, 
            z: -steerX * maxAutoTilt 
          });
        }
      }
    }

    // Apply gravity
    vel.current.x += Math.sin(-tilt.z) * gravity;
    vel.current.z += Math.sin(tilt.x) * gravity;
    vel.current.multiplyScalar(friction);

    const nextPos = pos.current.clone().add(vel.current);

    const checkWall = (px: number, pz: number) => {
      const gx = Math.round(px + halfW);
      const gz = Math.round(pz + halfH);
      if (gx < 0 || gx >= maze.width || gz < 0 || gz >= maze.height) return true;
      return maze.grid[gz][gx] === 1;
    };

    const padding = MARBLE_RADIUS * 0.7;
    
    // Victory / Fall check: If very close to the center (hole is at 0,0)
    const distToCenter = Math.sqrt(pos.current.x ** 2 + pos.current.z ** 2);
    if (distToCenter < 0.42) {
      // If marble is physically over the hole, drop it!
      if (distToCenter < 0.38) {
        setFalling(true);
        vel.current.set(0, 0, 0); // Stop horizontal sliding to drop straight down
        onVictory();
        return;
      }
    }

    // Wall Collisions
    if (checkWall(nextPos.x + (vel.current.x > 0 ? padding : -padding), pos.current.z)) {
      vel.current.x *= -0.3;
    } else {
      pos.current.x = nextPos.x;
    }

    if (checkWall(pos.current.x, nextPos.z + (vel.current.z > 0 ? padding : -padding))) {
      vel.current.z *= -0.3;
    } else {
      pos.current.z = nextPos.z;
    }

    if (meshRef.current) {
      meshRef.current.position.set(pos.current.x, MARBLE_RADIUS, pos.current.z);
      // Rotation for the inner core to simulate rolling
      const innerCore = meshRef.current.children[1] as THREE.Mesh;
      if (innerCore) {
        innerCore.rotation.z -= vel.current.x / MARBLE_RADIUS;
        innerCore.rotation.x += vel.current.z / MARBLE_RADIUS;
      }
      // Outer shell rolling
      const outerShell = meshRef.current.children[0] as THREE.Mesh;
      if (outerShell) {
        outerShell.rotation.z -= vel.current.x / MARBLE_RADIUS;
        outerShell.rotation.x += vel.current.z / MARBLE_RADIUS;
      }
    }
  });

  // Falling animation logic
  useFrame((state, delta) => {
    if (falling && meshRef.current) {
      meshRef.current.position.y -= delta * 4; // Fall into the hole
      meshRef.current.scale.multiplyScalar(0.96); // Shrink out of existence
    }
  });

  return (
    <group ref={meshRef} position={[position.x, MARBLE_RADIUS, position.z]}>
      {/* Outer Shell - Shiny and translucent */}
      <mesh castShadow>
        <sphereGeometry args={[MARBLE_RADIUS, 32, 32]} />
        <meshPhysicalMaterial 
          roughness={0.0} // Perfect specular surface
          transmission={0.45} 
          thickness={1.5} 
          envMapIntensity={3.5}
          color="#ffffff"
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          ior={1.45}
          reflectivity={1.0}
        />
      </mesh>
      {/* Internal Core - Saturated color */}
      <mesh>
        <torusKnotGeometry args={[MARBLE_RADIUS * 0.55, 0.04, 64, 8]} />
        <meshStandardMaterial 
          color={colors.color} 
          emissive={colors.emissive} 
          emissiveIntensity={2.0} 
          roughness={0.3}
        />
      </mesh>
      
      {/* Subtle Contact Shadow - Follows marble position on the floor */}
      {!falling && (
        <mesh position={[0, -MARBLE_RADIUS + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[MARBLE_RADIUS * 1.1, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
};