import { useMemo } from 'react';
import { getStartAngle } from '../utils/geometry';
import './MoleculeViewer2D.css';

// ── Constants ──────────────────────────────────────────────────────────────────

const OUTER_BOND_LEN = 90;   // px from CA center to outer atom center
const CA_CA_SPACING  = 130;  // px between adjacent CA centers (multi-CA layout)
const LP_CA_DIST     = 28;   // distance from CA center to lone-pair dots (same as outer atom)
const LP_OA_DIST     = 28;   // distance from outer atom center to lone-pair dots
const LP_DOT_R       = 3.5;  // lone pair dot radius
const LP_DOT_HALF    = 5;    // half-spacing between the two LP dots (perpendicular)
const CA_KNOCK_R     = 20;   // white knockout circle radius at central atom
const OA_KNOCK_R     = 16;   // white knockout circle radius at outer atom

// ── Geometry helpers ───────────────────────────────────────────────────────────

/**
 * Natural outward angle (degrees) of edge i for an n-sided polygon at rotation=0.
 * Matches the formula used in App.jsx's naturalEdgeAngle0.
 */
function naturalEdgeAngleDeg(n, i) {
  return getStartAngle(n) + i * (360 / n) + (180 / n);
}

/**
 * Two dot positions for a lone pair centered at (cx, cy), pair aligned
 * perpendicular to `dirDeg`.
 */
function lonePairDotPositions(cx, cy, dirDeg) {
  const perpRad = (dirDeg * Math.PI) / 180 + Math.PI / 2;
  return [
    { x: cx + LP_DOT_HALF * Math.cos(perpRad), y: cy + LP_DOT_HALF * Math.sin(perpRad) },
    { x: cx - LP_DOT_HALF * Math.cos(perpRad), y: cy - LP_DOT_HALF * Math.sin(perpRad) },
  ];
}

/**
 * Returns array of { key, x1, y1, x2, y2 } for parallel bond lines.
 */
function parallelBondLines(x1, y1, x2, y2, bondOrder) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const OFFSETS = bondOrder === 1 ? [0] : bondOrder === 2 ? [-3.5, 3.5] : [-5, 0, 5];
  return OFFSETS.map((off, i) => ({
    key: i,
    x1: x1 + nx * off, y1: y1 + ny * off,
    x2: x2 + nx * off, y2: y2 + ny * off,
  }));
}

// ── Layout ─────────────────────────────────────────────────────────────────────

/**
 * Compute canonical 2D positions for each central atom.
 * Single CA: centered. Multi-CA: horizontal chain with correct rotAdj
 * so the CA–CA bond is horizontal.
 *
 * Returns { [caId]: { x, y, rotAdj } }
 */
function computeLayout(centralAtoms, centralLinks, svgW, svgH) {
  const result = {};
  if (!centralAtoms.length) return result;

  if (centralAtoms.length === 1) {
    result[centralAtoms[0].id] = { x: svgW / 2, y: svgH / 2, rotAdj: 0 };
    return result;
  }

  const totalW = (centralAtoms.length - 1) * CA_CA_SPACING;
  let x = (svgW - totalW) / 2;

  for (let i = 0; i < centralAtoms.length; i++) {
    const ca    = centralAtoms[i];
    const polyN = ca.domains === 2 ? 4 : ca.domains;
    let rotAdj  = 0;

    // Find the link that connects this CA to its neighbor in the chain
    const link = centralLinks.find((l) =>
      i === 0
        ? l.id1 === ca.id || l.id2 === ca.id
        : (l.id1 === centralAtoms[i - 1].id && l.id2 === ca.id) ||
          (l.id2 === centralAtoms[i - 1].id && l.id1 === ca.id)
    );

    if (link) {
      const myEdge   = link.id1 === ca.id ? link.edgeIndex1 : link.edgeIndex2;
      const natAngle = naturalEdgeAngleDeg(polyN, myEdge);
      // First CA: its link edge should point right (0°)
      // Later CAs: their link edge to the previous CA should point left (180°)
      rotAdj = i === 0 ? -natAngle : 180 - natAngle;
    }

    result[ca.id] = { x, y: svgH / 2, rotAdj };
    x += CA_CA_SPACING;
  }

  return result;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function MoleculeViewer2D({ centralAtoms, centralLinks, cards, onClose }) {
  const nCAs  = centralAtoms.length;
  const links = centralLinks ?? [];

  // SVG canvas dimensions — 380×380 for single CA (matches 3D viewer); grow wider for multi-CA
  const SVG_W = nCAs <= 1 ? 380 : 140 + (nCAs - 1) * CA_CA_SPACING + 140;
  const SVG_H = 380;

  const layout = useMemo(
    () => computeLayout(centralAtoms, links, SVG_W, SVG_H),
    [centralAtoms, links, SVG_W, SVG_H]  // SVG_W/H derived from centralAtoms.length
  );

  // ── Build SVG elements in draw order ────────────────────────────────────────
  // Order: bond lines → lone pair dots → knockout circles → element labels
  const svgElements = useMemo(() => {
    const bondLines  = [];
    const lpDotElems = [];
    const knockouts  = [];
    const lblElems   = [];

    for (const ca of centralAtoms) {
      const pos = layout[ca.id];
      if (!pos) continue;

      const { x: cx, y: cy, rotAdj } = pos;
      const polyN = ca.domains === 2 ? 4 : ca.domains;

      // Cards snapped to this CA
      const snappedCards = cards.filter((c) => c.snappedEdge?.centralId === ca.id);

      // CA–CA links involving this CA
      const caLinks = links.filter((l) => l.id1 === ca.id || l.id2 === ca.id);

      // Each active domain edge
      Object.keys(ca.bondPattern)
        .map(Number)
        .filter((i) => ca.bondPattern[i] != null)
        .forEach((edgeIdx) => {
          const angleDeg = naturalEdgeAngleDeg(polyN, edgeIdx) + rotAdj;
          const angleRad = (angleDeg * Math.PI) / 180;

          const card   = snappedCards.find((c) => c.snappedEdge.edgeIndex === edgeIdx);
          const caLink = caLinks.find(
            (l) =>
              (l.id1 === ca.id && l.edgeIndex1 === edgeIdx) ||
              (l.id2 === ca.id && l.edgeIndex2 === edgeIdx)
          );

          if (card) {
            // ── Bond to outer atom ─────────────────────────────────────
            const ox = cx + OUTER_BOND_LEN * Math.cos(angleRad);
            const oy = cy + OUTER_BOND_LEN * Math.sin(angleRad);
            const bo = card.snappedEdge.bondOrder ?? 1;

            parallelBondLines(cx, cy, ox, oy, bo).forEach((l) =>
              bondLines.push(
                <line
                  key={`bond-${ca.id}-${edgeIdx}-${l.key}`}
                  x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke="#111" strokeWidth="2" strokeLinecap="round"
                />
              )
            );

            // Outer atom knockout + label
            knockouts.push(
              <circle key={`ko-oa-${card.id}`} cx={ox} cy={oy} r={OA_KNOCK_R} fill="white" />
            );
            lblElems.push(
              <text
                key={`lbl-oa-${card.id}`}
                x={ox} y={oy}
                textAnchor="middle" dominantBaseline="central"
                fontSize="16" fontWeight="bold" fontFamily="Georgia, serif" fill="#111"
              >
                {card.element}
              </text>
            );

            // ── Lone pairs on outer atom ───────────────────────────────
            // When snapped at CA edge angle θ:
            //   card edge 0 (top, away from CA) → direction angleDeg
            //   card edge 1 (right)             → direction angleDeg + 90°
            //   card edge 3 (left)              → direction angleDeg − 90°
            const oaEdgeAngle = { 0: angleDeg, 1: angleDeg + 90, 3: angleDeg - 90 };
            for (const ei of [0, 1, 3]) {
              const count = card.electrons?.[ei] ?? 0;
              if (count === 0) continue;
              const lpAngleDeg = oaEdgeAngle[ei];
              const lpAngleRad = (lpAngleDeg * Math.PI) / 180;
              const lpCx = ox + LP_OA_DIST * Math.cos(lpAngleRad);
              const lpCy = oy + LP_OA_DIST * Math.sin(lpAngleRad);
              if (count >= 2) {
                lonePairDotPositions(lpCx, lpCy, lpAngleDeg).forEach((d, di) =>
                  lpDotElems.push(
                    <circle
                      key={`lp-oa-${card.id}-${ei}-${di}`}
                      cx={d.x} cy={d.y} r={LP_DOT_R} fill="#111"
                    />
                  )
                );
              } else {
                // Single unpaired electron — one dot
                lpDotElems.push(
                  <circle
                    key={`se-oa-${card.id}-${ei}`}
                    cx={lpCx} cy={lpCy} r={LP_DOT_R} fill="#111"
                  />
                );
              }
            }
          } else if (caLink) {
            // ── CA–CA bond (draw only once, from id1's perspective) ────
            if (caLink.id1 === ca.id) {
              const otherPos = layout[caLink.id2];
              if (otherPos) {
                parallelBondLines(cx, cy, otherPos.x, otherPos.y, caLink.bondOrder ?? 1).forEach(
                  (l) =>
                    bondLines.push(
                      <line
                        key={`ca-bond-${caLink.id1}-${caLink.id2}-${l.key}`}
                        x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                        stroke="#111" strokeWidth="2" strokeLinecap="round"
                      />
                    )
                );
              }
            }
          } else {
            // ── Lone pair domain on CA (no bond here) ─────────────────
            const lpCx = cx + LP_CA_DIST * Math.cos(angleRad);
            const lpCy = cy + LP_CA_DIST * Math.sin(angleRad);
            lonePairDotPositions(lpCx, lpCy, angleDeg).forEach((d, di) =>
              lpDotElems.push(
                <circle
                  key={`lp-ca-${ca.id}-${edgeIdx}-${di}`}
                  cx={d.x} cy={d.y} r={LP_DOT_R} fill="#111"
                />
              )
            );
          }
        });

      // ── CA knockout circle + label ─────────────────────────────────────
      knockouts.push(
        <circle key={`ko-ca-${ca.id}`} cx={cx} cy={cy} r={CA_KNOCK_R} fill="white" />
      );
      lblElems.push(
        <text
          key={`lbl-ca-${ca.id}`}
          x={cx} y={cy}
          textAnchor="middle" dominantBaseline="central"
          fontSize="20" fontWeight="bold" fontFamily="Georgia, serif" fill="#111"
        >
          {ca.element}
        </text>
      );
    }

    return [...bondLines, ...lpDotElems, ...knockouts, ...lblElems];
  }, [centralAtoms, links, cards, layout]);

  if (!nCAs) return null;

  return (
    <div className="viewer2d">
      <div className="viewer2d-header">
        <span className="viewer2d-title">2D Lewis Structure</span>
        <span className="viewer2d-hint">structural formula</span>
        <button className="viewer2d-close" onClick={onClose}>×</button>
      </div>
      <svg
        className="viewer2d-svg"
        width={SVG_W}
        height={SVG_H}
      >
        {svgElements}
      </svg>
    </div>
  );
}
