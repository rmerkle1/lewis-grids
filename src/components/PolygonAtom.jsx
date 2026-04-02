import { getPolygonVertices, getEdgeMidpoints, polygonPointsStr } from '../utils/geometry';

const POLYGON_RADIUS = 64;

export { POLYGON_RADIUS };

export default function PolygonAtom({ cx, cy, n, element, color, occupiedEdges, snapHoverEdge }) {
  const vertices = getPolygonVertices(cx, cy, POLYGON_RADIUS, n);
  const edgeMidpoints = getEdgeMidpoints(cx, cy, vertices);
  const pointsStr = polygonPointsStr(vertices);

  return (
    <g className="polygon-atom">
      {/* Polygon shape */}
      <polygon
        points={pointsStr}
        fill={color || '#444'}
        stroke="#fff"
        strokeWidth="2.5"
        opacity="0.92"
      />

      {/* Element label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize="22"
        fontWeight="bold"
        fontFamily="monospace"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {element}
      </text>

      {/* Edge snap indicators */}
      {edgeMidpoints.map((edge) => {
        const occupied = occupiedEdges?.includes(edge.edgeIndex);
        const hovered = snapHoverEdge === edge.edgeIndex;

        // Draw a small extension line from the edge outward
        const extLen = 28;
        const ex2 = edge.x + extLen * Math.cos(edge.angle);
        const ey2 = edge.y + extLen * Math.sin(edge.angle);

        return (
          <g key={edge.edgeIndex}>
            <line
              x1={edge.x}
              y1={edge.y}
              x2={ex2}
              y2={ey2}
              stroke={occupied ? '#44ff88' : hovered ? '#fff' : 'rgba(255,255,255,0.3)'}
              strokeWidth={hovered ? 3 : 1.5}
              strokeDasharray={occupied ? undefined : '4 3'}
            />
            <circle
              cx={ex2}
              cy={ey2}
              r={hovered ? 8 : 5}
              fill={occupied ? '#44ff88' : hovered ? '#fff' : 'rgba(255,255,255,0.15)'}
              stroke={hovered ? '#adf' : 'rgba(255,255,255,0.4)'}
              strokeWidth="1.5"
            />
          </g>
        );
      })}
    </g>
  );
}

export function usePolygonEdges(cx, cy, n) {
  const vertices = getPolygonVertices(cx, cy, POLYGON_RADIUS, n);
  return getEdgeMidpoints(cx, cy, vertices);
}
