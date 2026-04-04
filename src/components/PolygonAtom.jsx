import {
  getPolygonRadius,
  getPolygonVertices,
  getEdgeMidpoints,
  polygonPointsStr,
  getBondSquarePositions,
  BOND_SQUARE_SIZE,
} from '../utils/geometry';

export default function PolygonAtom({
  cx, cy, n, element, color,
  bondPattern,
  occupiedEdges,
  snapHoverEdge,
  onPointerDown, // for draggable central atoms
}) {
  const polyN = n === 2 ? 4 : n;
  const R = getPolygonRadius(polyN);
  const vertices = getPolygonVertices(cx, cy, R, polyN);
  const edgeMidpoints = getEdgeMidpoints(cx, cy, vertices);
  const pointsStr = polygonPointsStr(vertices);

  return (
    <g className="polygon-atom" style={{ cursor: onPointerDown ? 'grab' : 'default' }}>
      {/* Clickable/draggable area */}
      <polygon
        points={pointsStr}
        fill={color || '#444'}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        opacity="0.9"
        style={{ pointerEvents: onPointerDown ? 'auto' : 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
      />

      {/* Element label */}
      <text
        x={cx} y={cy}
        textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize="20" fontWeight="bold" fontFamily="Georgia, serif"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {element}
      </text>

      {/* Per-edge: snap indicator + bond squares */}
      {edgeMidpoints.map((edge) => {
        const bondOrder = bondPattern[edge.edgeIndex];
        if (bondOrder == null) return null;

        const occupied = occupiedEdges?.includes(edge.edgeIndex);
        const hovered  = snapHoverEdge === edge.edgeIndex;

        const extLen = 20;
        const ex2 = edge.x + extLen * Math.cos(edge.angle);
        const ey2 = edge.y + extLen * Math.sin(edge.angle);

        const sqColor = occupied ? '#44ff88' : hovered ? '#ffffff' : 'rgba(255,255,255,0.8)';
        const sqPositions = getBondSquarePositions(edge.x, edge.y, edge.angle, bondOrder);

        return (
          <g key={edge.edgeIndex} style={{ pointerEvents: 'none' }}>
            {/* Dashed guide extension */}
            <line
              x1={edge.x} y1={edge.y} x2={ex2} y2={ey2}
              stroke={occupied ? '#44ff88' : hovered ? '#fff' : 'rgba(255,255,255,0.22)'}
              strokeWidth={hovered ? 2.5 : 1.5}
              strokeDasharray={occupied ? undefined : '4 3'}
            />
            <circle
              cx={ex2} cy={ey2}
              r={hovered ? 7 : 4}
              fill={occupied ? '#44ff88' : hovered ? '#fff' : 'rgba(255,255,255,0.1)'}
              stroke={hovered ? '#adf' : 'rgba(255,255,255,0.35)'}
              strokeWidth="1.5"
            />
            {/* Bond squares — inside polygon, rotated to align with edge */}
            {sqPositions.map((pos, si) => (
              <rect
                key={si}
                x={pos.cx - BOND_SQUARE_SIZE / 2}
                y={pos.cy - BOND_SQUARE_SIZE / 2}
                width={BOND_SQUARE_SIZE}
                height={BOND_SQUARE_SIZE}
                fill={sqColor}
                stroke="rgba(0,0,0,0.25)"
                strokeWidth="0.75"
                rx="2"
                transform={`rotate(${pos.angleDeg}, ${pos.cx}, ${pos.cy})`}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}
