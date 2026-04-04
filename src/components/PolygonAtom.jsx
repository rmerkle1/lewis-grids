import {
  getPolygonRadius,
  getPolygonVertices,
  getEdgeMidpoints,
  polygonPointsStr,
  getBondSquarePositions,
  BOND_SQUARE_SIZE,
} from '../utils/geometry';

/**
 * Renders the central-atom polygon inside an SVG group.
 *
 * bondPattern: array of bond orders per edge (null = inactive/no bond indicator).
 *   For n=2 (linear), pass a 4-entry array for a square shape with nulls at edges 1 & 3.
 */
export default function PolygonAtom({
  cx, cy, n, element, color,
  bondPattern,
  occupiedEdges,
  snapHoverEdge,
}) {
  // For n=2 use a square (4-sided) with only edges 0 & 2 active
  const polyN = n === 2 ? 4 : n;
  const R = getPolygonRadius(polyN);
  const vertices = getPolygonVertices(cx, cy, R, polyN);
  const edgeMidpoints = getEdgeMidpoints(cx, cy, vertices);
  const pointsStr = polygonPointsStr(vertices);

  // Determine which edges are "active" bond sites
  const activeEdgeIndices = bondPattern
    .map((bo, i) => (bo !== null ? i : null))
    .filter((i) => i !== null);

  return (
    <g className="polygon-atom">
      {/* Polygon fill */}
      <polygon
        points={pointsStr}
        fill={color || '#444'}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="2"
        opacity="0.9"
      />

      {/* Element label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize="20"
        fontWeight="bold"
        fontFamily="Georgia, serif"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {element}
      </text>

      {/* Per-edge: snap indicator + bond squares */}
      {edgeMidpoints.map((edge) => {
        const bondOrder = bondPattern[edge.edgeIndex];
        if (bondOrder === null || bondOrder === undefined) return null;

        const occupied = occupiedEdges?.includes(edge.edgeIndex);
        const hovered = snapHoverEdge === edge.edgeIndex;

        // Extension line and dot
        const extLen = 22;
        const ex2 = edge.x + extLen * Math.cos(edge.angle);
        const ey2 = edge.y + extLen * Math.sin(edge.angle);

        const sqPositions = getBondSquarePositions(edge.x, edge.y, edge.angle, bondOrder);
        const sqColor = occupied ? '#44ff88' : hovered ? '#ffffff' : 'rgba(255,255,255,0.75)';

        return (
          <g key={edge.edgeIndex}>
            {/* Dashed guide line */}
            <line
              x1={edge.x} y1={edge.y} x2={ex2} y2={ey2}
              stroke={occupied ? '#44ff88' : hovered ? '#fff' : 'rgba(255,255,255,0.25)'}
              strokeWidth={hovered ? 2.5 : 1.5}
              strokeDasharray={occupied ? undefined : '4 3'}
            />
            {/* Snap dot */}
            <circle
              cx={ex2} cy={ey2}
              r={hovered ? 7 : 4.5}
              fill={occupied ? '#44ff88' : hovered ? '#fff' : 'rgba(255,255,255,0.12)'}
              stroke={hovered ? '#aaddff' : 'rgba(255,255,255,0.35)'}
              strokeWidth="1.5"
            />
            {/* Bond squares straddling the edge */}
            {sqPositions.map((pos, si) => (
              <rect
                key={si}
                x={pos.x}
                y={pos.y}
                width={BOND_SQUARE_SIZE}
                height={BOND_SQUARE_SIZE}
                fill={sqColor}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="0.75"
                rx="1"
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}
