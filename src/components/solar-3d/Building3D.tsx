import { useMemo } from "react";
import * as THREE from "three";

interface Building3DProps {
  polygon: { x: number; z: number }[];
  buildingHeight?: number;
  parapetHeight?: number;
  roofThickness?: number;
}

/**
 * Realistic building extrusion with walls, parapet, and flat roof slab.
 */
export function Building3D({
  polygon,
  buildingHeight = 6,
  parapetHeight = 0.9,
  roofThickness = 0.15,
}: Building3DProps) {
  // Wall geometry: extrude polygon shape vertically
  const wallGeometry = useMemo(() => {
    if (polygon.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(polygon[0].x, polygon[0].z);
    for (let i = 1; i < polygon.length; i++) {
      shape.lineTo(polygon[i].x, polygon[i].z);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: buildingHeight,
      bevelEnabled: false,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -buildingHeight, 0);
    return geo;
  }, [polygon, buildingHeight]);

  // Roof slab
  const roofGeometry = useMemo(() => {
    if (polygon.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(polygon[0].x, polygon[0].z);
    for (let i = 1; i < polygon.length; i++) {
      shape.lineTo(polygon[i].x, polygon[i].z);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: roofThickness,
      bevelEnabled: false,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [polygon, roofThickness]);

  // Parapet walls: create thin extrusions along each edge
  const parapetGeometries = useMemo(() => {
    if (polygon.length < 3 || parapetHeight <= 0) return [];
    const geos: THREE.BufferGeometry[] = [];
    const wallThickness = 0.15;

    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      if (length < 0.01) continue;

      const angle = Math.atan2(dz, dx);
      const cx = (a.x + b.x) / 2;
      const cz = (a.z + b.z) / 2;

      const geo = new THREE.BoxGeometry(length, parapetHeight, wallThickness);
      const matrix = new THREE.Matrix4();
      matrix.makeRotationY(-angle);
      matrix.setPosition(cx, roofThickness + parapetHeight / 2, cz);

      const rotMatrix = new THREE.Matrix4().makeRotationY(-angle);
      const posMatrix = new THREE.Matrix4().makeTranslation(cx, roofThickness + parapetHeight / 2, cz);
      geo.applyMatrix4(rotMatrix);
      geo.translate(cx - geo.boundingBox?.min.x! + (cx - length / 2 * Math.cos(angle)), 0, 0);

      // Simpler approach: position via group
      const simpleGeo = new THREE.BoxGeometry(length + wallThickness, parapetHeight, wallThickness);
      geos.push({ geo: simpleGeo, cx, cz, angle, length } as any);
    }
    return geos;
  }, [polygon, parapetHeight, roofThickness]);

  if (!wallGeometry || !roofGeometry) return null;

  return (
    <group>
      {/* Building walls */}
      <mesh geometry={wallGeometry} receiveShadow castShadow>
        <meshStandardMaterial
          color="#d4c5a9"
          roughness={0.85}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Roof slab */}
      <mesh geometry={roofGeometry} receiveShadow castShadow>
        <meshStandardMaterial
          color="#a0937d"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Parapet walls along each edge */}
      {polygon.length >= 3 && polygon.map((_, i) => {
        const a = polygon[i];
        const b = polygon[(i + 1) % polygon.length];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        if (length < 0.01) return null;

        const angle = Math.atan2(dx, dz);
        const cx = (a.x + b.x) / 2;
        const cz = (a.z + b.z) / 2;

        return (
          <mesh
            key={`parapet-${i}`}
            position={[cx, roofThickness + parapetHeight / 2, cz]}
            rotation={[0, angle, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.15, parapetHeight, length]} />
            <meshStandardMaterial
              color="#c4b89a"
              roughness={0.8}
              metalness={0.05}
            />
          </mesh>
        );
      })}
    </group>
  );
}
