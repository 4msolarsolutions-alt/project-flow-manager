import { useState } from "react";
import { Html } from "@react-three/drei";

export type BlockerType = "water_tank" | "lift_room" | "chimney" | "vent" | "custom";

interface Blocker3DProps {
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  type: BlockerType;
  label?: string;
  onRemove?: () => void;
}

const BLOCKER_COLORS: Record<BlockerType, string> = {
  water_tank: "#29B6F6",
  lift_room: "#78909C",
  chimney: "#8D6E63",
  vent: "#A5D6A7",
  custom: "#FFB74D",
};

const BLOCKER_LABELS: Record<BlockerType, string> = {
  water_tank: "Water Tank",
  lift_room: "Lift Room",
  chimney: "Chimney",
  vent: "Vent",
  custom: "Obstacle",
};

export function Blocker3D({ position, size, type, label, onRemove }: Blocker3DProps) {
  const [hovered, setHovered] = useState(false);
  const color = BLOCKER_COLORS[type];

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.();
        }}
      >
        {type === "water_tank" ? (
          <cylinderGeometry args={[size[0] / 2, size[0] / 2, size[1], 16]} />
        ) : (
          <boxGeometry args={size} />
        )}
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.2}
          transparent
          opacity={hovered ? 0.7 : 0.85}
        />
      </mesh>
      {hovered && (
        <Html position={[0, size[1] / 2 + 0.3, 0]} center>
          <div className="bg-background/90 text-foreground px-2 py-1 rounded text-xs shadow-lg whitespace-nowrap border border-border">
            {label || BLOCKER_LABELS[type]}
            {onRemove && <span className="ml-1 text-destructive cursor-pointer">(click to remove)</span>}
          </div>
        </Html>
      )}
    </group>
  );
}
