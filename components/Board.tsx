import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MazeData, Theme } from '../types.ts';
import { CELL_SIZE, WALL_HEIGHT } from '../constants.ts';

interface BoardProps {
  maze: MazeData;
  tilt: { x: number, z: number };
  theme: Theme;
}

/**
 * Greedy Meshing Algorithm
 * Combines adjacent 1x1 wall cells into the largest possible rectangular blocks
 * to eliminate shutlines and reduce face count.
 */
const calculateMergedWalls = (maze: MazeData) => {
  const { grid, width, height } = maze;
  const visited = Array(height).fill(0).map(() => Array(width).fill(false));
  const rects: { x: number, z: number, w: number, h: number }[] = [];

  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      if (grid[z][x] === 1 && !visited[z][x]) {
        let w = 1;
        while (x + w < width && grid[z][x + w] === 1 && !visited[z][x + w]) {
          w++;
        }

        let h = 1;
        let canExpandH = true;
        while (z + h < height && canExpandH) {
          for (let k = 0; k < w; k++) {
            if (grid[z + h][x + k] !== 1 || visited[z + h][x + k]) {
              canExpandH = false;
              break;
            }
          }
          if (canExpandH) h++;
        }

        for (let hz = 0; hz < h; hz++) {
          for (let wx = 0; wx < w; wx++) {
            visited[z + hz][x + wx] = true;
          }
        }

        rects.push({ x, z, w, h });
      }
    }
  }
  return rects;
};

const useWorldSpaceMaterial = (texture: THREE.Texture | null, color: string, isMetal: boolean) => {
  return useMemo(() => {
    if (!texture) return new THREE.MeshStandardMaterial({ color: '#111111' });

    const material = isMetal 
      ? new THREE.MeshStandardMaterial({ 
          color: '#888888', 
          roughness: 0.05, 
          metalness: 1.0, 
          envMapIntensity: 3.5 
        })
      : new THREE.MeshPhysicalMaterial({
          map: texture,
          color: color,
          roughness: 0.12,
          metalness: 0.1,
          envMapIntensity: 4.5,
          clearcoat: 1.0,
          clearcoatRoughness: 0.02,
          reflectivity: 1.0,
          ior: 1.6,
        });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uWorldScale = { value: 0.15 };
      
      shader.vertexShader = `
        varying vec3 vWorldPosition;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldPosition = worldPosition.xyz;
        `
      );

      shader.fragmentShader = `
        varying vec3 vWorldPosition;
        uniform float uWorldScale;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #ifdef USE_MAP
          vec4 sampledDiffuseColor = texture2D(map, vWorldPosition.xz * uWorldScale);
          diffuseColor *= sampledDiffuseColor;
        #endif
        `
      );
    };

    material.customProgramCacheKey = () => (isMetal ? 'metal-maze-v3' : 'wood-maze-v3');
    return material;
  }, [texture, color, isMetal]);
};

const useWoodTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.lineWidth = 4;
    for (let i = 0; i < 80; i++) {
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      const x = (i / 80) * 1400 - 200;
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 150, 300, x - 150, 700, x, 1024);
      ctx.globalAlpha = 0.04 + Math.random() * 0.08;
      ctx.stroke();
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < 150; i++) {
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      const x = Math.random() * 1024;
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.random() - 0.5) * 60, 1024);
      ctx.globalAlpha = 0.03;
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 16;
    return tex;
  }, []);
};

const RipplingFlag: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const flagWidth = 0.8;

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const positionAttribute = meshRef.current.geometry.getAttribute('position');

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const multiplier = Math.pow((x + flagWidth / 2) / flagWidth, 1.8);
      const ripple = Math.sin(x * 8 - time * 6) * 0.12 * multiplier;
      const flutter = Math.sin(time * 15 + x * 25) * 0.02 * multiplier;
      const verticalRipple = Math.cos(y * 6 + time * 3) * 0.03 * multiplier;
      positionAttribute.setZ(i, ripple + flutter + verticalRipple);
    }
    positionAttribute.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} position={[flagWidth / 2, 1.7, 0]} castShadow>
      <planeGeometry args={[flagWidth, 0.5, 32, 16]} />
      <meshStandardMaterial 
        color="#ef4444" 
        emissive="#7f1d1d" 
        emissiveIntensity={0.4} 
        side={THREE.DoubleSide}
        roughness={0.4}
      />
    </mesh>
  );
};

const TargetHole: React.FC = () => {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 4) + 1) / 2;
      glowRef.current.scale.setScalar(1 + pulse * 0.1);
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0 + pulse * 2.0;
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
      
      <mesh ref={glowRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.6, 32]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#fbbf24" 
          emissiveIntensity={1.5} 
          transparent 
          opacity={0.8}
        />
      </mesh>

      <mesh ref={ringRef} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.65, 64]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} transparent opacity={0.4} />
      </mesh>

      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 2.2, 8]} />
        <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
      </mesh>
      
      <RipplingFlag />
    </group>
  );
};

export const Board: React.FC<BoardProps> = ({ maze, tilt, theme }) => {
  const halfW = (maze.width - 1) / 2;
  const halfH = (maze.height - 1) / 2;
  const woodTexture = useWoodTexture();
  const isMetal = theme === Theme.METAL;
  const wallColor = isMetal ? "#aaaaaa" : "#3d2b1f";
  
  const wallMaterial = useWorldSpaceMaterial(woodTexture, wallColor, isMetal);

  const combinedGeometry = useMemo(() => {
    const rects = calculateMergedWalls(maze);
    const geometries: THREE.BoxGeometry[] = [];

    rects.forEach(r => {
      const geo = new THREE.BoxGeometry(r.w * CELL_SIZE, WALL_HEIGHT, r.h * CELL_SIZE);
      const posX = (r.x + r.w / 2 - 0.5 - halfW) * CELL_SIZE;
      const posZ = (r.z + r.h / 2 - 0.5 - halfH) * CELL_SIZE;
      geo.translate(posX, WALL_HEIGHT / 2 + 0.003, posZ);
      geometries.push(geo);
    });

    const bTop = new THREE.BoxGeometry((maze.width + 2) * CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    bTop.translate(0, WALL_HEIGHT / 2 + 0.003, -(halfH + 1) * CELL_SIZE);
    
    const bBottom = new THREE.BoxGeometry((maze.width + 2) * CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    bBottom.translate(0, WALL_HEIGHT / 2 + 0.003, (halfH + 1) * CELL_SIZE);
    
    const bLeft = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, (maze.height + 2) * CELL_SIZE);
    bLeft.translate(-(halfW + 1) * CELL_SIZE, WALL_HEIGHT / 2 + 0.003, 0);
    
    const bRight = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, (maze.height + 2) * CELL_SIZE);
    bRight.translate((halfW + 1) * CELL_SIZE, WALL_HEIGHT / 2 + 0.003, 0);

    geometries.push(bTop, bBottom, bLeft, bRight);

    const merged = BufferGeometryUtils.mergeGeometries(geometries);
    geometries.forEach(g => g.dispose());
    
    return merged;
  }, [maze, halfW, halfH]);

  return (
    <group rotation={[tilt.x, 0, tilt.z]}>
      <mesh receiveShadow position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[maze.width * CELL_SIZE, maze.height * CELL_SIZE]} />
        {isMetal ? (
          <MeshReflectorMaterial
            blur={[256, 128]}
            resolution={512}
            mixBlur={1}
            mixStrength={60}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#080808"
            metalness={0.7}
            mirror={0.9}
            transparent={false}
          />
        ) : (
          <meshStandardMaterial 
            map={woodTexture} 
            color="#4a3228"
            roughness={0.45} 
            metalness={0.0} 
          />
        )}
      </mesh>

      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[maze.width * CELL_SIZE, 0.2, maze.height * CELL_SIZE]} />
        <meshStandardMaterial color={isMetal ? "#111111" : "#1b1109"} roughness={0.9} />
      </mesh>

      <TargetHole />

      <mesh 
        geometry={combinedGeometry} 
        material={wallMaterial} 
        castShadow 
        receiveShadow 
      />
    </group>
  );
};
