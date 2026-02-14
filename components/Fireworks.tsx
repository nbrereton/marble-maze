
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 100;

const Firework: React.FC<{ position: THREE.Vector3; color: string }> = ({ position, color }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 0.08 + Math.random() * 0.15;
      
      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i * 3 + 2] = Math.cos(phi) * speed;
    }
    return { pos, vel };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const geometry = meshRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] += particles.vel[i * 3];
      positions[i * 3 + 1] += particles.vel[i * 3 + 1];
      positions[i * 3 + 2] += particles.vel[i * 3 + 2];
      particles.vel[i * 3 + 1] -= 0.003; // Gravity
    }
    geometry.attributes.position.needsUpdate = true;
    
    const material = meshRef.current.material;
    if (material && !Array.isArray(material)) {
      const pointsMat = material as THREE.PointsMaterial;
      if (pointsMat.opacity > 0) {
        pointsMat.opacity *= 0.985;
      }
    }
  });

  return (
    <points ref={meshRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={particles.pos}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        color={color} 
        size={0.15} 
        transparent 
        opacity={1} 
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const FireworksEffect: React.FC = () => {
  const [bursts, setBursts] = useState<{ id: number; pos: THREE.Vector3; color: string }[]>([]);
  const lastBurstTime = useRef(0);

  useFrame((state) => {
    if (state.clock.elapsedTime - lastBurstTime.current > 0.6) {
      const x = (Math.random() - 0.5) * 18;
      const y = 5 + Math.random() * 7;
      const z = (Math.random() - 0.5) * 12;
      const pos = new THREE.Vector3(x, y, z);
      
      const palette = ['#ff4444', '#44ff44', '#ffff44', '#ff44ff', '#44ffff', '#ffffff', '#ff9900'];
      const color = palette[Math.floor(Math.random() * palette.length)];
      
      setBursts((prev) => [...prev.slice(-8), { id: Date.now(), pos, color }]);
      lastBurstTime.current = state.clock.elapsedTime;
    }
  });

  return (
    <>
      {bursts.map((b) => (
        <Firework key={b.id} position={b.pos} color={b.color} />
      ))}
    </>
  );
};
