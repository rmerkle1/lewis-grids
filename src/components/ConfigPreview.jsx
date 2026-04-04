/**
 * Small SVG preview of a central-atom configuration.
 * Uses full-size polygon coordinates then scales via viewBox.
 */
import {
  getPolygonRadius,
  getPolygonVertices,
  getEdgeMidpoints,
  polygonPointsStr,
  getBondSquarePositions,
  BOND_SQUARE_SIZE,
} from '../utils/geometry';

const FULL_CX = 120;
const FULL_CY = 120;
const PREVIEW_PX = 72;

export default function ConfigPreview({ domains, bondPattern, color }) {
  const polyN = domains === 2 ? 4 : domains;
  const R = getPolygonRadius(polyN);
  const vertices = getPolygonVertices(FULL_CX, FULL_CY, R, polyN);
  const edgeMidpoints = getEdgeMidpoints(FULL_CX, FULL_CY, vertices);
  const pointsStr = polygonPointsStr(vertices);

  const margin = BOND_SQUARE_SIZE + 6;
  const minX = FULL_CX - R - margin;
  const minY = FULL_CY - R - margin;
  const span = (R + margin) * 2;

  return (
    <svg
      width={PREVIEW_PX}
      height={PREVIEW_PX}
      viewBox={`${minX} ${minY} ${span} ${span}`}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <polygon
        points={pointsStr}
        fill={color || '#555'}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
        opacity="0.88"
      />

      {edgeMidpoints.map((edge) => {
        const bondOrder = bondPattern[edge.edgeIndex];
        if (!bondOrder) return null;
        const positions = getBondSquarePositions(edge.x, edge.y, edge.angle, bondOrder);
        return positions.map((pos, si) => (
          <rect
            key={`${edge.edgeIndex}-${si}`}
            x={pos.cx - BOND_SQUARE_SIZE / 2}
            y={pos.cy - BOND_SQUARE_SIZE / 2}
            width={BOND_SQUARE_SIZE}
            height={BOND_SQUARE_SIZE}
            fill="rgba(255,255,255,0.88)"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="0.8"
            rx="2"
            transform={`rotate(${pos.angleDeg}, ${pos.cx}, ${pos.cy})`}
          />
        ));
      })}
    </svg>
  );
}
