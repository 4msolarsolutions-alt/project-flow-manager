import { useRef } from "react";
import * as THREE from "three";

interface Panel3DProps {
  position: [number, number, number];
  width: number;
  height: number;
  tiltAngle: number;
  orientation: "landscape" | "portrait";
  selected?: boolean;
  onClick?: () => void;
}

export function Panel3D({
  position,
  width,
  height,
  tiltAngle,
  orientation,
  selected = false,
  onClick,
}: Panel3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const panelW = orientation === "landscape" ? width : height;
  const panelH = orientation === "landscape" ? height : width;
  const tiltRad = (tiltAngle * Math.PI) / 180;

  // Frame thickness
  const frameT = 0.04;
  const frameDepth = 0.035;
  const panelThickness = 0.025;

  return (
    <group position={position}>
      {/* Mounting rail / base */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[panelW * 0.9, 0.03, 0.04]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Support legs */}
      {[-panelW * 0.35, panelW * 0.35].map((xOff, i) => (
        <group key={`leg-${i}`}>
          {/* Back leg (taller) */}
          <mesh position={[xOff, Math.sin(tiltRad) * panelH * 0.4, -panelH * 0.35]} castShadow>
            <boxGeometry args={[0.03, Math.sin(tiltRad) * panelH * 0.8 + 0.1, 0.03]} />
            <meshStandardMaterial color="#777" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Front leg (shorter) */}
          <mesh position={[xOff, 0.05, panelH * 0.35]} castShadow>
            <boxGeometry args={[0.03, 0.1, 0.03]} />
            <meshStandardMaterial color="#777" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Solar panel - tilted */}
      <group
        position={[0, 0.1 + Math.sin(tiltRad) * panelH * 0.25, 0]}
        rotation={[-tiltRad, 0, 0]}
      >
        {/* Aluminium frame */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[panelW + frameT, frameDepth, panelH + frameT]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Glass surface (top) */}
        <mesh
          ref={meshRef}
          position={[0, frameDepth / 2 + 0.001, 0]}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <boxGeometry args={[panelW - 0.01, panelThickness, panelH - 0.01]} />
          <meshPhysicalMaterial
            color={selected ? "#2196F3" : "#0a1a3a"}
            metalness={0.15}
            roughness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.05}
            reflectivity={0.9}
            envMapIntensity={1.2}
            emissive={selected ? "#1565C0" : "#000815"}
            emissiveIntensity={selected ? 0.4 : 0.05}
          />
        </mesh>

        {/* Cell grid lines (subtle) */}
        <mesh position={[0, frameDepth / 2 + panelThickness / 2 + 0.002, 0]}>
          <boxGeometry args={[panelW * 0.96, 0.001, panelH * 0.96]} />
          <meshStandardMaterial
            color="#0D2F6B"
            metalness={0.3}
            roughness={0.4}
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* Horizontal cell lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const zPos = -panelH * 0.4 + (panelH * 0.8 / 5) * (i + 1);
          return (
            <mesh key={`hline-${i}`} position={[0, frameDepth / 2 + panelThickness / 2 + 0.003, zPos]}>
              <boxGeometry args={[panelW * 0.92, 0.001, 0.003]} />
              <meshStandardMaterial color="#888" transparent opacity={0.2} />
            </mesh>
          );
        })}

        {/* Vertical cell lines */}
        {Array.from({ length: 9 }).map((_, i) => {
          const xPos = -panelW * 0.42 + (panelW * 0.84 / 9) * (i + 1);
          return (
            <mesh key={`vline-${i}`} position={[xPos, frameDepth / 2 + panelThickness / 2 + 0.003, 0]}>
              <boxGeometry args={[0.003, 0.001, panelH * 0.92]} />
              <meshStandardMaterial color="#888" transparent opacity={0.15} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
