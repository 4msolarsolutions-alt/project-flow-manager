import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

interface SunPath3DProps {
  hour: number;
  latitude: number;
  dayOfYear: number;
  sceneRadius: number;
  castShadows?: boolean;
}

function getSunPosition(hour: number, latitude: number, dayOfYear: number, radius: number) {
  const latRad = (latitude * Math.PI) / 180;
  const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
  const declRad = (declination * Math.PI) / 180;

  const hourAngle = ((hour - 12) * 15 * Math.PI) / 180;

  const altitude = Math.asin(
    Math.sin(latRad) * Math.sin(declRad) +
    Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourAngle)
  );

  const cosAz = (Math.sin(declRad) - Math.sin(altitude) * Math.sin(latRad)) / (Math.cos(altitude) * Math.cos(latRad));
  const azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * (hour < 12 ? -1 : 1);

  const x = radius * Math.cos(altitude) * Math.sin(azimuth);
  const y = radius * Math.sin(altitude);
  const z = -radius * Math.cos(altitude) * Math.cos(azimuth);

  return { x, y: Math.max(y, 0.5), z, altitude, azimuth };
}

export { getSunPosition };

export function SunPath3D({ hour, latitude, dayOfYear, sceneRadius, castShadows = true }: SunPath3DProps) {
  const sunPos = useMemo(
    () => getSunPosition(hour, latitude, dayOfYear, sceneRadius),
    [hour, latitude, dayOfYear, sceneRadius]
  );

  const pathPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    for (let h = 5; h <= 19; h += 0.25) {
      const pos = getSunPosition(h, latitude, dayOfYear, sceneRadius);
      if (pos.y > 0) {
        points.push([pos.x, pos.y, pos.z]);
      }
    }
    return points;
  }, [latitude, dayOfYear, sceneRadius]);

  const shadowMapSize = Math.min(4096, sceneRadius > 30 ? 4096 : 2048);

  return (
    <group>
      {/* Sun glow */}
      <mesh position={[sunPos.x, sunPos.y, sunPos.z]}>
        <sphereGeometry args={[sceneRadius * 0.05, 32, 32]} />
        <meshBasicMaterial color="#FFF176" />
      </mesh>
      {/* Sun halo */}
      <mesh position={[sunPos.x, sunPos.y, sunPos.z]}>
        <sphereGeometry args={[sceneRadius * 0.09, 16, 16]} />
        <meshBasicMaterial color="#FFF9C4" transparent opacity={0.25} />
      </mesh>

      {/* Directional light from sun */}
      <directionalLight
        position={[sunPos.x, sunPos.y, sunPos.z]}
        intensity={1.8}
        castShadow={castShadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-far={sceneRadius * 5}
        shadow-camera-left={-sceneRadius * 2}
        shadow-camera-right={sceneRadius * 2}
        shadow-camera-top={sceneRadius * 2}
        shadow-camera-bottom={-sceneRadius * 2}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        color="#FFF3E0"
      />

      {/* Fill light (sky bounce) */}
      <hemisphereLight
        args={["#87CEEB", "#4a7c59", 0.3]}
      />

      {/* Sun path arc */}
      {pathPoints.length > 2 && (
        <Line
          points={pathPoints}
          color="#FFD54F"
          lineWidth={2}
          transparent
          opacity={0.4}
          dashed
          dashSize={0.4}
          gapSize={0.2}
        />
      )}

      {/* Hour markers along path */}
      {[6, 8, 10, 12, 14, 16, 18].map((h) => {
        const pos = getSunPosition(h, latitude, dayOfYear, sceneRadius * 0.95);
        if (pos.y <= 0) return null;
        return (
          <mesh key={h} position={[pos.x, pos.y, pos.z]}>
            <sphereGeometry args={[sceneRadius * 0.015, 8, 8]} />
            <meshBasicMaterial color="#FFB74D" transparent opacity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}
