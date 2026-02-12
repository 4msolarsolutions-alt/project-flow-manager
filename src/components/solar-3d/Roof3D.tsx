import { useMemo } from "react";
import * as THREE from "three";

interface Roof3DProps {
  polygon: { x: number; z: number }[];
  height?: number;
  roofPitch?: number;
}

export function Roof3D({ polygon, height = 0.1, roofPitch = 0 }: Roof3DProps) {
  const geometry = useMemo(() => {
    if (polygon.length < 3) return null;

    // Create shape from polygon points
    const shape = new THREE.Shape();
    shape.moveTo(polygon[0].x, polygon[0].z);
    for (let i = 1; i < polygon.length; i++) {
      shape.lineTo(polygon[i].x, polygon[i].z);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
    });

    // Rotate to lay flat on XZ plane
    geo.rotateX(-Math.PI / 2);

    return geo;
  }, [polygon, height]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        color="#8B7355"
        roughness={0.8}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
