import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

interface SunPath3DProps {
  /** Hour of day 6-18 */
  hour: number;
  /** Latitude for sun angle calculation */
  latitude: number;
  /** Day of year 1-365 */
  dayOfYear: number;
  /** Scene radius for sun distance */
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
  
  const azimuth = Math.atan2(
    -Math.cos(declRad) * Math.sin(hourAngle),
    Math.sin(altitude) * Math.sin(latRad) - Math.sin(declRad)
  ) / Math.cos(altitude);

  const x = radius * Math.cos(altitude) * Math.sin(azimuth);
  const y = radius * Math.sin(altitude);
  const z = radius * Math.cos(altitude) * Math.cos(azimuth);

  return { x, y: Math.max(y, 0.5), z, altitude, azimuth };
}

export function SunPath3D({ hour, latitude, dayOfYear, sceneRadius, castShadows = true }: SunPath3DProps) {
  const sunPos = useMemo(
    () => getSunPosition(hour, latitude, dayOfYear, sceneRadius),
    [hour, latitude, dayOfYear, sceneRadius]
  );

  // Generate sun path arc points
  const pathPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    for (let h = 6; h <= 18; h += 0.5) {
      const pos = getSunPosition(h, latitude, dayOfYear, sceneRadius);
      if (pos.y > 0) {
        points.push([pos.x, pos.y, pos.z]);
      }
    }
    return points;
  }, [latitude, dayOfYear, sceneRadius]);

  return (
    <group>
      {/* Sun sphere */}
      <mesh position={[sunPos.x, sunPos.y, sunPos.z]}>
        <sphereGeometry args={[sceneRadius * 0.06, 16, 16]} />
        <meshBasicMaterial color="#FDD835" />
      </mesh>

      {/* Directional light from sun */}
      <directionalLight
        position={[sunPos.x, sunPos.y, sunPos.z]}
        intensity={1.5}
        castShadow={castShadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={sceneRadius * 4}
        shadow-camera-left={-sceneRadius * 1.5}
        shadow-camera-right={sceneRadius * 1.5}
        shadow-camera-top={sceneRadius * 1.5}
        shadow-camera-bottom={-sceneRadius * 1.5}
        shadow-bias={-0.001}
        color="#FFF8E1"
      />

      {/* Sun path arc */}
      {pathPoints.length > 2 && (
        <Line
          points={pathPoints}
          color="#FDD835"
          lineWidth={1.5}
          transparent
          opacity={0.5}
          dashed
          dashSize={0.3}
          gapSize={0.2}
        />
      )}
    </group>
  );
}
