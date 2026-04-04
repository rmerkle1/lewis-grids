/**
 * Small SVG preview of a central-atom configuration.
 * Uses full-size coordinates internally, then scales via viewBox.
 */
import {
  getPolygonRadius,
  getPolygonVertices,
  getEdgeMidpoints,
  polygonPointsStr,
  getBondSquarePositions,
  BOND_SQUARE_SIZE,
  EDGE_LENGTH,
} from '../utils/geometry';

// Full-size polygon centered at (FULL_CX, FULL_CY)
const FULL_CX = 120;
const FULL_CY = 120;
const PREVIEW_PX = 72; // rendered pixel size

export default function ConfigPreview({ domains, bondPattern, color }) {
  const polyN = domains === 2 ? 4 : domains;
  const R = getPolygonRadius(polyN);
  const vertices = getPolygonVertices(FULL_CX, FULL_CY, R, polyN);
  const edgeMidpoints = getEdgeMidpoints(FULL_CX, FULL_CY, vertices);
  const pointsStr = polygonPointsStr(vertices);

  // Compute tight bounding box around polygon + bond squares
  const margin = BOND_SQUARE_SIZE + 4;
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
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        opacity="0.88"
      />

      {edgeMidpoints.map((edge) => {
        const bondOrder = bondPattern[edge.edgeIndex];
        if (!bondOrder) return null;

        return getBondSquarePositions(edge.x, edge.y, edge.angle, bondOrder).map((pos, si) => (
          <rect
            key={`${edge.edgeIndex}-${si}`}
            x={pos.x}
            y={pos.y}
            width={BOND_SQUARE_SIZE}
            height={BOND_SQUARE_SIZE}
            fill="rgba(255,255,255,0.88)"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="0.8"
            rx="1.5"
          />
        ));
      })}
    </svg>
  );
}
