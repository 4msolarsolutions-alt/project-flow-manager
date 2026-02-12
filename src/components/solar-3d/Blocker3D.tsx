import { useState, useRef, useCallback } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export type BlockerType = "water_tank" | "lift_room" | "chimney" | "vent" | "custom";

interface Blocker3DProps {
  position: [number, number, number];
  size: [number, number, number];
  type: BlockerType;
  label?: string;
  onRemove?: () => void;
  onPositionChange?: (newPosition: [number, number, number]) => void;
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

export function Blocker3D({ position, size, type, label, onRemove, onPositionChange }: Blocker3DProps) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const color = BLOCKER_COLORS[type];
  const { camera, gl, raycaster } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const offsetRef = useRef(new THREE.Vector3());
  const intersectPoint = useRef(new THREE.Vector3());

  const getPlaneIntersect = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(planeRef.current, intersectPoint.current);
    return intersectPoint.current.clone();
  }, [camera, gl, raycaster]);

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    if (e.button === 2) return; // ignore right-click
    setDragging(true);
    gl.domElement.style.cursor = "grabbing";
    // Calculate offset between click point and object position
    const point = getPlaneIntersect(e);
    offsetRef.current.set(position[0] - point.x, 0, position[2] - point.z);
    (e.target as any)?.setPointerCapture?.(e.pointerId);
  }, [gl, position, getPlaneIntersect]);

  const handlePointerMove = useCallback((e: any) => {
    if (!dragging || !onPositionChange) return;
    e.stopPropagation();
    const point = getPlaneIntersect(e);
    const newX = point.x + offsetRef.current.x;
    const newZ = point.z + offsetRef.current.z;
    onPositionChange([newX, position[1], newZ]);
  }, [dragging, onPositionChange, position, getPlaneIntersect]);

  const handlePointerUp = useCallback((e: any) => {
    if (dragging) {
      e.stopPropagation();
      setDragging(false);
      gl.domElement.style.cursor = "auto";
    }
  }, [dragging, gl]);

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); gl.domElement.style.cursor = "grab"; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); if (!dragging) gl.domElement.style.cursor = "auto"; }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {type === "water_tank" ? (
          <cylinderGeometry args={[size[0] / 2, size[0] / 2, size[1], 16]} />
        ) : (
          <boxGeometry args={size} />
        )}
        <meshStandardMaterial
          color={dragging ? "#fff176" : color}
          roughness={0.6}
          metalness={0.2}
          transparent
          opacity={dragging ? 0.6 : hovered ? 0.7 : 0.85}
        />
      </mesh>
      {hovered && !dragging && (
        <Html position={[0, size[1] / 2 + 0.3, 0]} center>
          <div className="bg-background/90 text-foreground px-2 py-1 rounded text-xs shadow-lg whitespace-nowrap border border-border">
            {label || BLOCKER_LABELS[type]}
            <span className="ml-1 text-muted-foreground">(drag to move)</span>
            {onRemove && <span className="ml-1 text-destructive cursor-pointer" onClick={(e) => { e.stopPropagation(); onRemove(); }}>(×)</span>}
          </div>
        </Html>
      )}
    </group>
  );
}
