import { useRef } from "react";
import * as THREE from "three";

interface Panel3DProps {
  position: [number, number, number];
  width: number;
  height: number;
  tiltAngle: number; // degrees
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

  return (
    <group position={position}>
      {/* Panel frame/mount legs */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[panelW, 0.04, panelH]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Solar panel surface */}
      <mesh
        ref={meshRef}
        position={[0, 0.15 + Math.sin(tiltRad) * panelH * 0.25, 0]}
        rotation={[-tiltRad, 0, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <boxGeometry args={[panelW, 0.03, panelH]} />
        <meshStandardMaterial
          color={selected ? "#4FC3F7" : "#1565C0"}
          metalness={0.6}
          roughness={0.2}
          emissive={selected ? "#1565C0" : "#000"}
          emissiveIntensity={selected ? 0.3 : 0}
        />
      </mesh>

      {/* Panel cell grid lines */}
      <mesh
        position={[0, 0.17 + Math.sin(tiltRad) * panelH * 0.25, 0]}
        rotation={[-tiltRad, 0, 0]}
      >
        <boxGeometry args={[panelW * 0.98, 0.001, panelH * 0.98]} />
        <meshStandardMaterial
          color="#0D47A1"
          metalness={0.4}
          roughness={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}
