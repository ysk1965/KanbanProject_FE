import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Environment, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const TaskBlock: React.FC<{ position: [number, number, number]; color: string; delay?: number; isEmissive?: boolean }> = ({ position, color, delay = 0, isEmissive = false }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime() + delay;
      ref.current.position.y = position[1] + Math.sin(t * 1.2) * 0.1;
      ref.current.rotation.x = Math.sin(t * 0.4) * 0.1;
      ref.current.rotation.z = Math.cos(t * 0.4) * 0.1;
    }
  });

  return (
    <group position={position}>
      <Box ref={ref} args={[0.6, 0.4, 0.15]}>
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.1}
          emissive={isEmissive ? color : "#000000"}
          emissiveIntensity={isEmissive ? 1.2 : 0}
        />
      </Box>
      <Sphere args={[0.05, 8, 8]} position={[0, -0.4, 0]}>
        <meshStandardMaterial color="#818CF8" emissive="#818CF8" emissiveIntensity={2} />
      </Sphere>
    </group>
  );
};

const DataPacket: React.FC<{ start: THREE.Vector3; end: THREE.Vector3; delay: number }> = ({ start, end, delay }) => {
  const ref = useRef<THREE.Mesh>(null);
  const direction = useMemo(() => new THREE.Vector3().subVectors(end, start), [start, end]);

  useFrame((state) => {
    if (ref.current) {
      const duration = 2.5;
      const progress = ((state.clock.getElapsedTime() + delay) % duration) / duration;
      ref.current.position.copy(start).addScaledVector(direction, progress);
      const opacity = Math.sin(progress * Math.PI) * 0.8;
      if (ref.current.material instanceof THREE.MeshStandardMaterial) {
        ref.current.material.opacity = opacity;
      }
    }
  });

  return (
    <Sphere ref={ref} args={[0.04, 12, 12]}>
      <meshStandardMaterial color="#2DD4BF" emissive="#2DD4BF" emissiveIntensity={8} transparent />
    </Sphere>
  );
};

const ConnectionLine: React.FC<{ start: [number, number, number]; end: [number, number, number]; color?: string }> = ({ start, end, color = "#6366F1" }) => {
  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector3(...start),
      new THREE.Vector3(...end)
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [start, end]);

  // Fix: Use 'line' as any to avoid conflict with SVG line element in JSX
  const LineComponent = 'line' as any;

  return (
    <LineComponent geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.4} />
    </LineComponent>
  );
};

const BridgePath = () => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.08) * 0.05;
    }
  });

  const nodes: [number, number, number][] = [
    [-4.5, -0.5, 0],
    [-2.2, -0.5, 0.6],
    [0, -0.5, 0],
    [2.2, -0.5, -0.6],
    [4.5, -0.5, 0]
  ];

  const nodeVectors = useMemo(() => nodes.map(n => new THREE.Vector3(...n)), []);

  return (
    <group ref={ref}>
      {nodes.map((node, i) => {
        if (i === nodes.length - 1) return (
          <Box key={`end-${i}`} args={[0.15, 0.15, 0.15]} position={node}>
             <meshStandardMaterial color="#818CF8" emissive="#818CF8" emissiveIntensity={2} />
          </Box>
        );
        const next = nodes[i + 1];
        return (
          <group key={i}>
            <ConnectionLine start={node} end={next} color="#818CF8" />
            <DataPacket start={nodeVectors[i]} end={nodeVectors[i+1]} delay={i * 0.8} />
            <DataPacket start={nodeVectors[i]} end={nodeVectors[i+1]} delay={i * 0.8 + 1.25} />
            <Box args={[0.15, 0.15, 0.15]} position={node}>
               <meshStandardMaterial color="#818CF8" emissive="#818CF8" emissiveIntensity={2} />
            </Box>
          </group>
        );
      })}

      <TaskBlock position={[-4.5, 0.2, 0]} color="#1E293B" delay={0} />
      <TaskBlock position={[-2.2, 0.5, 0.6]} color="#6366F1" delay={1} isEmissive />
      <TaskBlock position={[0, 0.4, 0]} color="#4F46E5" delay={2} isEmissive />
      <TaskBlock position={[2.2, 0.6, -0.6]} color="#2DD4BF" delay={3} isEmissive />
      <TaskBlock position={[4.5, 0.3, 0]} color="#0D9488" delay={4} />

      <ConnectionLine start={[-4.5, -0.5, 0]} end={[-4.5, 0.2, 0]} />
      <ConnectionLine start={[-2.2, -0.5, 0.6]} end={[-2.2, 0.5, 0.6]} />
      <ConnectionLine start={[0, -0.5, 0]} end={[0, 0.4, 0]} />
      <ConnectionLine start={[2.2, -0.5, -0.6]} end={[2.2, 0.6, -0.6]} />
      <ConnectionLine start={[4.5, -0.5, 0]} end={[4.5, 0.3, 0]} />
    </group>
  );
};

export const HeroScene: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-100 pointer-events-none bg-[#0A0E17]">
      <Canvas camera={{ position: [0, 1.2, 8.5], fov: 42 }}>
        <fog attach="fog" args={['#0A0E17', 7, 22]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#818CF8" />
        <spotLight position={[-10, 10, 10]} angle={0.2} penumbra={1} intensity={1.2} color="#2DD4BF" />

        <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.1}>
          <BridgePath />
        </Float>

        <Stars radius={120} depth={60} count={2500} factor={5} saturation={0.5} fade speed={0.8} />
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export const KanbanScene: React.FC = () => {
  return (
    <div className="w-full h-full absolute inset-0 bg-[#0F172A]">
      <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <Environment preset="night" />
        <Float rotationIntensity={0.4} floatIntensity={0.2} speed={1}>
           <group position={[0, -0.2, 0]}>
             <Box args={[1, 0.05, 1]} position={[-1.2, -0.5, 0]}>
                <meshStandardMaterial color="#1E293B" metalness={1} roughness={0} />
             </Box>
             <Box args={[1, 0.05, 1]} position={[0, -0.5, 0]}>
                <meshStandardMaterial color="#1E293B" metalness={1} roughness={0} />
             </Box>
             <Box args={[1, 0.05, 1]} position={[1.2, -0.5, 0]}>
                <meshStandardMaterial color="#1E293B" metalness={1} roughness={0} />
             </Box>

             <TaskBlock position={[-1.2, 0, 0]} color="#475569" />
             <TaskBlock position={[0, 0.3, 0]} color="#6366F1" isEmissive />
             <TaskBlock position={[1.2, 0.6, 0]} color="#2DD4BF" isEmissive />
           </group>
        </Float>
      </Canvas>
    </div>
  );
};

export default HeroScene;
