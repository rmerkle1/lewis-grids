import {
  getPolygonRadius,
  getPolygonVertices,
  getEdgeMidpoints,
  polygonPointsStr,
  getBondSquarePositions,
  BOND_SQUARE_SIZE,
} from '../utils/geometry';
import { enToColor, centralOctetCount } from '../utils/overlays';

export default function PolygonAtom({
  cx, cy, n, element, color,
  bondPattern,
  occupiedEdges,
  caLinkedEdges,
  snapHoverEdge,
  rotation = 0,
  formalCharge = 0,
  baseValence = 4,
  atomId,
  activeOverlay,
  onPointerDown,
  onSelect,
  onBondSquareDragStart,
}) {
  const polyN = n === 2 ? 4 : n;
  const R = getPolygonRadius(polyN);
  const vertices = getPolygonVertices(cx, cy, R, polyN, rotation);
  const edgeMidpoints = getEdgeMidpoints(cx, cy, vertices);
  const pointsStr = polygonPointsStr(vertices);

  // ── Overlay computations ────────────────────────────────────────────────
  const fillColor = activeOverlay === 'en' ? enToColor(element) : (color || '#4f5b6f');

  const electronCount  = baseValence - formalCharge;
  const octetCount     = centralOctetCount(electronCount, bondPattern, occupiedEdges);
  const octetSatisfied = octetCount === 8;

  // Formal charge glow/vignette only when no overlay is showing a different visual
  const showChargeFx = !activeOverlay || activeOverlay === 'en';
  const glowFilter = showChargeFx && formalCharge < 0
    ? `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 14px ${color})`
    : undefined;

  const vignetteId = `vignette-${atomId}`;
  const blurFilterId = `blur-${atomId}`;

  const showBlurredLabel = activeOverlay === 'fc' || activeOverlay === 'octet';

  // ── Overlay label content ───────────────────────────────────────────────
  let overlayText = null;
  let overlayFill = '#fff';
  if (activeOverlay === 'fc') {
    overlayText = formalCharge === 0 ? '0'
      : formalCharge > 0 ? `+${formalCharge}`
      : `${formalCharge}`;
    overlayFill = 'rgba(255,255,255,0.75)';
  } else if (activeOverlay === 'octet') {
    overlayText = octetSatisfied ? '✓' : '✗';
    overlayFill = octetSatisfied ? '#66ee88' : '#ff5555';
  }

  return (
    <g
      className="polygon-atom"
      style={{ cursor: onPointerDown ? 'grab' : 'default', filter: glowFilter }}
    >
      {/* SVG defs */}
      <defs>
        {showChargeFx && formalCharge > 0 && (
          <radialGradient id={vignetteId} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R}>
            <stop offset="30%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.55" />
          </radialGradient>
        )}
        {showBlurredLabel && (
          <filter id={blurFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        )}
      </defs>

      {/* Polygon fill */}
      <polygon
        points={pointsStr}
        fill={fillColor}
        stroke="none"
        style={{ pointerEvents: onPointerDown ? 'auto' : 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
      />

      {/* Positive charge vignette overlay (only when no other overlay active) */}
      {showChargeFx && formalCharge > 0 && (
        <polygon
          points={pointsStr}
          fill={`url(#${vignetteId})`}
          stroke="none"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Element label — blurred when fc/octet overlay is active */}
      <text
        x={cx} y={cy}
        textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize="20" fontWeight="bold" fontFamily="Georgia, serif"
        opacity={showBlurredLabel ? 0.25 : 1}
        filter={showBlurredLabel ? `url(#${blurFilterId})` : undefined}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
        transform={rotation !== 0 ? `rotate(${-rotation}, ${cx}, ${cy})` : undefined}
      >
        {element}
      </text>

      {/* Overlay value (formal charge or octet check) */}
      {overlayText && (
        <text
          x={cx} y={cy}
          textAnchor="middle" dominantBaseline="central"
          fill={overlayFill}
          fontSize="22" fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          filter={activeOverlay === 'octet'
            ? (octetSatisfied
                ? 'drop-shadow(0 0 6px rgba(80,220,100,0.7))'
                : 'drop-shadow(0 0 6px rgba(255,60,60,0.7))')
            : (formalCharge !== 0
                ? (formalCharge < 0
                    ? 'drop-shadow(0 0 6px rgba(255,140,80,0.6))'
                    : 'drop-shadow(0 0 6px rgba(100,200,255,0.6))')
                : undefined)}
        >
          {overlayText}
        </text>
      )}

      {/* Per-edge: snap indicator + bond squares */}
      {edgeMidpoints.map((edge) => {
        const bondOrder = bondPattern[edge.edgeIndex];
        if (bondOrder == null) return null;

        const occupied  = occupiedEdges?.includes(edge.edgeIndex);
        const caLinked  = caLinkedEdges?.includes(edge.edgeIndex);
        // cardOccupied: edge taken by an outer atom card (hide all edge visuals)
        const cardOccupied = occupied && !caLinked;
        const hovered   = snapHoverEdge === edge.edgeIndex;

        const extLen = 18;
        const ex2 = edge.x + extLen * Math.cos(edge.angle);
        const ey2 = edge.y + extLen * Math.sin(edge.angle);

        const sqPositions = getBondSquarePositions(edge.x, edge.y, edge.angle, bondOrder);

        return (
          <g key={edge.edgeIndex} style={{ pointerEvents: 'none' }}>
            {/* Dashed approach line + hover dot — only on free edges */}
            {!cardOccupied && !caLinked && (
              <line
                x1={edge.x} y1={edge.y} x2={ex2} y2={ey2}
                stroke={hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.18)'}
                strokeWidth={hovered ? 2 : 1.5}
                strokeDasharray="4 3"
              />
            )}
            {!cardOccupied && !caLinked && (
              <circle
                cx={ex2} cy={ey2}
                r={hovered ? 6 : 3.5}
                fill={hovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.12)'}
                stroke="none"
              />
            )}
            {/* White bond squares on free edges (draggable for electron transfer) */}
            {!cardOccupied && !caLinked && sqPositions.map((pos, si) => (
              <rect
                key={si}
                x={pos.cx - BOND_SQUARE_SIZE / 2}
                y={pos.cy - BOND_SQUARE_SIZE / 2}
                width={BOND_SQUARE_SIZE}
                height={BOND_SQUARE_SIZE}
                fill={hovered ? '#ffffff' : 'rgba(255,255,255,0.82)'}
                stroke="none"
                rx="2"
                transform={`rotate(${pos.angleDeg}, ${pos.cx}, ${pos.cy})`}
                style={{ pointerEvents: onBondSquareDragStart ? 'auto' : 'none', cursor: onBondSquareDragStart ? 'grab' : 'default' }}
                onPointerDown={onBondSquareDragStart ? (e) => onBondSquareDragStart(edge.edgeIndex, e) : undefined}
              />
            ))}
            {/* Grey bond squares on CA–CA linked edges — show the shared bond */}
            {caLinked && sqPositions.map((pos, si) => (
              <rect
                key={`ca-${si}`}
                x={pos.cx - BOND_SQUARE_SIZE / 2}
                y={pos.cy - BOND_SQUARE_SIZE / 2}
                width={BOND_SQUARE_SIZE}
                height={BOND_SQUARE_SIZE}
                fill="rgba(255,255,255,0.45)"
                stroke="none"
                rx="2"
                transform={`rotate(${pos.angleDeg}, ${pos.cx}, ${pos.cy})`}
                style={{ pointerEvents: 'none' }}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}
